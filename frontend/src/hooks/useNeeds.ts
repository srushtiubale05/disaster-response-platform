import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Firestore } from 'firebase/firestore';
import { useFirestore } from './useFirestore';
import { Need } from '../types/need.types';

export function useNeeds() {
  const db: Firestore = useFirestore();
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'needs'), orderBy('urgencyScore', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNeeds(snap.docs.map((d) => ({ needId: d.id, ...d.data() } as Need)));
      setLoading(false);
    });
    return unsub;
  }, [db]);

  return { needs, loading };
}
