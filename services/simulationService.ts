import { Incident, User, IncidentCategory, Severity } from '../types';

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

export interface SimulationTemplate {
  id: string;
  name: string;
  category: IncidentCategory;
  description: string;
  baseEvents: SimulationEvent[];
}

class SimulationService {
  private scenarios: Map<string, SimulationScenario> = new Map();
  private runs: Map<string, SimulationRun> = new Map();
  private templates: Map<string, SimulationTemplate> = new Map();
  private decisionPoints: Map<string, SimulationEvent[]> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeScenarios();
  }

  /**
   * Initialize simulation templates for different incident types
   */
  private initializeTemplates() {
    // Medical Emergency Template
    const medicalTemplate: SimulationTemplate = {
      id: 'template-medical',
      name: 'Medical Emergency',
      category: 'medical',
      description: 'Basic medical incident template',
      baseEvents: [
        {
          id: 'event-1',
          timestamp: 0,
          type: 'incident_update',
          description: 'Initial incident report received',
          data: { message: 'Emergency dispatch received' },
          incidentUpdates: { status: 'Reported' }
        },
        {
          id: 'event-2',
          timestamp: 30000, // 30 seconds
          type: 'decision_point',
          description: 'Assess patient vital signs. What action do you recommend?',
          data: {
            vitals: { heartRate: '120 bpm', bloodPressure: '160/100', respirationRate: '22' },
            options: ['Call for ALS unit', 'Administer oxygen', 'Start IV', 'Transport immediately']
          }
        },
        {
          id: 'event-3',
          timestamp: 90000, // 1.5 min
          type: 'resource_dispatch',
          description: 'EMS unit dispatched',
          data: { unit: 'Ambulance 12', eta: '4 minutes' }
        }
      ]
    };
    this.templates.set('template-medical', medicalTemplate);

    // Hazmat Template
    const hazmatTemplate: SimulationTemplate = {
      id: 'template-hazmat',
      name: 'Hazmat Incident',
      category: 'hazmat',
      description: 'Hazardous materials incident template',
      baseEvents: [
        {
          id: 'event-1',
          timestamp: 0,
          type: 'incident_update',
          description: 'Hazmat incident reported',
          data: { substance: 'Unknown', quantity: 'Unknown', wind: '12 mph NW' },
          incidentUpdates: { status: 'Reported' }
        },
        {
          id: 'event-2',
          timestamp: 15000,
          type: 'decision_point',
          description: 'Establish evacuation zone. What radius?',
          data: {
            options: ['500m', '1km', '2km', 'Full city evacuation']
          }
        },
        {
          id: 'event-3',
          timestamp: 60000,
          type: 'hazard_change',
          description: 'Substance identified as chlorine gas',
          data: { substance: 'Chlorine (Cl2)', exposure: 'respiratory hazard' }
        }
      ]
    };
    this.templates.set('template-hazmat', hazmatTemplate);

    // Disaster Template
    const disasterTemplate: SimulationTemplate = {
      id: 'template-disaster',
      name: 'Natural Disaster',
      category: 'earthquake',
      description: 'Natural disaster (earthquake, flood, etc.) template',
      baseEvents: [
        {
          id: 'event-1',
          timestamp: 0,
          type: 'incident_update',
          description: 'Earthquake/flood incident reported',
          data: { magnitude: '6.2', depth: '10km', affected_area: '25 sq km' },
          incidentUpdates: { status: 'Reported' }
        },
        {
          id: 'event-2',
          timestamp: 20000,
          type: 'decision_point',
          description: 'Resource allocation. How many units to dispatch?',
          data: {
            available_units: 45,
            estimated_victims: 200,
            options: ['5 units', '15 units', '30 units', 'All 45 units']
          }
        }
      ]
    };
    this.templates.set('template-disaster', disasterTemplate);
  }

  /**
   * Initialize predefined scenarios
   */
  private initializeScenarios() {
    // Scenario 1: Heart Attack at Marathon
    const heartAttackScenario: SimulationScenario = {
      id: 'scenario-heart-attack',
      title: 'Heart Attack During Marathon',
      description: '45-year-old male collapses during city marathon with suspected cardiac event',
      category: 'medical',
      severity: 'critical',
      initialLocation: { lat: 40.7580, lng: -73.9855 }, // NYC Marathon
      initialDescription: 'Unresponsive male, collapsed near mile 10 marker. Witnesses report chest pain 5 minutes ago.',
      estimatedDurationMins: 15,
      objectives: [
        'Identify patient condition within 2 minutes',
        'Initiate CPR if necessary',
        'Establish IV access',
        'Transport to nearest cardiac center within 10 minutes',
        'Administer appropriate medications'
      ],
      requiredCertifications: ['EMT-P', 'ACLS'],
      difficulty: 'intermediate',
      createdAt: Date.now(),
      createdBy: 'trainer-001',
      events: [
        {
          id: 'he-1',
          timestamp: 0,
          type: 'incident_update',
          description: 'Incident reported: Unresponsive male at marathon mile 10',
          data: { location: '40.7580, -73.9855', crowded: true },
          incidentUpdates: { status: 'Reported' }
        },
        {
          id: 'he-2',
          timestamp: 30000,
          type: 'decision_point',
          description: 'Patient vitals: HR 0, BP 0/0, Not breathing. Scene safe. What is your first action?',
          data: {
            vitals: { heartRate: 'None', bloodPressure: 'None', respirationRate: '0' },
            options: ['Start CPR immediately', 'Check for responsiveness', 'Call for AED', 'Request police to clear area']
          }
        },
        {
          id: 'he-3',
          timestamp: 90000,
          type: 'resource_dispatch',
          description: 'AED arrived at scene',
          data: { resource: 'Automated External Defibrillator', status: 'available' }
        },
        {
          id: 'he-4',
          timestamp: 120000,
          type: 'decision_point',
          description: 'AED shock recommended. Administer shock?',
          data: {
            aedReading: 'Ventricular Fibrillation',
            options: ['Administer shock', 'Continue CPR', 'Request additional ALS unit']
          }
        },
        {
          id: 'he-5',
          timestamp: 180000,
          type: 'communication',
          description: 'ALS unit arrived. Patient transported to Roosevelt Hospital (STEMI center)',
          data: { hospital: 'Roosevelt Hospital Cardiac Center', eta: '8 minutes' }
        }
      ]
    };
    this.scenarios.set('scenario-heart-attack', heartAttackScenario);

    // Scenario 2: Chemical Spill
    const chemicalSpillScenario: SimulationScenario = {
      id: 'scenario-chemical-spill',
      title: 'Industrial Chemical Spill',
      description: 'Major chemical spill at industrial facility affecting multiple sectors',
      category: 'hazmat',
      severity: 'critical',
      initialLocation: { lat: 35.0116, lng: -106.6104 }, // Industrial area
      initialDescription: '500-gallon chemical container breach at manufacturing plant. Unknown substance. Wind 15 mph SE.',
      estimatedDurationMins: 30,
      objectives: [
        'Identify chemical substance within 5 minutes',
        'Establish evacuation perimeter',
        'Notify affected residents/businesses',
        'Set up decontamination stations',
        'Coordinate environmental cleanup',
        'Document incident for EPA'
      ],
      requiredCertifications: ['HAZMAT'],
      difficulty: 'expert',
      createdAt: Date.now(),
      createdBy: 'trainer-001',
      events: [
        {
          id: 'cs-1',
          timestamp: 0,
          type: 'incident_update',
          description: 'Chemical spill reported at industrial facility',
          data: { location: '35.0116, -106.6104', substance: 'Unknown', volume: '500 gallons' },
          incidentUpdates: { status: 'Reported', severity: 'critical' }
        },
        {
          id: 'cs-2',
          timestamp: 20000,
          type: 'decision_point',
          description: 'Initial perimeter distance? (Wind direction: SE 15mph)',
          data: {
            windSpeed: 15,
            windDirection: 'SE',
            options: ['250m', '500m', '1km', '2km']
          }
        },
        {
          id: 'cs-3',
          timestamp: 60000,
          type: 'hazard_change',
          description: 'HAZMAT team identified substance: Sodium hydroxide (caustic)',
          data: { substance: 'Sodium Hydroxide 50%', phLevel: 13, health_hazard: 'Severe burns' }
        },
        {
          id: 'cs-4',
          timestamp: 120000,
          type: 'decision_point',
          description: 'Residents affected: 245 downwind. Evacuation plan?',
          data: {
            affected: 245,
            vulnerable: 'School within 1.5km radius',
            options: ['Shelter-in-place', 'Immediate evacuation', 'Staged evacuation over 30 minutes', 'Use evacuation centers within city']
          }
        }
      ]
    };
    this.scenarios.set('scenario-chemical-spill', chemicalSpillScenario);

    // Scenario 3: Earthquake
    const earthquakeScenario: SimulationScenario = {
      id: 'scenario-earthquake',
      title: 'Major Earthquake Response',
      description: '6.8 magnitude earthquake causing widespread damage and multiple incidents',
      category: 'earthquake',
      severity: 'critical',
      initialLocation: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      initialDescription: '6.8 magnitude earthquake centered near San Francisco. Multiple buildings collapsed, fires reported, power outages citywide.',
      estimatedDurationMins: 45,
      objectives: [
        'Establish Incident Command System within 5 minutes',
        'Allocate resources to 5+ simultaneous incidents',
        'Coordinate with mutual aid agencies',
        'Manage resource shortages effectively',
        'Prioritize rescue operations based on victim counts',
        'Establish alternative communication systems'
      ],
      requiredCertifications: ['ICS-100', 'ICS-200'],
      difficulty: 'expert',
      createdAt: Date.now(),
      createdBy: 'trainer-001',
      events: [
        {
          id: 'eq-1',
          timestamp: 0,
          type: 'incident_update',
          description: '6.8 magnitude earthquake strikes',
          data: { magnitude: 6.8, depth: '8.5km', duration: '45 seconds' },
          incidentUpdates: { status: 'Reported', severity: 'critical' }
        },
        {
          id: 'eq-2',
          timestamp: 30000,
          type: 'decision_point',
          description: 'Multiple simultaneous incidents reported. Which is top priority?',
          data: {
            incidents: [
              { id: 'inc-1', location: 'Apartment complex collapse', estimated_victims: 50 },
              { id: 'inc-2', location: 'Hospital power failure', patients_at_risk: 300 },
              { id: 'inc-3', location: 'Gas leak fire', spread_rate: 'fast', homes_threatened: 120 },
              { id: 'inc-4', location: 'Bridge damage', commuters_trapped: 200 }
            ]
          }
        }
      ]
    };
    this.scenarios.set('scenario-earthquake', earthquakeScenario);
  }

  /**
   * Start a new simulation run
   */
  startSimulation(scenarioId: string, userId: string): SimulationRun {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const run: SimulationRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scenarioId,
      userId,
      startTime: Date.now(),
      currentEventIndex: 0,
      isPaused: false,
      isComplete: false,
      timeScale: 1,
      decisions: [],
      incidentState: {
        id: `sim-${Date.now()}`,
        title: scenario.title,
        description: scenario.initialDescription,
        category: scenario.category,
        severity: scenario.severity,
        status: 'Reported',
        locationName: 'Simulation',
        lat: scenario.initialLocation.lat,
        lng: scenario.initialLocation.lng,
        reporterId: 'simulation-system',
        timestamp: Date.now(),
        assignedResponders: []
      }
    };

    this.runs.set(run.id, run);
    return run;
  }

  /**
   * Get current simulation run
   */
  getSimulation(runId: string): SimulationRun | undefined {
    return this.runs.get(runId);
  }

  /**
   * Get next event in simulation
   */
  getNextEvent(runId: string): SimulationEvent | undefined {
    const run = this.runs.get(runId);
    if (!run) return undefined;

    const scenario = this.scenarios.get(run.scenarioId);
    if (!scenario) return undefined;

    if (run.currentEventIndex < scenario.events.length) {
      return scenario.events[run.currentEventIndex];
    }

    return undefined;
  }

  /**
   * Advance to next event
   */
  nextEvent(runId: string): void {
    const run = this.runs.get(runId);
    if (!run || run.isComplete) return;

    const scenario = this.scenarios.get(run.scenarioId);
    if (!scenario) return;

    if (run.currentEventIndex < scenario.events.length - 1) {
      run.currentEventIndex++;

      // Update incident state with event data
      const currentEvent = scenario.events[run.currentEventIndex];
      if (currentEvent.incidentUpdates) {
        run.incidentState = { ...run.incidentState, ...currentEvent.incidentUpdates };
      }
    } else {
      run.isComplete = true;
      run.endTime = Date.now();
    }
  }

  /**
   * Record a decision during simulation
   */
  recordDecision(runId: string, eventId: string, decision: string, responseTime: number): void {
    const run = this.runs.get(runId);
    if (!run) return;

    const scenario = this.scenarios.get(run.scenarioId);
    if (!scenario) return;

    const event = scenario.events.find(e => e.id === eventId);
    if (!event) return;

    // Determine if decision is optimal (simplified logic)
    const optimalDecisions: Record<string, string[]> = {
      'he-2': ['Start CPR immediately'], // Heart attack: immediate CPR
      'he-4': ['Administer shock'], // Heart attack: shock for VFib
      'cs-2': ['1km', '2km'], // Chemical spill: appropriate perimeter
      'eq-2': ['Apartment complex collapse'] // Earthquake: most victims
    };

    const isOptimal = optimalDecisions[eventId]?.includes(decision) ?? false;

    run.decisions.push({
      timestamp: Date.now(),
      eventId,
      decision,
      responseTime,
      isOptimal,
      feedback: isOptimal ? 'Correct decision' : 'Consider alternative approaches'
    });
  }

  /**
   * Pause/resume simulation
   */
  pauseSimulation(runId: string): void {
    const run = this.runs.get(runId);
    if (run) run.isPaused = true;
  }

  resumeSimulation(runId: string): void {
    const run = this.runs.get(runId);
    if (run) run.isPaused = false;
  }

  /**
   * Set time scale (1x, 2x, 5x, 10x, 60x)
   */
  setTimeScale(runId: string, scale: number): void {
    const run = this.runs.get(runId);
    if (run) run.timeScale = Math.max(1, Math.min(60, scale));
  }

  /**
   * Get all available scenarios
   */
  getAllScenarios(): SimulationScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get scenarios for specific certification
   */
  getScenariosForCertification(certification: string): SimulationScenario[] {
    return Array.from(this.scenarios.values()).filter(
      s => !s.requiredCertifications || s.requiredCertifications.includes(certification)
    );
  }

  /**
   * Create custom scenario from template
   */
  createScenarioFromTemplate(templateId: string, customEvents: SimulationEvent[]): SimulationScenario {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    const scenario: SimulationScenario = {
      id: `scenario-custom-${Date.now()}`,
      title: template.name,
      description: template.description,
      category: template.category,
      severity: 'high',
      initialLocation: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      initialDescription: 'Custom scenario',
      estimatedDurationMins: 20,
      objectives: [],
      difficulty: 'beginner',
      createdAt: Date.now(),
      createdBy: 'user-custom',
      events: [...template.baseEvents, ...customEvents]
    };

    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  /**
   * Get decision points for a scenario
   */
  getDecisionPoints(scenarioId: string): SimulationEvent[] {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return [];

    return scenario.events.filter(e => e.type === 'decision_point');
  }

  /**
   * Replay past incident as simulation
   */
  replayIncident(incident: Incident): SimulationScenario {
    const scenario: SimulationScenario = {
      id: `replay-${incident.id}-${Date.now()}`,
      title: `Replay: ${incident.title}`,
      description: `Replay of past incident: ${incident.description}`,
      category: incident.category,
      severity: incident.severity,
      initialLocation: { lat: incident.lat, lng: incident.lng },
      initialDescription: incident.description,
      estimatedDurationMins: 20,
      objectives: [`Analyze decision points from past incident`],
      difficulty: 'beginner',
      createdAt: Date.now(),
      createdBy: 'system',
      events: [
        {
          id: 'replay-1',
          timestamp: 0,
          type: 'incident_update',
          description: `Original incident: ${incident.title}`,
          data: { originalId: incident.id, timestamp: incident.timestamp },
          incidentUpdates: incident
        }
      ]
    };

    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  /**
   * Get simulation results and scoring
   */
  getSimulationResults(runId: string) {
    const run = this.runs.get(runId);
    if (!run) return null;

    const scenario = this.scenarios.get(run.scenarioId);
    if (!scenario) return null;

    const correctDecisions = run.decisions.filter(d => d.isOptimal).length;
    const totalDecisions = run.decisions.length;
    const score = totalDecisions > 0 ? (correctDecisions / totalDecisions) * 100 : 0;

    const avgResponseTime = run.decisions.length > 0
      ? run.decisions.reduce((sum, d) => sum + d.responseTime, 0) / run.decisions.length
      : 0;

    const duration = (run.endTime || Date.now()) - run.startTime;

    return {
      scenarioId: run.scenarioId,
      scenarioTitle: scenario.title,
      userId: run.userId,
      duration,
      completionTime: run.endTime ? new Date(run.endTime).toISOString() : null,
      decisions: {
        total: totalDecisions,
        correct: correctDecisions,
        incorrect: totalDecisions - correctDecisions
      },
      score: Math.round(score),
      avgResponseTimeMs: Math.round(avgResponseTime),
      decisionBreakdown: run.decisions.map(d => ({
        eventId: d.eventId,
        decision: d.decision,
        responseTime: d.responseTime,
        isOptimal: d.isOptimal,
        feedback: d.feedback
      })),
      weakPoints: run.decisions
        .filter(d => !d.isOptimal)
        .map(d => ({
          eventId: d.eventId,
          decision: d.decision,
          feedback: d.feedback
        }))
    };
  }
}

export const simulationService = new SimulationService();
