import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserRole } from '../types/user.types';

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export async function registerVolunteer(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
  skills: string[];
  availability: string[];
  address: string;
}) {
  const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const uid = cred.user.uid;

  // /users for role lookup
  await setDoc(doc(db, 'users', uid), {
    uid,
    role: 'volunteer',
    email: data.email,
    displayName: data.name,
    createdAt: serverTimestamp(),
  });

  // /volunteers for profile
  await setDoc(doc(db, 'volunteers', uid), {
    uid,
    name: data.name,
    email: data.email,
    phone: data.phone,
    skills: data.skills,
    availability: data.availability,
    address: data.address,
    lat: 18.5204, // default Pune
    lng: 73.8567,
    reliabilityScore: 100,
    tasksCompleted: 0,
    tasksDeclined: 0,
    isAvailable: true,
    fcmTokens: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return cred;
}

export async function registerCoordinator(data: {
  email: string;
  password: string;
  name: string;
}) {
  const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const uid = cred.user.uid;

  await setDoc(doc(db, 'users', uid), {
    uid,
    role: 'coordinator',
    email: data.email,
    displayName: data.name,
    createdAt: serverTimestamp(),
  });

  return cred;
}

export async function getUserRole(uid: string): Promise<UserRole> {
  const snap = await getDoc(doc(db, 'users', uid));
  return (snap.data()?.role as UserRole) ?? 'volunteer';
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
