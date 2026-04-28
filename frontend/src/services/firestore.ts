import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  runTransaction,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db as defaultDb } from './firebase';
import { Need } from '../types/need.types';
import { Task } from '../types/task.types';
import { Volunteer } from '../types/volunteer.types';

// All functions accept an optional `db` param — falls back to default app's db.
// Pages that have access to the session's firebaseApp should pass
// getFirestore(firebaseApp) to ensure the correct project is used.

// ── NEEDS ─────────────────────────────────────────────────────────────────────

export async function createNeed(
  data: Omit<Need, 'needId' | 'createdAt'>,
  db: Firestore = defaultDb
) {
  const ref = await addDoc(collection(db, 'needs'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getNeed(needId: string, db: Firestore = defaultDb): Promise<Need | null> {
  const snap = await getDoc(doc(db, 'needs', needId));
  if (!snap.exists()) return null;
  return { needId: snap.id, ...snap.data() } as Need;
}

export async function updateNeedStatus(needId: string, status: string, db: Firestore = defaultDb) {
  await updateDoc(doc(db, 'needs', needId), { status });
}

// ── TASKS ─────────────────────────────────────────────────────────────────────

export async function createTask(
  data: Omit<Task, 'taskId' | 'createdAt'>,
  db: Firestore = defaultDb
) {
  const ref = await addDoc(collection(db, 'tasks'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTask(taskId: string, db: Firestore = defaultDb): Promise<Task | null> {
  const snap = await getDoc(doc(db, 'tasks', taskId));
  if (!snap.exists()) return null;
  return { taskId: snap.id, ...snap.data() } as Task;
}

export async function updateTaskStatus(taskId: string, status: string, db: Firestore = defaultDb) {
  const update: Record<string, unknown> = { status };
  if (status === 'completed') update.completedAt = serverTimestamp();
  await updateDoc(doc(db, 'tasks', taskId), update);
}

export async function assignVolunteersToTask(
  taskId: string,
  uids: string[],
  db: Firestore = defaultDb
) {
  await updateDoc(doc(db, 'tasks', taskId), {
    assignedVolunteers: uids,
    status: 'assigned',
  });
}

export async function saveSuggestedVolunteers(
  taskId: string,
  suggestions: object[],
  db: Firestore = defaultDb
) {
  await updateDoc(doc(db, 'tasks', taskId), { suggestedVolunteers: suggestions });
}

export async function acceptTask(
  taskId: string,
  uid: string,
  db: Firestore = defaultDb
): Promise<string | null> {
  try {
    await runTransaction(db, async (txn) => {
      const ref = doc(db, 'tasks', taskId);
      const snap = await txn.get(ref);
      if (!snap.exists()) throw new Error('Task not found');

      const data = snap.data() as Task;
      const confirmed = data.confirmedVolunteers ?? [];
      const needed = data.volunteersNeeded ?? 1;

      if (confirmed.includes(uid)) throw new Error('Already accepted');
      if (confirmed.length >= needed) throw new Error('Task is already full');

      const newConfirmed = [...confirmed, uid];
      const newStatus = newConfirmed.length >= needed ? 'in_progress' : data.status;
      txn.update(ref, { confirmedVolunteers: newConfirmed, status: newStatus });
    });
    return null;
  } catch (e: unknown) {
    return (e as Error).message;
  }
}

export async function declineTask(taskId: string, uid: string, db: Firestore = defaultDb) {
  await updateDoc(doc(db, 'tasks', taskId), {
    assignedVolunteers: arrayRemove(uid),
    confirmedVolunteers: arrayRemove(uid),
  });
  await updateDoc(doc(db, 'volunteers', uid), {
    tasksDeclined: increment(1),
  });
}

// ── VOLUNTEERS ────────────────────────────────────────────────────────────────

export async function getVolunteer(uid: string, db: Firestore = defaultDb): Promise<Volunteer | null> {
  const snap = await getDoc(doc(db, 'volunteers', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as Volunteer;
}

export async function getAllVolunteers(db: Firestore = defaultDb): Promise<Volunteer[]> {
  const snap = await getDocs(collection(db, 'volunteers'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Volunteer));
}

export async function updateVolunteerAvailability(
  uid: string,
  isAvailable: boolean,
  db: Firestore = defaultDb
) {
  await updateDoc(doc(db, 'volunteers', uid), { isAvailable, updatedAt: serverTimestamp() });
}

export async function recalculateReliability(uid: string, db: Firestore = defaultDb) {
  const ref = doc(db, 'volunteers', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const vol = snap.data();
  const completed = (vol.tasksCompleted ?? 0) + 1;
  const declined = vol.tasksDeclined ?? 0;
  const total = completed + declined;
  const newScore = total > 0 ? Math.round((completed / total) * 100) : 100;
  await updateDoc(ref, {
    tasksCompleted: completed,
    reliabilityScore: newScore,
    updatedAt: serverTimestamp(),
  });
}
