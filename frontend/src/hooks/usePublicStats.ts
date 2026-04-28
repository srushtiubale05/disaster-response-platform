/**
 * Fetches public impact stats from Firestore without auth.
 * Used on the Login page to show live impact numbers.
 */
import { useEffect, useState } from 'react';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../services/firebase';

export interface PublicStats {
  totalNeeds: number;
  resolvedNeeds: number;
  totalVolunteers: number;
  completedTasks: number;
  loading: boolean;
}

export function usePublicStats(): PublicStats {
  const [stats, setStats] = useState<PublicStats>({
    totalNeeds: 0, resolvedNeeds: 0,
    totalVolunteers: 0, completedTasks: 0, loading: true,
  });

  useEffect(() => {
    const db = getFirestore(app);
    async function fetch() {
      try {
        const [needsSnap, volSnap, tasksSnap] = await Promise.all([
          getDocs(collection(db, 'needs')),
          getDocs(collection(db, 'volunteers')),
          getDocs(collection(db, 'tasks')),
        ]);
        setStats({
          totalNeeds: needsSnap.size,
          resolvedNeeds: needsSnap.docs.filter(d => d.data().status === 'resolved').length,
          totalVolunteers: volSnap.size,
          completedTasks: tasksSnap.docs.filter(d => d.data().status === 'completed').length,
          loading: false,
        });
      } catch {
        setStats(s => ({ ...s, loading: false }));
      }
    }
    fetch();
  }, []);

  return stats;
}
