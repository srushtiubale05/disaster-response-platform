'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { computeUrgencyScore } = require('./scoring');
const { getTopMatches } = require('./matching');
const { classifyNeedCategory } = require('./nlp');

admin.initializeApp();
const db = admin.firestore();

// ── 1. onNeedCreated — auto-score urgency ─────────────────────────────────────
exports.onNeedCreated = functions.firestore
  .document('needs/{needId}')
  .onCreate(async (snap) => {
    const need = snap.data();
    const category = classifyNeedCategory(need.description);
    const { total, breakdown } = computeUrgencyScore({ ...need, category });

    await snap.ref.update({
      urgencyScore: total,
      scoreBreakdown: breakdown,
      category: need.category || category, // keep coordinator's choice if set
    });

    functions.logger.info(`[onNeedCreated] ${snap.id} score=${total}`);
  });

// ── 2. matchVolunteers — HTTP callable ────────────────────────────────────────
exports.matchVolunteers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { taskId } = data;
  if (!taskId) throw new functions.https.HttpsError('invalid-argument', 'taskId required');

  const taskSnap = await db.collection('tasks').doc(taskId).get();
  if (!taskSnap.exists) throw new functions.https.HttpsError('not-found', 'Task not found');
  const task = taskSnap.data();

  const volSnap = await db.collection('volunteers').get();
  const volunteers = volSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));

  const matches = getTopMatches(volunteers, task, 5);

  // Persist suggestions to task document
  const suggestions = matches.map((m) => ({
    uid: m.uid,
    name: m.name,
    matchScore: m.total,
    breakdown: m.breakdown,
    distanceKm: m.distanceKm,
    skills: m.skills || [],
  }));

  await db.collection('tasks').doc(taskId).update({ suggestedVolunteers: suggestions });

  functions.logger.info(`[matchVolunteers] task=${taskId} found ${matches.length} matches`);

  return {
    matches: matches.map((m) => ({
      uid: m.uid,
      name: m.name,
      email: m.email,
      skills: m.skills || [],
      availability: m.availability || [],
      reliabilityScore: m.reliabilityScore,
      isAvailable: m.isAvailable,
      matchScore: m.total,
      breakdown: m.breakdown,
      matchedSkills: m.matchedSkills,
      distanceKm: m.distanceKm,
    })),
  };
});

// ── 3. assignVolunteers — assign + send FCM notifications ─────────────────────
exports.assignVolunteers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { taskId, volunteerUids } = data;
  if (!taskId || !volunteerUids?.length) {
    throw new functions.https.HttpsError('invalid-argument', 'taskId and volunteerUids required');
  }

  await db.collection('tasks').doc(taskId).update({
    assignedVolunteers: volunteerUids,
    status: 'assigned',
  });

  // Send web push notifications to each assigned volunteer
  const notifPromises = volunteerUids.map(async (uid) => {
    const volSnap = await db.collection('volunteers').doc(uid).get();
    if (!volSnap.exists) return;
    const tokens = volSnap.data().fcmTokens || [];
    if (tokens.length === 0) return;

    const message = {
      notification: {
        title: '🚨 New Task Assigned',
        body: 'You have been assigned to a disaster response task. Check your dashboard.',
      },
      webpush: { fcmOptions: { link: `/volunteer/task/${taskId}` } },
      tokens,
    };

    try {
      await admin.messaging().sendEachForMulticast(message);
    } catch (err) {
      functions.logger.warn(`FCM failed for ${uid}:`, err.message);
    }
  });

  await Promise.all(notifPromises);
  functions.logger.info(`[assignVolunteers] task=${taskId} assigned to ${volunteerUids.length} volunteers`);

  return { success: true };
});

// ── 4. onTaskCompleted — recalculate reliability scores ───────────────────────
exports.onTaskCompleted = functions.firestore
  .document('tasks/{taskId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status === 'completed' || after.status !== 'completed') return;

    const uids = after.confirmedVolunteers || [];
    functions.logger.info(`[onTaskCompleted] updating ${uids.length} volunteers`);

    await Promise.all(
      uids.map(async (uid) => {
        const ref = db.collection('volunteers').doc(uid);
        const snap = await ref.get();
        if (!snap.exists) return;

        const vol = snap.data();
        const completed = (vol.tasksCompleted || 0) + 1;
        const declined = vol.tasksDeclined || 0;
        const total = completed + declined;
        const reliability = total > 0 ? Math.round((completed / total) * 100) : 100;

        await ref.update({
          tasksCompleted: completed,
          reliabilityScore: reliability,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`  volunteer=${uid} reliability=${reliability}%`);
      })
    );
  });
