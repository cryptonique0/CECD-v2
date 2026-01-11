import { Incident } from '../types';
import { auditTrailService } from './auditTrailService';

export interface DebriefQuestion {
  id: string;
  section: 'response_effectiveness' | 'resource_allocation' | 'team_coordination' | 'lessons_learned' | 'safety';
  question: string;
  type: 'text' | 'rating' | 'multiple_choice' | 'freeform';
  mandatory: boolean;
  options?: string[];
}

export interface DebriefResponse {
  questionId: string;
  answer: string | number;
  respondentId: string;
  respondedAt: number;
}

export interface DebriefSession {
  id: string;
  incidentId: string;
  initiatedBy: string;
  initiatedAt: number;
  scheduledFor?: number;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  participants: string[];
  responses: DebriefResponse[];
  actionItems: {
    id: string;
    description: string;
    assignee: string;
    dueDate: number;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'in_progress' | 'completed';
  }[];
  summary?: string;
  completedAt?: number;
}

const defaultQuestions: DebriefQuestion[] = [
  {
    id: 'q1',
    section: 'response_effectiveness',
    question: 'How effective was the initial response to the incident?',
    type: 'rating',
    mandatory: true,
  },
  {
    id: 'q2',
    section: 'response_effectiveness',
    question: 'Were communication protocols followed correctly?',
    type: 'multiple_choice',
    mandatory: true,
    options: ['Yes, fully', 'Mostly', 'Partially', 'No', 'N/A'],
  },
  {
    id: 'q3',
    section: 'response_effectiveness',
    question: 'What could have been done better in the response phase?',
    type: 'freeform',
    mandatory: false,
  },
  {
    id: 'q4',
    section: 'resource_allocation',
    question: 'Were resources allocated efficiently?',
    type: 'rating',
    mandatory: true,
  },
  {
    id: 'q5',
    section: 'resource_allocation',
    question: 'Were there any critical resource shortages?',
    type: 'text',
    mandatory: false,
  },
  {
    id: 'q6',
    section: 'team_coordination',
    question: 'How well did the team coordinate?',
    type: 'rating',
    mandatory: true,
  },
  {
    id: 'q7',
    section: 'team_coordination',
    question: 'Were command decisions clear and timely?',
    type: 'multiple_choice',
    mandatory: true,
    options: ['Yes, always', 'Usually', 'Sometimes', 'Rarely', 'Never'],
  },
  {
    id: 'q8',
    section: 'safety',
    question: 'Were all responders safe during the incident?',
    type: 'multiple_choice',
    mandatory: true,
    options: ['Yes, no incidents', 'Minor incidents', 'Significant incidents', 'Unsure'],
  },
  {
    id: 'q9',
    section: 'safety',
    question: 'Were safety protocols followed?',
    type: 'rating',
    mandatory: true,
  },
  {
    id: 'q10',
    section: 'lessons_learned',
    question: 'What are the top 3 lessons learned from this incident?',
    type: 'freeform',
    mandatory: true,
  },
  {
    id: 'q11',
    section: 'lessons_learned',
    question: 'What should be included in training based on this incident?',
    type: 'freeform',
    mandatory: false,
  },
];

export const debriefService = {
  questions: [...defaultQuestions],
  sessions: new Map<string, DebriefSession>(),

  initiateDebrief(
    incidentId: string,
    initiatedBy: string,
    participants: string[],
    scheduledFor?: number
  ): DebriefSession {
    const session: DebriefSession = {
      id: `debrief-${Date.now()}`,
      incidentId,
      initiatedBy,
      initiatedAt: Date.now(),
      scheduledFor,
      status: 'draft',
      participants,
      responses: [],
      actionItems: [],
    };

    this.sessions.set(session.id, session);

    auditTrailService.recordEvent(
      incidentId,
      initiatedBy,
      'DEBRIEF_INITIATED',
      `Debrief session created with ${participants.length} participants`
    );

    return session;
  },

  startDebrief(sessionId: string): DebriefSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.status = 'in_progress';
    this.sessions.set(sessionId, session);

    auditTrailService.recordEvent(
      session.incidentId,
      session.initiatedBy,
      'DEBRIEF_STARTED',
      `Debrief session ${sessionId} started`
    );

    return session;
  },

  submitResponse(sessionId: string, response: DebriefResponse): DebriefSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const existingIdx = session.responses.findIndex(
      r => r.questionId === response.questionId && r.respondentId === response.respondentId
    );
    if (existingIdx >= 0) {
      session.responses[existingIdx] = response;
    } else {
      session.responses.push(response);
    }

    this.sessions.set(sessionId, session);
    return session;
  },

  getQuestionsForSection(
    section: DebriefQuestion['section']
  ): DebriefQuestion[] {
    return this.questions.filter(q => q.section === section);
  },

  getSessionProgress(sessionId: string): {
    respondents: number;
    responsesPerRespondent: Record<string, number>;
    totalExpected: number;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const responsesPerRespondent: Record<string, number> = {};
    for (const resp of session.responses) {
      responsesPerRespondent[resp.respondentId] = (responsesPerRespondent[resp.respondentId] || 0) + 1;
    }

    return {
      respondents: Object.keys(responsesPerRespondent).length,
      responsesPerRespondent,
      totalExpected: session.participants.length * this.questions.length,
    };
  },

  addActionItem(
    sessionId: string,
    description: string,
    assignee: string,
    dueDate: number,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): DebriefSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.actionItems.push({
      id: `action-${Date.now()}`,
      description,
      assignee,
      dueDate,
      priority,
      status: 'open',
    });

    this.sessions.set(sessionId, session);

    auditTrailService.recordEvent(
      session.incidentId,
      session.initiatedBy,
      'ACTION_ITEM_CREATED',
      `Action: ${description} → ${assignee}`
    );

    return session;
  },

  completeDebrief(sessionId: string, summary: string): DebriefSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.status = 'completed';
    session.summary = summary;
    session.completedAt = Date.now();

    this.sessions.set(sessionId, session);

    auditTrailService.recordEvent(
      session.incidentId,
      session.initiatedBy,
      'DEBRIEF_COMPLETED',
      `Debrief finalized with ${session.actionItems.length} action items`
    );

    return session;
  },

  generateDebriefReport(sessionId: string): {
    title: string;
    timestamp: string;
    participants: number;
    responses: number;
    sections: Record<string, { score: number; responses: string[] }>;
    actionItems: string;
    summary: string;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const sections: Record<string, { score: number; responses: string[] }> = {};

    for (const q of this.questions) {
      if (!sections[q.section]) {
        sections[q.section] = { score: 0, responses: [] };
      }

      const answers = session.responses.filter(r => r.questionId === q.id);
      for (const ans of answers) {
        if (typeof ans.answer === 'number') {
          sections[q.section].score += ans.answer;
        }
        sections[q.section].responses.push(`${ans.respondentId}: ${ans.answer}`);
      }
    }

    const actionItemsText = session.actionItems
      .map(ai => `• ${ai.description} (${ai.assignee}, due ${new Date(ai.dueDate).toLocaleDateString()})`)
      .join('\n');

    return {
      title: `Debrief Report for Incident ${session.incidentId}`,
      timestamp: new Date(session.completedAt || Date.now()).toLocaleString(),
      participants: session.participants.length,
      responses: session.responses.length,
      sections,
      actionItems: actionItemsText,
      summary: session.summary || 'No summary provided',
    };
  },

  getSession(sessionId: string): DebriefSession | undefined {
    return this.sessions.get(sessionId);
  },

  getIncidentDebriefs(incidentId: string): DebriefSession[] {
    return Array.from(this.sessions.values()).filter(s => s.incidentId === incidentId);
  },
};
