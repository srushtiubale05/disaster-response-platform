import { Timestamp } from 'firebase/firestore';

export type UserRole = 'volunteer' | 'coordinator' | 'admin';

export interface AppUser {
  uid: string;
  role: UserRole;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
}
