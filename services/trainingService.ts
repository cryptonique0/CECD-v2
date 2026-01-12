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
}

class TrainingServiceImpl implements TrainingService {
  private scenarios: Map<string, TrainingScenario> = new Map();
  private sessions: Map<string, TrainingSession> = new Map();
  private assessments: Map<string, SkillAssessment[]> = new Map();
  private drills: Map<string, TrainingDrill> = new Map();
  private scenarioCounter = 0;
  private sessionCounter = 0;
  private assessmentCounter = 0;
  private drillCounter = 0;

  constructor() {
    this.initializeSampleScenarios();
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
}

export const trainingService = new TrainingServiceImpl();
