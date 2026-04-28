import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Need } from '../types/need.types';
import { Task } from '../types/task.types';

type Unsubscribe = () => void;

/** Real-time stream of needs ordered by urgency score DESC */
export function subscribeToNeeds(callback: (needs: Need[]) => void): Unsubscribe {
  const q = query(collection(db, 'needs'), orderBy('urgencyScore', 'desc'));
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const needs = snap.docs.map((d) => ({ needId: d.id, ...d.data() } as Need));
    callback(needs);
  });
}

/** Real-time stream of all tasks (coordinator view) */
export function subscribeToAllTasks(callback: (tasks: Task[]) => void): Unsubscribe {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs.map((d) => ({ taskId: d.id, ...d.data() } as Task));
    callback(tasks);
  });
}

/** Real-time stream of tasks assigned to a specific volunteer */
export function subscribeToVolunteerTasks(
  uid: string,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'tasks'),
    where('assignedVolunteers', 'array-contains', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs.map((d) => ({ taskId: d.id, ...d.data() } as Task));
    callback(tasks);
  });
}
