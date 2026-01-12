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
  // Privacy & Certifications
  certifications?: string[]; // EMT-B, EMT-P, RN, MD, etc.
  hasMFA?: boolean;
  jurisdiction?: string;
  consentGiven?: boolean;
  dataRetentionPreference?: 'minimum' | 'standard' | 'maximum';
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
  // Jurisdiction & Compliance
  jurisdiction?: 'EU' | 'US' | 'US_CALIFORNIA' | 'UK' | 'CANADA' | 'AUSTRALIA' | 'GLOBAL';
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted' | 'medical' | 'pii';
  retentionPeriod?: number; // days
  deletionScheduledAt?: number; // timestamp
  anonymizedAt?: number; // timestamp
  // Encrypted Fields
  medicalNotes?: any; // EncryptedField or string
  patientVitals?: any; // EncryptedField or object
  personalInfo?: any; // EncryptedField or object
  witnessStatements?: any; // EncryptedField or array
  // GDPR/HIPAA
  consentRequired?: boolean;
  consentObtained?: boolean;
  crossBorderTransfer?: boolean;
  breachNotified?: boolean;
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

// === SIMULATION & TRAINING TYPES ===

export interface SimulationEvent {
  id: string;
  timestamp: number; // Relative to simulation start
  type: 'incident_update' | 'resource_dispatch' | 'victim_update' | 'communication' | 'hazard_change' | 'decision_point';
  description: string;
  data: Record<string, any>;
  incidentUpdates?: Partial<Incident>;
}

export interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: Severity;
  initialLocation: { lat: number; lng: number };
  initialDescription: string;
  estimatedDurationMins: number;
  events: SimulationEvent[];
  objectives: string[];
  requiredCertifications?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  createdAt: number;
  createdBy: string;
}

export interface SimulationRun {
  id: string;
  scenarioId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  currentEventIndex: number;
  isPaused: boolean;
  isComplete: boolean;
  timeScale: number; // 1 = real time, 60 = 60x speed
  decisions: SimulationDecision[];
  incidentState: Partial<Incident>;
}

export interface SimulationDecision {
  timestamp: number;
  eventId?: string;
  decision: string;
  responseTime: number; // ms from decision point presented to response given
  isOptimal: boolean;
  feedback?: string;
}

export interface TrainingScore {
  id: string;
  userId: string;
  simulationRunId: string;
  scenarioId: string;
  scenarioTitle: string;
  timestamp: number;
  duration: number; // ms
  score: number; // 0-100
  decisions: {
    total: number;
    correct: number;
    incorrect: number;
  };
  avgResponseTimeMs: number;
  weakPoints: Array<{
    eventId: string;
    decision: string;
    feedback: string;
  }>;
  certificationsEarned: string[];
}

export interface UserProgress {
  userId: string;
  completedModules: string[];
  completedScenarios: string[];
  trainingScores: TrainingScore[];
  certifications: Array<{
    name: string;
    earnedAt: number;
    expiresAt?: number;
  }>;
  totalTrainingTimeHours: number;
  averageScore: number;
  lastTrainingDate: number;
}