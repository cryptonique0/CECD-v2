import { TrainingModule, TrainingLesson, VolunteerProgress, QuizQuestion } from '../types';

class TrainingService {
  private modules: Map<string, TrainingModule> = new Map();
  private volunteerProgress: Map<string, VolunteerProgress[]> = new Map();

  constructor() {
    this.initializeSampleModules();
  }

  private initializeSampleModules() {
    const modules: TrainingModule[] = [
      {
        id: 'tm-001',
        title: 'Basic First Aid Certification',
        description: 'Learn fundamental first aid techniques and emergency response',
        category: 'Medical',
        duration: 240,
        level: 'Beginner',
        lessons: [
          { id: 'l-1', title: 'CPR Fundamentals', content: 'Learn proper CPR techniques for adults and children', duration: 45, completed: false },
          { id: 'l-2', title: 'Wound Care', content: 'Proper cleaning, dressing, and monitoring of wounds', duration: 30, completed: false },
          { id: 'l-3', title: 'Shock Management', content: 'Recognizing and treating shock in emergency situations', duration: 35, completed: false },
          { id: 'l-4', title: 'Choking and Airway', content: 'Heimlich maneuver and airway management', duration: 40, completed: false },
          { id: 'l-5', title: 'Recovery Positions', content: 'Proper positioning for unconscious casualties', duration: 25, completed: false },
          { id: 'l-6', title: 'Emergency Assessment', content: 'ABCDE assessment framework', duration: 30, completed: false },
        ],
        certified: false
      },
      {
        id: 'tm-002',
        title: 'Advanced Life Support (ALS)',
        description: 'Advanced medical interventions and emergency protocols',
        category: 'Medical',
        duration: 480,
        level: 'Advanced',
        lessons: [
          { id: 'l-7', title: 'Cardiac Arrhythmias', content: 'Understanding and responding to heart rhythms', duration: 60, completed: false },
          { id: 'l-8', title: 'Airway Management', content: 'Intubation and advanced airway techniques', duration: 90, completed: false },
          { id: 'l-9', title: 'Pharmacology in Emergency', content: 'Drug administration in emergency situations', duration: 75, completed: false },
          { id: 'l-10', title: 'Critical Care Transport', content: 'Managing critical patients during transport', duration: 60, completed: false },
        ],
        certified: false
      },
      {
        id: 'tm-003',
        title: 'Fire Safety and Response',
        description: 'Comprehensive fire safety education and suppression techniques',
        category: 'Fire',
        duration: 360,
        level: 'Intermediate',
        lessons: [
          { id: 'l-11', title: 'Fire Science Basics', content: 'Understanding fire behavior and combustion', duration: 45, completed: false },
          { id: 'l-12', title: 'Evacuation Procedures', content: 'Safe evacuation tactics and route planning', duration: 50, completed: false },
          { id: 'l-13', title: 'Firefighting Equipment', content: 'Using extinguishers and firefighting tools', duration: 40, completed: false },
          { id: 'l-14', title: 'Hazmat in Fires', content: 'Handling hazardous materials in fire situations', duration: 60, completed: false },
          { id: 'l-15', title: 'Structural Awareness', content: 'Building collapse risks and structural assessment', duration: 55, completed: false },
        ],
        certified: false
      },
      {
        id: 'tm-004',
        title: 'Water Rescue and Swift Water Operations',
        description: 'Water rescue techniques and safety protocols',
        category: 'Water Rescue',
        duration: 420,
        level: 'Intermediate',
        lessons: [
          { id: 'l-16', title: 'Water Rescue Safety', content: 'Personal safety in water rescue operations', duration: 50, completed: false },
          { id: 'l-17', title: 'Rope Systems', content: 'Setting up and using rope systems for rescue', duration: 60, completed: false },
          { id: 'l-18', title: 'Swimming and Approach', content: 'Effective swimming techniques for rescue', duration: 45, completed: false },
          { id: 'l-19', title: 'Flood Operations', content: 'Coordinating large-scale flood rescue', duration: 55, completed: false },
          { id: 'l-20', title: 'Drowning Recognition', content: 'Identifying drowning victims and response', duration: 40, completed: false },
        ],
        certified: false
      },
      {
        id: 'tm-005',
        title: 'Community Emergency Coordination',
        description: 'Coordinating emergency response across communities',
        category: 'Coordination',
        duration: 300,
        level: 'Intermediate',
        lessons: [
          { id: 'l-21', title: 'Incident Command System', content: 'Understanding ICS hierarchy and roles', duration: 60, completed: false },
          { id: 'l-22', title: 'Resource Management', content: 'Allocation and tracking of emergency resources', duration: 50, completed: false },
          { id: 'l-23', title: 'Communication Protocols', content: 'Clear communication in emergency situations', duration: 45, completed: false },
          { id: 'l-24', title: 'Volunteer Coordination', content: 'Managing volunteer teams in emergencies', duration: 50, completed: false },
          { id: 'l-25', title: 'Community Liaison', content: 'Interfacing with public and media', duration: 40, completed: false },
        ],
        certified: false
      },
      {
        id: 'tm-006',
        title: 'Mental Health and Trauma Support',
        description: 'Psychological first aid and crisis counseling fundamentals',
        category: 'Mental Health',
        duration: 240,
        level: 'Beginner',
        lessons: [
          { id: 'l-26', title: 'Trauma Recognition', content: 'Identifying trauma symptoms and triggers', duration: 40, completed: false },
          { id: 'l-27', title: 'Psychological First Aid', content: 'Basic mental health support techniques', duration: 50, completed: false },
          { id: 'l-28', title: 'Crisis Intervention', content: 'De-escalation and crisis management', duration: 45, completed: false },
          { id: 'l-29', title: 'Self-Care for Responders', content: 'Preventing burnout and secondary trauma', duration: 35, completed: false },
        ],
        certified: false
      },
    ];

    modules.forEach(module => {
      this.modules.set(module.id, module);
    });
  }

  /**
   * Get module by ID
   */
  getModule(moduleId: string): TrainingModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all modules
   */
  getAllModules(): TrainingModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules by level
   */
  getModulesByLevel(level: 'Beginner' | 'Intermediate' | 'Advanced'): TrainingModule[] {
    return Array.from(this.modules.values()).filter(m => m.level === level);
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: string): TrainingModule[] {
    return Array.from(this.modules.values()).filter(m => m.category === category);
  }

  /**
   * Track volunteer progress
   */
  trackProgress(volunteerId: string, moduleId: string, lessonId: string): void {
    const key = `${volunteerId}-${moduleId}`;
    
    if (!this.volunteerProgress.has(volunteerId)) {
      this.volunteerProgress.set(volunteerId, []);
    }

    const progresses = this.volunteerProgress.get(volunteerId)!;
    let progress = progresses.find(p => p.moduleId === moduleId);

    if (!progress) {
      progress = {
        volunteerId,
        moduleId,
        completedLessons: 0,
        totalLessons: this.modules.get(moduleId)?.lessons.length || 0,
        startedAt: Date.now(),
        certified: false
      };
      progresses.push(progress);
    }

    const module = this.modules.get(moduleId);
    if (module) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson) {
        lesson.completed = true;
        progress.completedLessons = module.lessons.filter(l => l.completed).length;
      }
    }
  }

  /**
   * Get volunteer progress for a module
   */
  getVolunteerProgress(volunteerId: string, moduleId: string): VolunteerProgress | undefined {
    const progresses = this.volunteerProgress.get(volunteerId);
    return progresses?.find(p => p.moduleId === moduleId);
  }

  /**
   * Get all volunteer progress
   */
  getAllVolunteerProgress(volunteerId: string): VolunteerProgress[] {
    return this.volunteerProgress.get(volunteerId) || [];
  }

  /**
   * Complete quiz and certify
   */
  completeQuiz(volunteerId: string, moduleId: string, score: number): void {
    const key = `${volunteerId}-${moduleId}`;
    const progresses = this.volunteerProgress.get(volunteerId) || [];
    let progress = progresses.find(p => p.moduleId === moduleId);

    if (!progress) {
      const module = this.modules.get(moduleId);
      progress = {
        volunteerId,
        moduleId,
        completedLessons: module?.lessons.length || 0,
        totalLessons: module?.lessons.length || 0,
        startedAt: Date.now(),
        certified: false
      };
      if (!this.volunteerProgress.has(volunteerId)) {
        this.volunteerProgress.set(volunteerId, []);
      }
      this.volunteerProgress.get(volunteerId)!.push(progress);
    }

    progress.quizScore = score;
    const module = this.modules.get(moduleId);
    if (module && score >= (module.quiz?.passingScore || 70)) {
      progress.certified = true;
      progress.completedAt = Date.now();
      module.certified = true;
    }
  }

  /**
   * Get certifications for volunteer
   */
  getVolunteerCertifications(volunteerId: string): string[] {
    const progresses = this.volunteerProgress.get(volunteerId) || [];
    return progresses
      .filter(p => p.certified)
      .map(p => {
        const module = this.modules.get(p.moduleId);
        return module?.title || p.moduleId;
      });
  }

  /**
   * Get learning path recommendations
   */
  getRecommendedPath(volunteerId: string, role: string): TrainingModule[] {
    const progressMap = new Map(
      (this.volunteerProgress.get(volunteerId) || []).map(p => [p.moduleId, p])
    );

    const recommendations: TrainingModule[] = [];
    const pathMap: Record<string, string[]> = {
      'Volunteer': ['tm-001', 'tm-005', 'tm-006'],
      'Field Operator': ['tm-001', 'tm-002', 'tm-004', 'tm-005'],
      'Dispatcher': ['tm-005', 'tm-006'],
      'Analyst': ['tm-005'],
    };

    const modulesForRole = pathMap[role] || pathMap['Volunteer'];
    
    modulesForRole.forEach(moduleId => {
      const module = this.modules.get(moduleId);
      const progress = progressMap.get(moduleId);
      
      if (module && (!progress || !progress.certified)) {
        recommendations.push(module);
      }
    });

    return recommendations;
  }
}

export const trainingService = new TrainingService();
