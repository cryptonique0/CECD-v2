export interface IncidentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  checklists: ChecklistItem[];
  requiredSkills: string[];
  estimatedDuration: number; // minutes
  resources: TemplateResource[];
  preFlightQuestions: PreFlightQuestion[];
  createdAt: number;
  updatedAt: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  estimatedMinutes: number;
  assignedRole?: string;
  subtasks?: ChecklistItem[];
  completed?: boolean;
  completedAt?: number;
  completedBy?: string;
  notes?: string;
}

export interface TemplateResource {
  name: string;
  quantity: number;
  unit: string;
  priority: 'must-have' | 'important' | 'nice-to-have';
}

export interface PreFlightQuestion {
  id: string;
  question: string;
  type: 'yes-no' | 'multiple-choice' | 'text';
  options?: string[];
  required: boolean;
}

interface IncidentTemplateService {
  createTemplate(template: Omit<IncidentTemplate, 'id' | 'createdAt' | 'updatedAt'>): IncidentTemplate;
  getTemplate(id: string): IncidentTemplate | null;
  listTemplates(category?: string): IncidentTemplate[];
  updateTemplate(id: string, updates: Partial<IncidentTemplate>): IncidentTemplate | null;
  deleteTemplate(id: string): boolean;
  duplicateTemplate(id: string): IncidentTemplate | null;
  generateChecklist(templateId: string, incidentId: string): ActiveChecklist;
  markChecklistItemDone(checklistId: string, itemId: string, userId: string, notes?: string): void;
  searchTemplates(query: string): IncidentTemplate[];
}

export interface ActiveChecklist {
  id: string;
  templateId: string;
  incidentId: string;
  items: ChecklistItem[];
  createdAt: number;
  completedAt?: number;
  progress: number; // 0-100
}

class IncidentTemplateServiceImpl implements IncidentTemplateService {
  private templates: Map<string, IncidentTemplate> = new Map();
  private activeChecklists: Map<string, ActiveChecklist> = new Map();
  private templateCounter = 0;

  constructor() {
    // Initialize with sample templates
    this.initializeSampleTemplates();
  }

  private initializeSampleTemplates() {
    const sampleTemplates: Omit<IncidentTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Medical Emergency Response',
        description: 'Standard response protocol for medical incidents',
        category: 'Medical',
        severity: 'High',
        checklists: [
          {
            id: 'c1',
            title: 'Scene Safety Assessment',
            description: 'Ensure the scene is safe for responders',
            required: true,
            estimatedMinutes: 2,
            assignedRole: 'First Responder',
          },
          {
            id: 'c2',
            title: 'Patient Assessment',
            description: 'Perform primary and secondary assessment',
            required: true,
            estimatedMinutes: 5,
            assignedRole: 'Paramedic',
          },
          {
            id: 'c3',
            title: 'Treatment',
            description: 'Provide appropriate treatment',
            required: true,
            estimatedMinutes: 15,
            assignedRole: 'Paramedic',
          },
        ],
        requiredSkills: ['First Aid', 'CPR', 'Patient Assessment'],
        estimatedDuration: 30,
        resources: [
          { name: 'Ambulance', quantity: 1, unit: 'unit', priority: 'must-have' },
          { name: 'Defibrillator', quantity: 1, unit: 'unit', priority: 'must-have' },
        ],
        preFlightQuestions: [
          {
            id: 'q1',
            question: 'Is the patient conscious?',
            type: 'yes-no',
            required: true,
          },
        ],
      },
      {
        name: 'Fire Response Protocol',
        description: 'Standard firefighting and rescue protocol',
        category: 'Fire',
        severity: 'Critical',
        checklists: [
          {
            id: 'f1',
            title: 'Scene Assessment',
            description: 'Assess fire size and spread',
            required: true,
            estimatedMinutes: 3,
            assignedRole: 'Incident Commander',
          },
          {
            id: 'f2',
            title: 'Evacuation',
            description: 'Evacuate all persons from danger',
            required: true,
            estimatedMinutes: 10,
            assignedRole: 'Firefighter',
          },
        ],
        requiredSkills: ['Firefighting', 'Rescue', 'Hazmat Awareness'],
        estimatedDuration: 60,
        resources: [
          { name: 'Fire Truck', quantity: 2, unit: 'unit', priority: 'must-have' },
          { name: 'Water Tanker', quantity: 1, unit: 'unit', priority: 'important' },
        ],
        preFlightQuestions: [
          {
            id: 'fq1',
            question: 'Structure type?',
            type: 'multiple-choice',
            options: ['Residential', 'Commercial', 'Industrial'],
            required: true,
          },
        ],
      },
    ];

    sampleTemplates.forEach(t => this.createTemplate(t));
  }

  createTemplate(template: Omit<IncidentTemplate, 'id' | 'createdAt' | 'updatedAt'>): IncidentTemplate {
    const now = Date.now();
    const fullTemplate: IncidentTemplate = {
      id: `tpl-${++this.templateCounter}`,
      ...template,
      createdAt: now,
      updatedAt: now,
    };
    this.templates.set(fullTemplate.id, fullTemplate);
    return fullTemplate;
  }

  getTemplate(id: string): IncidentTemplate | null {
    return this.templates.get(id) || null;
  }

  listTemplates(category?: string): IncidentTemplate[] {
    const all = Array.from(this.templates.values());
    if (!category) return all;
    return all.filter(t => t.category === category);
  }

  updateTemplate(id: string, updates: Partial<IncidentTemplate>): IncidentTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;
    const updated = { ...template, ...updates, updatedAt: Date.now() };
    this.templates.set(id, updated);
    return updated;
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  duplicateTemplate(id: string): IncidentTemplate | null {
    const original = this.templates.get(id);
    if (!original) return null;
    const { id: _, ...rest } = original;
    return this.createTemplate(rest);
  }

  generateChecklist(templateId: string, incidentId: string): ActiveChecklist {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    const checklist: ActiveChecklist = {
      id: `cl-${Date.now()}`,
      templateId,
      incidentId,
      items: JSON.parse(JSON.stringify(template.checklists)), // Deep copy
      createdAt: Date.now(),
      progress: 0,
    };

    this.activeChecklists.set(checklist.id, checklist);
    return checklist;
  }

  markChecklistItemDone(checklistId: string, itemId: string, userId: string, notes?: string): void {
    const checklist = this.activeChecklists.get(checklistId);
    if (!checklist) return;

    const findAndMark = (items: ChecklistItem[]) => {
      for (const item of items) {
        if (item.id === itemId) {
          item.completed = true;
          item.completedAt = Date.now();
          item.completedBy = userId;
          item.notes = notes;
        }
        if (item.subtasks) findAndMark(item.subtasks);
      }
    };

    findAndMark(checklist.items);
    const completed = this.countCompleted(checklist.items);
    const total = this.countTotal(checklist.items);
    checklist.progress = Math.round((completed / total) * 100);

    if (checklist.progress === 100) {
      checklist.completedAt = Date.now();
    }
  }

  private countCompleted(items: ChecklistItem[]): number {
    let count = 0;
    for (const item of items) {
      if (item.completed) count++;
      if (item.subtasks) count += this.countCompleted(item.subtasks);
    }
    return count;
  }

  private countTotal(items: ChecklistItem[]): number {
    let count = items.length;
    for (const item of items) {
      if (item.subtasks) count += this.countTotal(item.subtasks);
    }
    return count;
  }

  searchTemplates(query: string): IncidentTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  }
}

export const incidentTemplateService = new IncidentTemplateServiceImpl();
