/**
 * Multi-Session System
 * Allows multiple coordinators/volunteers to be logged in simultaneously
 * in the same browser tab. Each session is an independent Firebase Auth
 * instance stored under a unique key.
 *
 * Architecture:
 *  - SessionManager: top-level component that renders the active session
 *  - useSession: hook to get/set the active session
 *  - Sessions are stored in localStorage as { id, label, role, email }[]
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { UserRole } from '../types/user.types';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const SESSIONS_KEY = 'dr_sessions';
const ACTIVE_KEY = 'dr_active_session';

export interface Session {
  id: string;       // unique app name e.g. "session_1"
  label: string;    // display name e.g. "Coordinator - Priya"
  email: string;
  role: UserRole | null;
  user: User | null;
  app: FirebaseApp;
}

interface SessionContextValue {
  sessions: Session[];
  activeSessionId: string;
  activeSession: Session | null;
  createSession: () => string;
  switchSession: (id: string) => void;
  removeSession: (id: string) => void;
  loginSession: (id: string, email: string, password: string) => Promise<string | null>;
  logoutSession: (id: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({} as SessionContextValue);

function getOrCreateApp(sessionId: string): FirebaseApp {
  const existing = getApps().find((a) => a.name === sessionId);
  if (existing) return existing;
  return initializeApp(FIREBASE_CONFIG, sessionId);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(() => {
    // Bootstrap: always have at least one session
    const s1Id = 'session_1';
    const app = getOrCreateApp(s1Id);
    return [{ id: s1Id, label: 'Session 1', email: '', role: null, user: null, app }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_KEY) ?? 'session_1';
  });

  // Subscribe to auth state for each session
  useEffect(() => {
    const unsubs = sessions.map((session) => {
      const auth = getAuth(session.app);
      return onAuthStateChanged(auth, async (user) => {
        let role: UserRole | null = null;
        if (user) {
          try {
            const db = getFirestore(session.app);
            const snap = await getDoc(doc(db, 'users', user.uid));
            role = (snap.data()?.role as UserRole) ?? 'volunteer';
          } catch (_) {}
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id
              ? {
                  ...s,
                  user,
                  role,
                  email: user?.email ?? s.email,
                  label: user
                    ? `${role === 'coordinator' ? '🎯' : '🙋'} ${user.email}`
                    : s.label,
                }
              : s
          )
        );
      });
    });
    return () => unsubs.forEach((u) => u());
  }, [sessions.length]); // re-subscribe only when session count changes

  const createSession = useCallback((): string => {
    const id = `session_${Date.now()}`;
    const app = getOrCreateApp(id);
    const newSession: Session = {
      id,
      label: `Session ${sessions.length + 1}`,
      email: '',
      role: null,
      user: null,
      app,
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(id);
    localStorage.setItem(ACTIVE_KEY, id);
    return id;
  }, [sessions.length]);

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  const removeSession = useCallback(
    async (id: string) => {
      if (sessions.length <= 1) return; // keep at least one
      const session = sessions.find((s) => s.id === id);
      if (session?.user) {
        await fbSignOut(getAuth(session.app));
      }
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        const next = remaining[0]?.id ?? 'session_1';
        setActiveSessionId(next);
        localStorage.setItem(ACTIVE_KEY, next);
      }
    },
    [sessions, activeSessionId]
  );

  const loginSession = useCallback(
    async (id: string, email: string, password: string): Promise<string | null> => {
      const session = sessions.find((s) => s.id === id);
      if (!session) return 'Session not found';
      try {
        await signInWithEmailAndPassword(getAuth(session.app), email, password);
        return null;
      } catch (e: unknown) {
        return (e as Error).message;
      }
    },
    [sessions]
  );

  const logoutSession = useCallback(
    async (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (!session) return;
      await fbSignOut(getAuth(session.app));
    },
    [sessions]
  );

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSessionId,
        activeSession,
        createSession,
        switchSession,
        removeSession,
        loginSession,
        logoutSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
