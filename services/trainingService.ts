export interface TrainingScenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  objectives: string[];
  estimatedDurationMinutes: number;
  requiredSkills: string[];
  targetAudience: string[]; // roles
  createdAt: number;
  updatedAt: number;
}

export interface TrainingSession {
  id: string;
  scenarioId: string;
  participantId: string;
  participantName: string;
  startTime: number;
  endTime?: number;
  status: 'in-progress' | 'completed' | 'abandoned';
  performanceScore?: number; // 0-100
  feedback?: string;
  certificateIssued?: boolean;
}

export interface SkillAssessment {
  id: string;
  participantId: string;
  skill: string;
  assessmentType: 'test' | 'practical' | 'peer-review';
  score: number; // 0-100
  assessedAt: number;
  assessedBy: string; // userId
  notes?: string;
  validUntil?: number;
}

export interface TrainingDrill {
  id: string;
  name: string;
  description: string;
  teamId?: string;
  scenario: TrainingScenario;
  scheduledDate: number;
  duration: number; // minutes
  participants: string[]; // userIds
  result?: {
    completedAt: number;
    successRate: number; // 0-100
    lessonLearned: string[];
    improvements: string[];
  };
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

export interface CertificationRequirement {
  name: string;
  description: string;
  requiredModules: string[];
  passingScore: number; // 0-100
  mandatorySimulations: string[]; // Scenario IDs that must be completed
  expiresAfterDays?: number;
}

export interface UserProgress {
  userId: string;
  completedModules: string[];
  completedScenarios: string[];
  trainingScores: TrainingScore[];
  certifications: {
    name: string;
    earnedAt: number;
    expiresAt?: number;
  }[];
  totalTrainingTimeHours: number;
  averageScore: number;
  lastTrainingDate: number;
}

interface TrainingService {
  createScenario(scenario: Omit<TrainingScenario, 'id' | 'createdAt' | 'updatedAt'>): TrainingScenario;
  getScenario(id: string): TrainingScenario | null;
  listScenarios(difficulty?: string, category?: string): TrainingScenario[];
  startSession(scenarioId: string, participantId: string, participantName: string): TrainingSession;
  completeSession(sessionId: string, performanceScore: number, feedback?: string): void;
  assessSkill(participantId: string, skill: string, score: number, assessedBy: string): SkillAssessment;
  getParticipantSkills(participantId: string): SkillAssessment[];
  getSkillProficiency(participantId: string, skill: string): number | null; // Latest score
  scheduleDrill(name: string, scenarioId: string, teamId: string | undefined, participants: string[], date: number): TrainingDrill;
  completeDrill(drillId: string, successRate: number, lessonLearned: string[], improvements: string[]): void;
  getUpcomingDrills(limit?: number): TrainingDrill[];
  getPastDrills(limit?: number): TrainingDrill[];
  generateTrainingPlan(participantId: string, targetSkills: string[]): { currentLevel: Record<string, number>; recommendedCourses: TrainingScenario[] };
  getSessionHistory(participantId: string): TrainingSession[];
  // New simulation & certification methods
  recordTrainingScore(simulationRunId: string, results: any, userId: string): TrainingScore;
  canCertify(userId: string, certificationName: string): { canCertify: boolean; reasons: string[] };
  issueCertification(userId: string, certificationName: string): boolean;
  getUserCertifications(userId: string): Array<{ name: string; earnedAt: number; expiresAt?: number; isValid: boolean; daysUntilExpiry?: number }>;
  getUserProgress(userId: string): UserProgress | null;
  getUserScores(userId: string, limit?: number): TrainingScore[];
  getTrainingStats(userId: string): any;
  getLeaderboard(limit?: number): Array<{ userId: string; averageScore: number; completedScenarios: number; certifications: number }>;
  identifyWeakPoints(userId: string): Array<{ topic: string; frequency: number; affectedScenarios: string[] }>;
  getResponseTimeAnalysis(userId: string): any;
}

class TrainingServiceImpl implements TrainingService {
  private scenarios: Map<string, TrainingScenario> = new Map();
  private sessions: Map<string, TrainingSession> = new Map();
  private assessments: Map<string, SkillAssessment[]> = new Map();
  private drills: Map<string, TrainingDrill> = new Map();
  private trainingScores: TrainingScore[] = [];
  private userProgress: Map<string, UserProgress> = new Map();
  private certifications: Map<string, CertificationRequirement> = new Map();
  private scenarioCounter = 0;
  private sessionCounter = 0;
  private assessmentCounter = 0;
  private drillCounter = 0;

  constructor() {
    this.initializeSampleScenarios();
    this.initializeCertifications();
  }

  private initializeSampleScenarios() {
    const scenarios: Omit<TrainingScenario, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'CPR Refresher',
        description: 'Quick refresher on Cardiopulmonary Resuscitation techniques',
        difficulty: 'beginner',
        category: 'Medical',
        objectives: ['Perform correct chest compressions', 'Maintain proper airway', 'Use AED effectively'],
        estimatedDurationMinutes: 30,
        requiredSkills: [],
        targetAudience: ['Volunteer', 'FieldOperator', 'Paramedic'],
      },
      {
        name: 'Advanced Trauma Management',
        description: 'Comprehensive training on treating severe trauma',
        difficulty: 'advanced',
        category: 'Medical',
        objectives: ['Manage multiple injuries', 'Control severe bleeding', 'Stabilize for transport'],
        estimatedDurationMinutes: 120,
        requiredSkills: ['Basic Life Support', 'Patient Assessment'],
        targetAudience: ['Paramedic', 'FieldOperator'],
      },
      {
        name: 'Fire Scene Command',
        description: 'Leadership and decision-making in active fire scenarios',
        difficulty: 'advanced',
        category: 'Fire',
        objectives: ['Assess incident severity', 'Deploy resources efficiently', 'Ensure team safety'],
        estimatedDurationMinutes: 90,
        requiredSkills: ['Firefighting', 'Leadership'],
        targetAudience: ['Dispatcher', 'IncidentCommander'],
      },
      {
        name: 'Search & Rescue Fundamentals',
        description: 'Basic techniques for finding and locating missing persons',
        difficulty: 'intermediate',
        category: 'Search & Rescue',
        objectives: ['Use GPS navigation', 'Read topographic maps', 'Communicate in field'],
        estimatedDurationMinutes: 60,
        requiredSkills: [],
        targetAudience: ['Volunteer', 'FieldOperator'],
      },
    ];

    scenarios.forEach(s => this.createScenario(s));
  }

  /**
   * Initialize certification requirements
   */
  private initializeCertifications() {
    const certRequirements: CertificationRequirement[] = [
      {
        name: 'EMT-B',
        description: 'Emergency Medical Technician - Basic',
        requiredModules: ['module-emt-basic'],
        passingScore: 80,
        mandatorySimulations: ['scenario-heart-attack'],
        expiresAfterDays: 730 // 2 years
      },
      {
        name: 'EMT-P',
        description: 'Emergency Medical Technician - Paramedic',
        requiredModules: ['module-emt-basic', 'module-emt-advanced'],
        passingScore: 85,
        mandatorySimulations: ['scenario-heart-attack'],
        expiresAfterDays: 730
      },
      {
        name: 'HAZMAT',
        description: 'Hazardous Materials Technician',
        requiredModules: ['module-hazmat'],
        passingScore: 90,
        mandatorySimulations: ['scenario-chemical-spill'],
        expiresAfterDays: 365 // 1 year
      },
      {
        name: 'ICS-100',
        description: 'Introduction to the Incident Command System',
        requiredModules: ['module-disaster-management'],
        passingScore: 80,
        mandatorySimulations: [],
        expiresAfterDays: 1095 // 3 years
      },
      {
        name: 'ICS-200',
        description: 'Incident Command System for Line Officers',
        requiredModules: ['module-disaster-management'],
        passingScore: 85,
        mandatorySimulations: ['scenario-earthquake'],
        expiresAfterDays: 1095
      }
    ];

    certRequirements.forEach(c => this.certifications.set(c.name, c));
  }

  createScenario(scenario: Omit<TrainingScenario, 'id' | 'createdAt' | 'updatedAt'>): TrainingScenario {
    const now = Date.now();
    const fullScenario: TrainingScenario = {
      id: `scn-${++this.scenarioCounter}`,
      ...scenario,
      createdAt: now,
      updatedAt: now,
    };
    this.scenarios.set(fullScenario.id, fullScenario);
    return fullScenario;
  }

  getScenario(id: string): TrainingScenario | null {
    return this.scenarios.get(id) || null;
  }

  listScenarios(difficulty?: string, category?: string): TrainingScenario[] {
    let all = Array.from(this.scenarios.values());
    if (difficulty) all = all.filter(s => s.difficulty === difficulty);
    if (category) all = all.filter(s => s.category === category);
    return all;
  }

  startSession(scenarioId: string, participantId: string, participantName: string): TrainingSession {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const session: TrainingSession = {
      id: `sess-${++this.sessionCounter}`,
      scenarioId,
      participantId,
      participantName,
      startTime: Date.now(),
      status: 'in-progress',
    };

    this.sessions.set(session.id, session);
    return session;
  }

  completeSession(sessionId: string, performanceScore: number, feedback?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = Date.now();
    session.status = 'completed';
    session.performanceScore = performanceScore;
    session.feedback = feedback;

    // Auto-issue certificate if score > 80%
    if (performanceScore > 80) {
      session.certificateIssued = true;
    }
  }

  assessSkill(participantId: string, skill: string, score: number, assessedBy: string): SkillAssessment {
    if (!this.assessments.has(participantId)) {
      this.assessments.set(participantId, []);
    }

    const assessment: SkillAssessment = {
      id: `assess-${++this.assessmentCounter}`,
      participantId,
      skill,
      assessmentType: 'test',
      score: Math.min(100, Math.max(0, score)),
      assessedAt: Date.now(),
      assessedBy,
      validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    };

    this.assessments.get(participantId)!.push(assessment);
    return assessment;
  }

  getParticipantSkills(participantId: string): SkillAssessment[] {
    return this.assessments.get(participantId) || [];
  }

  getSkillProficiency(participantId: string, skill: string): number | null {
    const skills = this.assessments.get(participantId) || [];
    const relevant = skills
      .filter(s => s.skill === skill && (!s.validUntil || s.validUntil > Date.now()))
      .sort((a, b) => b.assessedAt - a.assessedAt);

    return relevant.length > 0 ? relevant[0].score : null;
  }

  scheduleDrill(name: string, scenarioId: string, teamId: string | undefined, participants: string[], date: number): TrainingDrill {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const drill: TrainingDrill = {
      id: `drill-${++this.drillCounter}`,
      name,
      description: `Drill based on ${scenario.name}`,
      teamId,
      scenario,
      scheduledDate: date,
      duration: scenario.estimatedDurationMinutes,
      participants,
    };

    this.drills.set(drill.id, drill);
    return drill;
  }

  completeDrill(drillId: string, successRate: number, lessonLearned: string[], improvements: string[]): void {
    const drill = this.drills.get(drillId);
    if (!drill) return;

    drill.result = {
      completedAt: Date.now(),
      successRate,
      lessonLearned,
      improvements,
    };
  }

  getUpcomingDrills(limit: number = 5): TrainingDrill[] {
    const now = Date.now();
    return Array.from(this.drills.values())
      .filter(d => d.scheduledDate > now && !d.result)
      .sort((a, b) => a.scheduledDate - b.scheduledDate)
      .slice(0, limit);
  }

  getPastDrills(limit: number = 10): TrainingDrill[] {
    return Array.from(this.drills.values())
      .filter(d => d.result)
      .sort((a, b) => (b.result?.completedAt || 0) - (a.result?.completedAt || 0))
      .slice(0, limit);
  }

  generateTrainingPlan(participantId: string, targetSkills: string[]): { currentLevel: Record<string, number>; recommendedCourses: TrainingScenario[] } {
    const currentLevel: Record<string, number> = {};
    const recommended: Set<string> = new Set();

    targetSkills.forEach(skill => {
      const proficiency = this.getSkillProficiency(participantId, skill);
      currentLevel[skill] = proficiency || 0;

      // If proficiency is low, recommend training
      if (!proficiency || proficiency < 70) {
        Array.from(this.scenarios.values()).forEach(scenario => {
          if (scenario.requiredSkills.includes(skill) || scenario.objectives.some(obj => obj.includes(skill))) {
            recommended.add(scenario.id);
          }
        });
      }
    });

    const recommendedScenarios = Array.from(recommended)
      .map(id => this.scenarios.get(id)!)
      .sort((a, b) => a.difficulty.localeCompare(b.difficulty));

    return {
      currentLevel,
      recommendedCourses: recommendedScenarios,
    };
  }

  getSessionHistory(participantId: string): TrainingSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.participantId === participantId)
      .sort((a, b) => b.startTime - a.startTime);
  }

  // === NEW SIMULATION & CERTIFICATION METHODS ===

  /**
   * Record training score from simulation completion
   */
  recordTrainingScore(simulationRunId: string, results: any, userId: string): TrainingScore {
    const score: TrainingScore = {
      id: `score-${Date.now()}`,
      userId,
      simulationRunId,
      scenarioId: results.scenarioId || '',
      scenarioTitle: results.scenarioTitle,
      timestamp: Date.now(),
      duration: results.duration,
      score: results.score,
      decisions: results.decisions,
      avgResponseTimeMs: results.avgResponseTimeMs,
      weakPoints: results.weakPoints || [],
      certificationsEarned: []
    };

    this.trainingScores.push(score);
    this.updateUserProgress(userId, score);

    return score;
  }

  /**
   * Update user progress after training completion
   */
  private updateUserProgress(userId: string, score: TrainingScore) {
    let progress = this.userProgress.get(userId);
    if (!progress) {
      progress = {
        userId,
        completedModules: [],
        completedScenarios: [],
        trainingScores: [],
        certifications: [],
        totalTrainingTimeHours: 0,
        averageScore: 0,
        lastTrainingDate: 0
      };
      this.userProgress.set(userId, progress);
    }

    if (!progress.completedScenarios.includes(score.scenarioId)) {
      progress.completedScenarios.push(score.scenarioId);
    }

    progress.trainingScores.push(score);
    progress.totalTrainingTimeHours += score.duration / (60 * 60 * 1000);
    progress.lastTrainingDate = score.timestamp;

    const avgScore = progress.trainingScores.reduce((sum, s) => sum + s.score, 0) / progress.trainingScores.length;
    progress.averageScore = Math.round(avgScore);

    this.userProgress.set(userId, progress);
  }

  /**
   * Check if user can certify for a certification
   */
  canCertify(userId: string, certificationName: string): { canCertify: boolean; reasons: string[] } {
    const certReq = this.certifications.get(certificationName);
    if (!certReq) {
      return { canCertify: false, reasons: [`Certification ${certificationName} not found`] };
    }

    const userProgress = this.userProgress.get(userId);
    if (!userProgress) {
      return {
        canCertify: false,
        reasons: ['No training records found. Complete required modules first.']
      };
    }

    const reasons: string[] = [];

    // Check mandatory simulation scores
    for (const scenarioId of certReq.mandatorySimulations) {
      const scenarioScores = userProgress.trainingScores.filter(s => s.scenarioId === scenarioId);
      if (scenarioScores.length === 0) {
        reasons.push(`Mandatory simulation not completed: ${scenarioId}`);
      } else {
        const bestScore = Math.max(...scenarioScores.map(s => s.score));
        if (bestScore < certReq.passingScore) {
          reasons.push(`Simulation score too low: ${bestScore}% (required ${certReq.passingScore}%)`);
        }
      }
    }

    // Check overall score requirements
    if (certReq.passingScore > 0 && userProgress.averageScore < certReq.passingScore) {
      reasons.push(`Overall score too low: ${userProgress.averageScore}% (required ${certReq.passingScore}%)`);
    }

    return {
      canCertify: reasons.length === 0,
      reasons
    };
  }

  /**
   * Issue certification to user
   */
  issueCertification(userId: string, certificationName: string): boolean {
    const canCert = this.canCertify(userId, certificationName);
    if (!canCert.canCertify) {
      return false;
    }

    const progress = this.userProgress.get(userId);
    if (!progress) return false;

    const certReq = this.certifications.get(certificationName);
    if (!certReq) return false;

    const expiresAt = certReq.expiresAfterDays
      ? Date.now() + certReq.expiresAfterDays * 24 * 60 * 60 * 1000
      : undefined;

    progress.certifications.push({
      name: certificationName,
      earnedAt: Date.now(),
      expiresAt
    });

    return true;
  }

  /**
   * Get user's current certifications
   */
  getUserCertifications(userId: string): Array<{
    name: string;
    earnedAt: number;
    expiresAt?: number;
    isValid: boolean;
    daysUntilExpiry?: number;
  }> {
    const progress = this.userProgress.get(userId);
    if (!progress) return [];

    return progress.certifications.map(cert => {
      const isValid = !cert.expiresAt || cert.expiresAt > Date.now();
      const daysUntilExpiry = cert.expiresAt
        ? Math.ceil((cert.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        : undefined;

      return {
        ...cert,
        isValid,
        daysUntilExpiry
      };
    });
  }

  /**
   * Get user training progress
   */
  getUserProgress(userId: string): UserProgress | null {
    return this.userProgress.get(userId) || null;
  }

  /**
   * Get user's training scores
   */
  getUserScores(userId: string, limit: number = 10): TrainingScore[] {
    return this.trainingScores
      .filter(s => s.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get training statistics
   */
  getTrainingStats(userId: string) {
    const progress = this.userProgress.get(userId);
    if (!progress) {
      return {
        totalScenarios: 0,
        averageScore: 0,
        totalHours: 0,
        certifications: 0,
        lastTraining: null
      };
    }

    return {
      totalScenarios: progress.completedScenarios.length,
      averageScore: progress.averageScore,
      totalHours: Math.round(progress.totalTrainingTimeHours),
      certifications: progress.certifications.length,
      lastTraining: progress.lastTrainingDate ? new Date(progress.lastTrainingDate) : null
    };
  }

  /**
   * Get leaderboard (top trainers by average score)
   */
  getLeaderboard(limit: number = 20): Array<{
    userId: string;
    averageScore: number;
    completedScenarios: number;
    certifications: number;
  }> {
    return Array.from(this.userProgress.values())
      .map(p => ({
        userId: p.userId,
        averageScore: p.averageScore,
        completedScenarios: p.completedScenarios.length,
        certifications: p.certifications.length
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, limit);
  }

  /**
   * Identify weak points across user's training
   */
  identifyWeakPoints(userId: string): Array<{
    topic: string;
    frequency: number;
    affectedScenarios: string[];
  }> {
    const scores = this.getUserScores(userId, 1000);
    const weakPointMap = new Map<string, Set<string>>();

    scores.forEach(score => {
      score.weakPoints.forEach(wp => {
        const topics = weakPointMap.get(wp.feedback) || new Set();
        topics.add(score.scenarioId);
        weakPointMap.set(wp.feedback, topics);
      });
    });

    return Array.from(weakPointMap.entries())
      .map(([topic, scenarios]) => ({
        topic,
        frequency: scenarios.size,
        affectedScenarios: Array.from(scenarios)
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get response time analysis
   */
  getResponseTimeAnalysis(userId: string) {
    const scores = this.getUserScores(userId, 1000);

    if (scores.length === 0) {
      return {
        averageMs: 0,
        medianMs: 0,
        fastestMs: 0,
        slowestMs: 0,
        trend: 'no_data'
      };
    }

    const times = scores.map(s => s.avgResponseTimeMs).sort((a, b) => a - b);
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const median = times[Math.floor(times.length / 2)];
    const fastest = times[0];
    const slowest = times[times.length - 1];

    const recent = scores.slice(0, 5);
    const older = scores.slice(-5);
    const recentAvg = recent.reduce((sum, s) => sum + s.avgResponseTimeMs, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.avgResponseTimeMs, 0) / older.length;
    const trend = recentAvg < olderAvg ? 'improving' : recentAvg > olderAvg ? 'degrading' : 'stable';

    return {
      averageMs: Math.round(average),
      medianMs: Math.round(median),
      fastestMs: fastest,
      slowestMs: slowest,
      trend
    };
  }
}

export const trainingService = new TrainingServiceImpl();
