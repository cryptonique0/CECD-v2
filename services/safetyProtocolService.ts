import { auditTrailService } from './auditTrailService';

export interface SafetyCheckpoint {
  id: string;
  name: string;
  category: 'personal_gear' | 'vehicle' | 'communication' | 'situational_awareness' | 'medical' | 'other';
  description: string;
  critical: boolean; // If true, incident cannot proceed without check
  priority: number; // 1-10, higher = more important
}

export interface SafetyProtocol {
  id: string;
  name: string;
  description: string;
  checkpoints: SafetyCheckpoint[];
  applicableCategories: string[]; // e.g., ["Fire", "Flood"]
  estimatedDuration: number; // minutes
}

export interface SafetyChecklist {
  id: string;
  incidentId: string;
  protocolId: string;
  volunteerId: string;
  startedAt: number;
  completedAt?: number;
  checks: {
    checkpointId: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: number;
    notes?: string;
  }[];
  signedOff: boolean;
  signedBy?: string;
  signedAt?: number;
}

const defaultProtocols: SafetyProtocol[] = [
  {
    id: 'proto-fire',
    name: 'Fire Response Safety',
    description: 'Pre-deployment safety checks for fire response personnel',
    applicableCategories: ['Fire'],
    estimatedDuration: 5,
    checkpoints: [
      { id: 'cp-1', name: 'Helmet & Visor', category: 'personal_gear', description: 'Inspect helmet for damage, ensure proper fit', critical: true, priority: 10 },
      { id: 'cp-2', name: 'Protective Clothing', category: 'personal_gear', description: 'Flame-resistant gear intact, no tears', critical: true, priority: 10 },
      { id: 'cp-3', name: 'SCBA/Respirator', category: 'medical', description: 'Breathing apparatus charged and functional', critical: true, priority: 10 },
      { id: 'cp-4', name: 'Gloves & Boots', category: 'personal_gear', description: 'Heat-resistant, non-slip soles', critical: true, priority: 9 },
      { id: 'cp-5', name: 'Radio Check', category: 'communication', description: 'Two-way radio functional, battery > 80%', critical: true, priority: 9 },
      { id: 'cp-6', name: 'Buddy Assignment', category: 'situational_awareness', description: 'Assigned partner for pair operations', critical: true, priority: 9 },
      { id: 'cp-7', name: 'Vehicle Inspection', category: 'vehicle', description: 'Equipment on truck secure, hoses intact', critical: false, priority: 8 },
    ],
  },
  {
    id: 'proto-flood',
    name: 'Flood Response Safety',
    description: 'Pre-deployment checks for water rescue and relief operations',
    applicableCategories: ['Flood'],
    estimatedDuration: 4,
    checkpoints: [
      { id: 'cp-f1', name: 'Life Jacket', category: 'personal_gear', description: 'USCG-approved, properly fitted', critical: true, priority: 10 },
      { id: 'cp-f2', name: 'Water-Resistant Gear', category: 'personal_gear', description: 'Waterproof layers, non-slip footwear', critical: true, priority: 9 },
      { id: 'cp-f3', name: 'Communication Device', category: 'communication', description: 'Waterproof radio or signal device', critical: true, priority: 9 },
      { id: 'cp-f4', name: 'First Aid Kit', category: 'medical', description: 'Portable medical kit on person', critical: false, priority: 8 },
      { id: 'cp-f5', name: 'Rope & Safety Line', category: 'other', description: 'Safety line attached, proper knots', critical: true, priority: 9 },
      { id: 'cp-f6', name: 'Decontamination Plan', category: 'situational_awareness', description: 'Know water safety hazards, contamination risks', critical: false, priority: 7 },
    ],
  },
  {
    id: 'proto-earthquake',
    name: 'Earthquake Response Safety',
    description: 'Safety protocols for search and rescue in structural collapse',
    applicableCategories: ['Earthquake'],
    estimatedDuration: 6,
    checkpoints: [
      { id: 'cp-e1', name: 'Hard Hat & Eye Protection', category: 'personal_gear', description: 'ANSI-certified helmet, safety goggles', critical: true, priority: 10 },
      { id: 'cp-e2', name: 'Heavy Duty Gloves', category: 'personal_gear', description: 'Cut-resistant, reinforced gloves', critical: true, priority: 9 },
      { id: 'cp-e3', name: 'Dust Mask', category: 'medical', description: 'N95 or better, proper fit test', critical: true, priority: 9 },
      { id: 'cp-e4', name: 'Structural Assessment Training', category: 'situational_awareness', description: 'Certified to assess building safety', critical: false, priority: 8 },
      { id: 'cp-e5', name: 'Communication System', category: 'communication', description: 'Radio link, clear frequency assignment', critical: true, priority: 9 },
      { id: 'cp-e6', name: 'Rescue Equipment Check', category: 'other', description: 'Jacks, crowbars, saws all functional', critical: false, priority: 8 },
    ],
  },
];

export const safetyProtocolService = {
  protocols: [...defaultProtocols],
  checklists: new Map<string, SafetyChecklist>(),

  getProtocolsForCategory(category: string): SafetyProtocol[] {
    return this.protocols.filter(p => p.applicableCategories.includes(category));
  },

  createChecklist(incidentId: string, protocolId: string, volunteerId: string): SafetyChecklist {
    const protocol = this.protocols.find(p => p.id === protocolId);
    if (!protocol) throw new Error(`Protocol ${protocolId} not found`);

    const checklist: SafetyChecklist = {
      id: `checklist-${Date.now()}`,
      incidentId,
      protocolId,
      volunteerId,
      startedAt: Date.now(),
      checks: protocol.checkpoints.map(cp => ({
        checkpointId: cp.id,
        completed: false,
      })),
      signedOff: false,
    };

    this.checklists.set(checklist.id, checklist);
    return checklist;
  },

  completeCheckpoint(
    checklistId: string,
    checkpointId: string,
    completedBy: string,
    notes?: string
  ): SafetyChecklist {
    const checklist = this.checklists.get(checklistId);
    if (!checklist) throw new Error(`Checklist ${checklistId} not found`);

    const check = checklist.checks.find(c => c.checkpointId === checkpointId);
    if (!check) throw new Error(`Checkpoint ${checkpointId} not found in checklist`);

    check.completed = true;
    check.completedBy = completedBy;
    check.completedAt = Date.now();
    check.notes = notes;

    this.checklists.set(checklistId, checklist);
    return checklist;
  },

  getChecklistProgress(checklistId: string): { completed: number; total: number; percentage: number } {
    const checklist = this.checklists.get(checklistId);
    if (!checklist) throw new Error(`Checklist ${checklistId} not found`);

    const completed = checklist.checks.filter(c => c.completed).length;
    const total = checklist.checks.length;

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  },

  canDeployWithoutChecklist(checklistId: string): { canDeploy: boolean; blockers: string[] } {
    const checklist = this.checklists.get(checklistId);
    if (!checklist) return { canDeploy: false, blockers: ['Checklist not found'] };

    const protocol = this.protocols.find(p => p.id === checklist.protocolId);
    if (!protocol) return { canDeploy: false, blockers: ['Protocol not found'] };

    const blockers: string[] = [];
    for (const cp of protocol.checkpoints) {
      if (!cp.critical) continue;
      const check = checklist.checks.find(c => c.checkpointId === cp.id);
      if (!check?.completed) {
        blockers.push(`CRITICAL: ${cp.name} – ${cp.description}`);
      }
    }

    return { canDeploy: blockers.length === 0, blockers };
  },

  signOffChecklist(checklistId: string, signedBy: string): SafetyChecklist {
    const checklist = this.checklists.get(checklistId);
    if (!checklist) throw new Error(`Checklist ${checklistId} not found`);

    const { canDeploy, blockers } = this.canDeployWithoutChecklist(checklistId);
    if (!canDeploy) {
      throw new Error(`Cannot sign off – blockers exist: ${blockers.join('; ')}`);
    }

    checklist.signedOff = true;
    checklist.signedBy = signedBy;
    checklist.signedAt = Date.now();
    checklist.completedAt = Date.now();

    this.checklists.set(checklistId, checklist);

    auditTrailService.recordEvent(
      checklist.incidentId,
      signedBy,
      'SAFETY_CHECKLIST_SIGNED',
      `Checklist ${checklist.id} signed off. Volunteer: ${checklist.volunteerId}`
    );

    return checklist;
  },

  getIncidentChecklists(incidentId: string): SafetyChecklist[] {
    return Array.from(this.checklists.values()).filter(c => c.incidentId === incidentId);
  },

  getChecklist(checklistId: string): SafetyChecklist | undefined {
    return this.checklists.get(checklistId);
  },
};
