import { Incident, IncidentCategory, Severity } from "../types";
import { auditTrailService } from "./auditTrailService";

export interface ShiftSummary {
  incidentId: string;
  sinceTimestamp: number;
  summary: string;
}

export interface Last30MinBrief {
  incidentId: string;
  generatedAt: number;
  brief: string;
}

function normalizeText(text: string): string {
  return text
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumber(text: string, pattern: RegExp): number | undefined {
  const m = text.match(pattern);
  if (!m) return undefined;
  const num = parseInt(m[1], 10);
  return isNaN(num) ? undefined : num;
}

function inferCategory(text: string): IncidentCategory | undefined {
  const t = text.toLowerCase();
  if (/(fire|smoke|burn)/.test(t)) return "Fire" as IncidentCategory;
  if (/(flood|water|inundation)/.test(t)) return "Flood" as IncidentCategory;
  if (/(earthquake|tremor|seismic)/.test(t)) return "Earthquake" as IncidentCategory;
  if (/(storm|hurricane|tornado|wind)/.test(t)) return "Storm" as IncidentCategory;
  if (/(medical|injur|casualty|patient)/.test(t)) return "Medical" as IncidentCategory;
  return undefined;
}

function inferSeverity(text: string): Severity | undefined {
  const t = text.toLowerCase();
  if (/(minor|small)/.test(t)) return "Low" as Severity;
  if (/(moderate|medium)/.test(t)) return "Medium" as Severity;
  if (/(severe|major|critical|out of control)/.test(t)) return "High" as Severity;
  return undefined;
}

function extractLocation(text: string): { name?: string; lat?: number; lng?: number } {
  const t = text;
  const coordMatch = t.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  const result: { name?: string; lat?: number; lng?: number } = {};
  if (coordMatch) {
    result.lat = parseFloat(coordMatch[1]);
    result.lng = parseFloat(coordMatch[2]);
  }
  // Heuristic for named locations like "at Main Street near 5th Ave"
  const nameMatch = t.match(/at\s+([^\.\n]+)/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }
  return result;
}

function extractLists(text: string): { resourceNeeds: string[]; actions: string[] } {
  const t = text.toLowerCase();
  const needs: string[] = [];
  const actions: string[] = [];

  const needKeywords = [
    "water",
    "food",
    "shelter",
    "medical",
    "generator",
    "fuel",
    "ambulance",
    "fire truck",
    "police",
    "rescue",
  ];
  needKeywords.forEach((k) => {
    if (t.includes(k)) needs.push(k);
  });

  const actionKeywords = [
    "evacuate",
    "secure perimeter",
    "triage",
    "distribute",
    "dispatch",
    "close road",
    "open shelter",
  ];
  actionKeywords.forEach((k) => {
    if (t.includes(k)) actions.push(k);
  });

  // Deduplicate
  return {
    resourceNeeds: Array.from(new Set(needs)),
    actions: Array.from(new Set(actions)),
  };
}

export const commsCopilotService = {
  // Ingests raw transcribed field audio and produces structured report
  parseVoiceToReport(text: string) {
    const normalized = normalizeText(text);

    const category = inferCategory(normalized);
    const severity = inferSeverity(normalized);
    const { name: locationName, lat, lng } = extractLocation(normalized);
    const victimsCount = extractNumber(normalized, /(\d+)\s+(victims|injured|casualties)/i);
    const vehiclesInvolved = extractNumber(normalized, /(\d+)\s+(vehicles|cars|trucks)/i);
    const { resourceNeeds, actions } = extractLists(normalized);

    const title = category ? `${category} report` : "Field report";

    return {
      title,
      description: normalized,
      category,
      severity,
      locationName,
      lat,
      lng,
      resourceNeeds,
      actions,
      victimsCount,
      vehiclesInvolved,
    };
  },

  // Creates a shift-change summary for an incident since a given timestamp
  generateShiftSummary(incident: Incident, sinceTimestamp: number): ShiftSummary {
    const events = auditTrailService.getEventsForIncident(incident.id) || [];
    const sinceEvents = events.filter((e: any) => e.timestamp >= sinceTimestamp);

    const countsByType: Record<string, number> = {};
    sinceEvents.forEach((e: any) => {
      const key = e.type || "event";
      countsByType[key] = (countsByType[key] || 0) + 1;
    });

    const topTypes = Object.entries(countsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => `${type}: ${count}`)
      .join("; ");

    const summary = `Shift summary for incident ${incident.id}: ${sinceEvents.length} events since ${new Date(
      sinceTimestamp
    ).toLocaleString()}. Notable activity — ${topTypes || "no notable changes"}.`;

    return {
      incidentId: incident.id,
      sinceTimestamp,
      summary,
    };
  },

  // Generates a brief from the last 30 minutes of activity
  generateLast30MinBrief(incident: Incident): Last30MinBrief {
    const now = Date.now();
    const thirtyMinAgo = now - 30 * 60 * 1000;
    const events = auditTrailService.getEventsForIncident(incident.id) || [];
    const recent = events.filter((e: any) => e.timestamp >= thirtyMinAgo);

    const critical = recent.filter((e: any) => /critical|approval|anchor|disburse/i.test(e.type || ""));
    const actions = recent.filter((e: any) => /action|step|dispatch|assign/i.test(e.type || ""));

    const brief = [
      `Last 30 min for incident ${incident.id}: ${recent.length} events.`,
      critical.length ? `Critical: ${critical.length} checkpoints.` : undefined,
      actions.length ? `Ops: ${actions.length} actions/assignments.` : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      incidentId: incident.id,
      generatedAt: now,
      brief,
    };
  },
};
