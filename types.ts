
export enum Role {
  CITIZEN = 'Citizen',
  VOLUNTEER = 'Volunteer',
  COMMUNITY_LEADER = 'Leader',
  EMERGENCY_DESK = 'Desk',
  DISPATCHER = 'Dispatcher',
  ANALYST = 'Analyst',
  FIELD_OPERATOR = 'FieldOperator',
  OWNER = 'Owner'
}

export enum IncidentCategory {
  MEDICAL = 'Medical',
  FIRE = 'Fire',
  FLOOD = 'Flood',
  STORM = 'Storm',
  EARTHQUAKE = 'Earthquake',
  SECURITY = 'Security',
  THEFT = 'Theft',
  PUBLIC_HEALTH = 'PublicHealth',
  HAZARD = 'Hazard',
  KIDNAPPING = 'Kidnapping',
  OTHER = 'Other'
}

export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum IncidentStatus {
  REPORTED = 'Reported',
  ACKNOWLEDGED = 'Acknowledged',
  IN_PROGRESS = 'InProgress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  trustScore: number;
  walletAddress: string;
  avatar: string;
  location: string;
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
  translatedDescription?: string;
  category: IncidentCategory;
  severity: Severity;
  status: IncidentStatus;
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
  incidentId: string;
  donorAddress: string;
  amount: string;
  currency: 'ETH' | 'USDC';
  timestamp: number;
}

export interface Notification {
  id: string;
  type: 'incident' | 'system' | 'donation';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  incidentId: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isAi?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High' | 'Security';
  timestamp: number;
  authorId: string;
  location?: string;
}
