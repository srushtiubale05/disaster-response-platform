/**
 * Returns the Firestore instance bound to the currently active session's
 * Firebase app. All hooks and services should use this instead of the
 * default `db` from firebase.ts so that multi-session works correctly.
 */
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { useAuthContext } from '../contexts/AuthContext';
import { app as defaultApp } from '../services/firebase';

export function useFirestore(): Firestore {
  const { firebaseApp } = useAuthContext();
  return getFirestore(firebaseApp ?? defaultApp);
}

export function useSessionFunctions(): Functions {
  const { firebaseApp } = useAuthContext();
  return getFunctions(firebaseApp ?? defaultApp);
}
