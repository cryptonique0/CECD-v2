import { Incident, IncidentStatus } from '../types';
import { auditTrailService } from './auditTrailService';

export interface HandoffPacket {
  id: string;
  incidentId: string;
  initiatedBy: string;
  initiatedAt: number;
  transferFrom: string;
  transferTo: string;
  status: 'proposed' | 'acknowledged' | 'in_progress' | 'completed' | 'rejected';
  scheduledFor?: number;
  completedAt?: number;
  briefingNotes: string;
  criticalContext: string[];
  resourceInventory: Record<string, number>;
  outstandingActions: string[];
  hazardWarnings: string[];
  signatureFrom?: string;
  signatureTo?: string;
}

export interface HandoffBrief {
  summary: string;
  incidents: number;
  duration: string;
  criticalItems: string[];
  nextSteps: string[];
  emergencyContacts: string[];
}

export const handoffService = {
  handoffs: new Map<string, HandoffPacket>(),

  initiateHandoff(
    incidentId: string,
    initiatedBy: string,
    transferFrom: string,
    transferTo: string,
    briefingNotes: string,
    criticalContext: string[] = [],
    resourceInventory: Record<string, number> = {},
    outstandingActions: string[] = [],
    hazardWarnings: string[] = []
  ): HandoffPacket {
    const handoff: HandoffPacket = {
      id: `handoff-${Date.now()}`,
      incidentId,
      initiatedBy,
      initiatedAt: Date.now(),
      transferFrom,
      transferTo,
      status: 'proposed',
      briefingNotes,
      criticalContext,
      resourceInventory,
      outstandingActions,
      hazardWarnings,
    };

    this.handoffs.set(handoff.id, handoff);

    auditTrailService.recordEvent(
      incidentId,
      initiatedBy,
      'HANDOFF_INITIATED',
      `Handoff from ${transferFrom} to ${transferTo} proposed`
    );

    return handoff;
  },

  acknowledgeHandoff(handoffId: string, acknowledgedBy: string): HandoffPacket {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff ${handoffId} not found`);

    if (acknowledgedBy !== handoff.transferTo) {
      throw new Error(`Only ${handoff.transferTo} can acknowledge this handoff`);
    }

    handoff.status = 'acknowledged';
    this.handoffs.set(handoffId, handoff);

    auditTrailService.recordEvent(
      handoff.incidentId,
      acknowledgedBy,
      'HANDOFF_ACKNOWLEDGED',
      `${handoff.transferTo} acknowledged handoff from ${handoff.transferFrom}`
    );

    return handoff;
  },

  beginHandoff(handoffId: string): HandoffPacket {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff ${handoffId} not found`);

    if (handoff.status !== 'acknowledged') {
      throw new Error(`Handoff must be acknowledged before beginning. Current status: ${handoff.status}`);
    }

    handoff.status = 'in_progress';
    handoff.scheduledFor = Date.now();
    this.handoffs.set(handoffId, handoff);

    auditTrailService.recordEvent(
      handoff.incidentId,
      handoff.transferFrom,
      'HANDOFF_IN_PROGRESS',
      `Handoff from ${handoff.transferFrom} to ${handoff.transferTo} in progress`
    );

    return handoff;
  },

  completeHandoff(handoffId: string, signedByFrom: string, signedByTo: string): HandoffPacket {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff ${handoffId} not found`);

    if (handoff.status !== 'in_progress') {
      throw new Error(`Handoff must be in progress. Current status: ${handoff.status}`);
    }

    if (signedByFrom !== handoff.transferFrom) {
      throw new Error(`${handoff.transferFrom} must sign off handoff`);
    }
    if (signedByTo !== handoff.transferTo) {
      throw new Error(`${handoff.transferTo} must sign off handoff`);
    }

    handoff.status = 'completed';
    handoff.completedAt = Date.now();
    handoff.signatureFrom = signedByFrom;
    handoff.signatureTo = signedByTo;
    this.handoffs.set(handoffId, handoff);

    auditTrailService.recordEvent(
      handoff.incidentId,
      signedByFrom,
      'HANDOFF_COMPLETED',
      `Handoff from ${handoff.transferFrom} to ${handoff.transferTo} completed and signed`
    );

    return handoff;
  },

  rejectHandoff(handoffId: string, rejectedBy: string, reason: string): HandoffPacket {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff ${handoffId} not found`);

    handoff.status = 'rejected';
    this.handoffs.set(handoffId, handoff);

    auditTrailService.recordEvent(
      handoff.incidentId,
      rejectedBy,
      'HANDOFF_REJECTED',
      `Handoff rejected by ${rejectedBy}: ${reason}`
    );

    return handoff;
  },

  getHandoffPacket(handoffId: string): HandoffPacket | undefined {
    return this.handoffs.get(handoffId);
  },

  getIncidentHandoffs(incidentId: string): HandoffPacket[] {
    return Array.from(this.handoffs.values()).filter(h => h.incidentId === incidentId);
  },

  getActiveHandoff(incidentId: string): HandoffPacket | undefined {
    return Array.from(this.handoffs.values()).find(
      h => h.incidentId === incidentId && (h.status === 'proposed' || h.status === 'acknowledged' || h.status === 'in_progress')
    );
  },

  generateHandoffBrief(handoffId: string): HandoffBrief {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff ${handoffId} not found`);

    const durationMs = (handoff.completedAt || Date.now()) - handoff.initiatedAt;
    const durationMinutes = Math.round(durationMs / 1000 / 60);
    const duration =
      durationMinutes < 60
        ? `${durationMinutes}m`
        : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

    return {
      summary: handoff.briefingNotes,
      incidents: 1,
      duration,
      criticalItems: handoff.criticalContext.slice(0, 5),
      nextSteps: handoff.outstandingActions.slice(0, 5),
      emergencyContacts: [],
    };
  },

  getHandoffStatus(handoffId: string): string {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) return 'NOT_FOUND';

    const statusMessages: Record<string, string> = {
      proposed: '📋 Awaiting acknowledgement',
      acknowledged: '👋 Ready to begin',
      in_progress: '🔄 Handoff in progress',
      completed: '✅ Handoff complete',
      rejected: '❌ Handoff rejected',
    };

    return statusMessages[handoff.status] || 'UNKNOWN';
  },

  validateHandoffCompleteness(handoffId: string): {
    complete: boolean;
    missing: string[];
  } {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) return { complete: false, missing: ['Handoff not found'] };

    const missing: string[] = [];

    if (!handoff.briefingNotes || handoff.briefingNotes.trim().length === 0) {
      missing.push('Briefing notes');
    }
    if (handoff.criticalContext.length === 0) {
      missing.push('Critical context items');
    }
    if (Object.keys(handoff.resourceInventory).length === 0) {
      missing.push('Resource inventory');
    }
    if (handoff.outstandingActions.length === 0) {
      missing.push('Outstanding actions');
    }
    if (handoff.hazardWarnings.length === 0) {
      missing.push('Hazard warnings');
    }

    return {
      complete: missing.length === 0,
      missing,
    };
  },
};
