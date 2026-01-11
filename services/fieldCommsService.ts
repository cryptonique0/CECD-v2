import { Incident } from "../types";
import { aiService, PredictionResult } from "./aiService";
import { auditTrailService, AuditEvent } from "./auditTrailService";

export interface StructuredReport {
  transcript: string;
  prediction: PredictionResult;
  extracted: {
    victims?: number;
    locationHint?: string;
    immediateNeeds?: string[];
  };
}

function extractVictims(text: string): number | undefined {
  const m = text.match(/(\b\d{1,3})\s*(injured|wounded|victims|people)/i);
  return m ? parseInt(m[1], 10) : undefined;
}

function extractLocationHint(text: string): string | undefined {
  const m = text.match(/near\s+([A-Za-z\s]+)|at\s+([A-Za-z\s]+)/i);
  return m ? (m[1] || m[2])?.trim() : undefined;
}

function extractNeeds(text: string): string[] {
  const needs: string[] = [];
  ['water', 'food', 'medical', 'evacuation', 'generator', 'fuel', 'shelter'].forEach(n => {
    if (text.toLowerCase().includes(n)) needs.push(n);
  });
  return needs;
}

export const fieldCommsService = {
  async transcribeAndStructure(transcriptText: string): Promise<StructuredReport> {
    const prediction = await aiService.predictIncident(transcriptText);
    const structured: StructuredReport = {
      transcript: transcriptText,
      prediction,
      extracted: {
        victims: extractVictims(transcriptText),
        locationHint: extractLocationHint(transcriptText),
        immediateNeeds: extractNeeds(transcriptText),
      },
    };
    return structured;
  },

  generateShiftSummary(incidentId: string): { summary: string; highlights: string[] } {
    const timeline = auditTrailService.getTimeline(incidentId);
    if (!timeline || timeline.events.length === 0) {
      return { summary: 'No recent activity.', highlights: [] };
    }
    const events = timeline.events.slice(-20);
    const counts: Record<string, number> = {};
    events.forEach(e => { counts[e.action] = (counts[e.action] || 0) + 1; });
    const highlights: string[] = [];
    if (counts['EVIDENCE_UPLOADED']) highlights.push(`${counts['EVIDENCE_UPLOADED']} evidence uploaded`);
    if (counts['CRITICAL_ACTION_SIGNED']) highlights.push(`${counts['CRITICAL_ACTION_SIGNED']} approvals signed`);
    if (counts['STEP_DONATION_PLEDGED']) highlights.push(`${counts['STEP_DONATION_PLEDGED']} step pledges`);
    if (counts['INCIDENT_OPENED']) highlights.push('Incident opened');
    const summary = `Last shift: ${highlights.length > 0 ? highlights.join(' • ') : 'routine operations'}; ${events.length} actions recorded.`;
    return { summary, highlights };
  },

  getLast30MinBrief(incidentId: string): { windowStart: number; items: { time: string; actor: string; action: string; details: string }[] } {
    const end = Date.now();
    const start = end - 30 * 60 * 1000;
    const events = auditTrailService.getEventsByTimeRange(incidentId, start, end);
    const items = events.map(e => ({
      time: new Date(e.timestamp).toLocaleTimeString(),
      actor: e.actor,
      action: e.action,
      details: e.details,
    })).slice(-12);
    return { windowStart: start, items };
  }
};
