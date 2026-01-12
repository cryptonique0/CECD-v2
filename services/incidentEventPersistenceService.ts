// IncidentEventPersistenceService
// Persists incident events for replay after crash or restart
// Used for reliability and crash recovery

import type { Incident } from '../types';

interface IncidentEvent {
  incidentId: string;
  timestamp: number;
  eventType: string;
  eventData: any;
}

class IncidentEventPersistenceService {
  private eventLog: IncidentEvent[] = [];

  // Persist an incident event
  persistEvent(incidentId: string, eventType: string, eventData: any) {
    this.eventLog.push({
      incidentId,
      timestamp: Date.now(),
      eventType,
      eventData
    });
    // TODO: Write to disk/db for durability
  }

  // Get all events for an incident
  getEventsForIncident(incidentId: string): IncidentEvent[] {
    return this.eventLog.filter(e => e.incidentId === incidentId);
  }

  // Replay events for an incident (after crash)
  replayIncident(incidentId: string): Incident[] {
    const events = this.getEventsForIncident(incidentId);
    let incident: Incident | null = null;
    for (const e of events) {
      if (e.eventType === 'create') {
        incident = { ...e.eventData };
      } else if (incident) {
        // Apply event mutation
        Object.assign(incident, e.eventData);
      }
    }
    return incident ? [incident] : [];
  }

  // Clear events (for testing)
  clearEvents() {
    this.eventLog = [];
  }
}

export const incidentEventPersistenceService = new IncidentEventPersistenceService();
