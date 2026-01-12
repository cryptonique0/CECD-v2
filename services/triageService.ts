// triageService.ts
// Automated triage: severity scoring, auto-routing, responder assignment

import type { Incident, User } from '../types';

export interface TriageResult {
  incidentId: string;
  severityScore: number; // 0-100
  priorityLevel: 'critical' | 'high' | 'moderate' | 'low';
  autoRoute: string[]; // Suggested responder IDs
  assignmentNarrative: string;
  timestamp: number;
}

class TriageService {
  private triageResults: TriageResult[] = [];

  // Simulate triage scoring and assignment
  triageIncident(incident: Incident, responders: User[]): TriageResult {
    // Dynamic severity scoring (replace with real logic/ML)
    const severityScore = Math.min(100, Math.max(0, Math.round(Math.random() * 100)));
    let priorityLevel: TriageResult['priorityLevel'] = 'low';
    if (severityScore > 80) priorityLevel = 'critical';
    else if (severityScore > 60) priorityLevel = 'high';
    else if (severityScore > 40) priorityLevel = 'moderate';
    // Auto-routing: pick top 3 available responders
    const autoRoute = responders.slice(0, 3).map(r => r.id);
    const assignmentNarrative = `Incident ${incident.title}: Severity ${severityScore}/100 (${priorityLevel}). Assigned responders: ${autoRoute.join(', ')}`;
    const result: TriageResult = {
      incidentId: incident.id,
      severityScore,
      priorityLevel,
      autoRoute,
      assignmentNarrative,
      timestamp: Date.now()
    };
    this.triageResults.push(result);
    return result;
  }

  getTriageResult(incidentId: string): TriageResult | undefined {
    return this.triageResults.find(t => t.incidentId === incidentId);
  }

  getAllTriageResults(): TriageResult[] {
    return this.triageResults;
  }
}

export const triageService = new TriageService();
