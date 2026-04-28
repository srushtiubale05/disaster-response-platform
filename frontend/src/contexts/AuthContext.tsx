import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { UserRole } from '../types/user.types';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  firebaseApp: FirebaseApp | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  firebaseApp: null,
});

interface Props {
  children: ReactNode;
  firebaseApp: FirebaseApp;
}

export function AuthProvider({ children, firebaseApp }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setRole((snap.data()?.role as UserRole) ?? 'volunteer');
        } catch {
          setRole('volunteer');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [firebaseApp]);

  return (
    <AuthContext.Provider value={{ user, role, loading, firebaseApp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
