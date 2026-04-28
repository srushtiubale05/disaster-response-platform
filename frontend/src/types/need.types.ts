import { Timestamp } from 'firebase/firestore';

export type NeedCategory =
  | 'medical'
  | 'shelter'
  | 'food_distribution'
  | 'education'
  | 'water_sanitation'
  | 'general';

export type NeedSeverity = 'low' | 'medium' | 'high' | 'critical';
export type NeedStatus = 'open' | 'task_created' | 'resolved';

export interface ScoreBreakdown {
  volume: number;
  severity: number;
  recency: number;
  category: number;
}

export interface Need {
  needId: string;
  area: string;
  lat: number;
  lng: number;
  category: NeedCategory;
  description: string;
  severity: NeedSeverity;
  reportedCount: number;
  urgencyScore: number;
  scoreBreakdown: ScoreBreakdown;
  status: NeedStatus;
  createdAt: Timestamp;
  createdBy: string;
}
