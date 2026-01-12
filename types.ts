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

// Knowledge Base & Learning
export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  views: number;
  helpful: number;
  unhelpful: number;
  lastUpdated: number;
  author: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // minutes
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: TrainingLesson[];
  quiz?: TrainingQuiz;
  certified: boolean;
}

export interface TrainingLesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: number;
  completed: boolean;
}

export interface TrainingQuiz {
  id: string;
  questions: QuizQuestion[];
  passingScore: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  explanation: string;
}

export interface VolunteerProgress {
  volunteerId: string;
  moduleId: string;
  completedLessons: number;
  totalLessons: number;
  startedAt: number;
  completedAt?: number;
  quizScore?: number;
  certified: boolean;
}

// Community & Gamification
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: string;
  unlockedAt?: number;
}

export interface CommunityMetrics {
  totalVolunteers: number;
  activeToday: number;
  totalIncidentsResolved: number;
  averageResponseTime: number;
  communityTrustScore: number;
  topContributors: { userId: string; score: number }[];
  recentMilestones: string[];
}

export interface VolunteerStats {
  volunteerId: string;
  incidentsResponded: number;
  successRate: number;
  totalHoursServed: number;
  achievements: Achievement[];
  certifications: string[];
  communityScore: number;
  rank: string;
}

// Analytics & Insights
export interface MetricsReport {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  generatedAt: number;
  metrics: {
    totalIncidents: number;
    resolvedIncidents: number;
    averageResponseTime: number;
    successRate: number;
    incidentsbyCategory: Record<string, number>;
    incidentsBySeverity: Record<string, number>;
    volunteerEngagement: number;
    resourceUtilization: number;
  };
}

export interface TrendAnalysis {
  incidentTrends: { date: string; count: number; severity: number }[];
  responseCategoryTrends: Record<string, number[]>;
  geographicHotspots: { lat: number; lng: number; incidentCount: number; severity: Severity }[];
  seasonalPatterns: string[];
  predictedHotspots: { lat: number; lng: number; probability: number }[];
}

export interface RealTimeStats {
  activeIncidents: number;
  activeVolunteers: number;
  averageResponseTime: number;
  criticalAlerts: number;
  systemHealth: number;
  lastUpdated: number;
}

// Network Analysis
export interface NetworkAnalysis {
  totalNodes: number;
  averageConnectivity: number;
  bottlenecks: { volunteerId: string; reason: string; impact: string }[];
  clusteringCoefficient: number;
  averagePathLength: number;
  recommendations: string[];
}

export interface ServiceRequest {
  id: string;
  requesterId: string;
  category: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  status: 'Open' | 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled';
  priority: Severity;
  assignedVolunteers: string[];
  createdAt: number;
  completedAt?: number;
  estimatedDuration: number;
}

// Conversation & Context
export interface ConversationContext {
  userId: string;
  sessionId: string;
  history: ConversationTurn[];
  lastUpdated: number;
  context: {
    currentIncident?: string;
    userRole?: Role;
    previousQueries?: string[];
  };
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Real-time Collaboration
export interface TeamSession {
  id: string;
  incidentId: string;
  participantIds: string[];
  createdAt: number;
  endedAt?: number;
  messages: TeamMessage[];
  sharedResources: SharedResource[];
}

export interface TeamMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'resource' | 'assignment' | 'status';
  timestamp: number;
  seenBy: string[];
}

export interface SharedResource {
  id: string;
  resourceId: string;
  sharedBy: string;
  sharedAt: number;
  viewers: string[];
}

// Weather Integration
export interface WeatherData {
  location: string;
  lat: number;
  lng: number;
  temperature: number;
  condition: string;
  windSpeed: number;
  precipitation: number;
  visibility: number;
  alerts: WeatherAlert[];
  timestamp: number;
}

export interface WeatherAlert {
  type: string;
  severity: 'Minor' | 'Moderate' | 'Severe';
  description: string;
  effectiveTime: number;
  expiresTime: number;
  affectedAreas: string[];
}