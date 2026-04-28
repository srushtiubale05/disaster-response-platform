import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, where, onSnapshot, Firestore,
} from 'firebase/firestore';
import { useFirestore } from './useFirestore';
import { Task } from '../types/task.types';

export function useTasks() {
  const db: Firestore = useFirestore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ taskId: d.id, ...d.data() } as Task)));
      setLoading(false);
    });
    return unsub;
  }, [db]);

  return { tasks, loading };
}

export function useVolunteerTasks(uid: string) {
  const db: Firestore = useFirestore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'tasks'),
      where('assignedVolunteers', 'array-contains', uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ taskId: d.id, ...d.data() } as Task)));
      setLoading(false);
    });
    return unsub;
  }, [db, uid]);

  return { tasks, loading };
}
