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
  pendingSync?: boolean;
  // Privacy & disclosure
  isSensitive?: boolean;
  redactionReason?: string;
  locationRedaction?: 'none' | 'coarse' | 'hidden';
  secureRoomId?: string;
  ephemeralKeyId?: string;
  disclosure?: {
    scheduledAt?: number;
    isPublic?: boolean;
    summary?: string;
  };
}

export interface PlaybookStep {
  id: string;
  title: string;
  owner: string;
  expectedDurationMins: number;
  dueAt: number;
  status: 'Pending' | 'InProgress' | 'Done' | 'Late';
  requiredSkills: string[];
  resourcesNeeded: string[];
}

export interface PlaybookPlan {
  steps: PlaybookStep[];
  requiredSkills: string[];
  resourceGaps: string[];
  summary: string;
}

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorId: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  incidentId: string;
  senderId: string;
  text?: string;
  ciphertext?: string;
  isSecure?: boolean;
  isSystem?: boolean;
  timestamp: number;
}

export interface CommsStructuredReport {
  title: string;
  description: string;
  category?: IncidentCategory;
  severity?: Severity;
  locationName?: string;
  lat?: number;
  lng?: number;
  resourceNeeds?: string[];
  actions?: string[];
  victimsCount?: number;
  vehiclesInvolved?: number;
}