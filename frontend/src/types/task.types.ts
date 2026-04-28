import { Timestamp } from 'firebase/firestore';

export type TaskStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface SuggestedVolunteer {
  uid: string;
  name: string;
  matchScore: number;
  breakdown: Record<string, number>;
  distanceKm: number;
}

export interface Task {
  taskId: string;
  linkedNeedId: string;
  title: string;
  description: string;
  area: string;
  lat: number;
  lng: number;
  requiredSkills: string[];
  volunteersNeeded: number;
  suggestedVolunteers: SuggestedVolunteer[];
  assignedVolunteers: string[];
  confirmedVolunteers: string[];
  status: TaskStatus;
  scheduledDate: string;
  scheduledDay: string;
  createdBy: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
