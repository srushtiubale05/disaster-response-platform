import { useEffect, useState } from 'react';
import { doc, onSnapshot, Firestore } from 'firebase/firestore';
import { useFirestore } from './useFirestore';
import { Volunteer } from '../types/volunteer.types';

export function useVolunteer(uid: string) {
  const db: Firestore = useFirestore();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    // Use onSnapshot instead of getDoc so profile updates in real-time
    const unsub = onSnapshot(doc(db, 'volunteers', uid), (snap) => {
      setVolunteer(snap.exists() ? ({ uid: snap.id, ...snap.data() } as Volunteer) : null);
      setLoading(false);
    });
    return unsub;
  }, [db, uid]);

  return { volunteer, loading };
}
