import { httpsCallable, getFunctions } from 'firebase/functions';
import { Firestore } from 'firebase/firestore';
import { db as defaultDb, functions as defaultFunctions } from './firebase';
import { getAllVolunteers, getTask, saveSuggestedVolunteers, assignVolunteersToTask } from './firestore';
import { MatchedVolunteer } from '../types/volunteer.types';

// ── Client-side matching ──────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreVolunteer(volunteer: any, task: any) {
  const required = new Set((task.requiredSkills || []).map((s: string) => s.toLowerCase()));
  const has = new Set((volunteer.skills || []).map((s: string) => s.toLowerCase()));
  const matchedSkills = [...required].filter((s) => has.has(s));
  const skill = required.size === 0 ? 50 : (matchedSkills.length / required.size) * 50;

  const distanceKm = haversineKm(volunteer.lat ?? 0, volunteer.lng ?? 0, task.lat ?? 0, task.lng ?? 0);
  const proximity = Math.max(0, 25 - distanceKm * 2.5);

  const reliability = ((volunteer.reliabilityScore ?? 100) / 100) * 15;

  const taskDay = (task.scheduledDay || '').toLowerCase();
  const availability = (volunteer.availability || []).some(
    (d: string) => d.toLowerCase() === taskDay
  ) ? 10 : 0;

  const total = skill + proximity + reliability + availability;

  return {
    matchScore: Math.round(total * 100) / 100,
    breakdown: {
      skill: Math.round(skill * 100) / 100,
      proximity: Math.round(proximity * 100) / 100,
      reliability: Math.round(reliability * 100) / 100,
      availability,
      distanceKm: Math.round(distanceKm * 10) / 10,
    },
    matchedSkills,
    distanceKm: Math.round(distanceKm * 10) / 10,
  };
}

async function matchLocally(taskId: string, db: Firestore): Promise<MatchedVolunteer[]> {
  const [task, volunteers] = await Promise.all([getTask(taskId, db), getAllVolunteers(db)]);
  if (!task) throw new Error('Task not found');

  const available = volunteers.filter((v) => v.isAvailable !== false);
  const scored = available
    .map((v) => ({ ...v, ...scoreVolunteer(v, task) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5) as MatchedVolunteer[];

  await saveSuggestedVolunteers(
    taskId,
    scored.map((m) => ({
      uid: m.uid, name: m.name,
      matchScore: m.matchScore,
      breakdown: m.breakdown,
      distanceKm: m.distanceKm,
      skills: m.skills,
    })),
    db
  );

  return scored;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getTopMatches(
  taskId: string,
  db: Firestore = defaultDb
): Promise<MatchedVolunteer[]> {
  try {
    const fn = httpsCallable<{ taskId: string }, { matches: MatchedVolunteer[] }>(
      defaultFunctions, 'matchVolunteers'
    );
    const result = await fn({ taskId });
    return result.data.matches;
  } catch {
    console.info('[api] Cloud Function unavailable, running client-side matching');
    return matchLocally(taskId, db);
  }
}

export async function assignVolunteers(
  taskId: string,
  volunteerUids: string[],
  db: Firestore = defaultDb
) {
  try {
    const fn = httpsCallable(defaultFunctions, 'assignVolunteers');
    return await fn({ taskId, volunteerUids });
  } catch {
    await assignVolunteersToTask(taskId, volunteerUids, db);
    console.info('[api] Assigned via Firestore fallback (no FCM notifications)');
  }
}
