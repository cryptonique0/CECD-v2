// IncidentEventPersistenceService
// Persists incident events for replay after crash or restart
// Used for reliability and crash recovery

import type { Incident } from '../types';
import { privacyPolicyService } from './privacyPolicyService';

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

  // Get all events for an incident, enforcing privacy/retention
  getEventsForIncident(incidentId: string): IncidentEvent[] {
    const events = this.eventLog.filter(e => e.incidentId === incidentId);
    // Enforce retention/anonymization
    return privacyPolicyService.enforceRetention(events, 'incident');
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
