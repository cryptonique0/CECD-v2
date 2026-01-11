export enum Role {
  VOLUNTEER = 'Volunteer',
  COMMUNITY_LEADER = 'Leader',
  EMERGENCY_DESK = 'Desk',
  DISPATCHER = 'Dispatcher',
  ANALYST = 'Analyst',
  FIELD_OPERATOR = 'FieldOperator',
  OWNER = 'Owner'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  location?: string;
  lat?: number;
  lng?: number;
  skills: string[];
  isVerified: boolean;
  zkVerified?: boolean;
  status: 'Available' | 'Busy' | 'OffDuty';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  locationName: string;
  lat: number;
  lng: number;
  reporterId: string;
  timestamp: number;
  assignedResponders: string[];
  blockNumber?: number;
  hash?: string;
  confidenceScore?: number;
  isWhisperMode?: boolean;
  zkProof?: string;
}

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorId: string;
  timestamp: number;
}