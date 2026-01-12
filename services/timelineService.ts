import { Incident } from '../types';

export interface TimelineEvent {
  id: string;
  incidentId: string;
  timestamp: number;
  type: 'status_change' | 'assignment' | 'resource_allocated' | 'message' | 'location_update' | 'severity_change' | 'escalation' | 'resolution';
  actor: {
    userId: string;
    name: string;
    role: string;
  };
  title: string;
  description: string;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'critical';
}

interface TimelineService {
  addEvent(incidentId: string, type: TimelineEvent['type'], actor: TimelineEvent['actor'], title: string, description: string, metadata?: Record<string, any>): TimelineEvent;
  getIncidentTimeline(incidentId: string): TimelineEvent[];
  getEventsbyType(incidentId: string, type: TimelineEvent['type']): TimelineEvent[];
  getEventsBetween(incidentId: string, startTime: number, endTime: number): TimelineEvent[];
  getLastEvent(incidentId: string): TimelineEvent | null;
  markAsViewed(userId: string, eventId: string): void;
  getUnviewedEvents(userId: string): TimelineEvent[];
}

class TimelineServiceImpl implements TimelineService {
  private events: Map<string, TimelineEvent[]> = new Map();
  private viewedEvents: Map<string, Set<string>> = new Map(); // userId -> eventIds

  addEvent(incidentId: string, type: TimelineEvent['type'], actor: TimelineEvent['actor'], title: string, description: string, metadata?: Record<string, any>): TimelineEvent {
    const event: TimelineEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incidentId,
      timestamp: Date.now(),
      type,
      actor,
      title,
      description,
      metadata,
    };

    if (!this.events.has(incidentId)) {
      this.events.set(incidentId, []);
    }
    this.events.get(incidentId)!.push(event);
    return event;
  }

  getIncidentTimeline(incidentId: string): TimelineEvent[] {
    return (this.events.get(incidentId) || []).sort((a, b) => b.timestamp - a.timestamp);
  }

  getEventsbyType(incidentId: string, type: TimelineEvent['type']): TimelineEvent[] {
    return (this.events.get(incidentId) || []).filter(e => e.type === type).sort((a, b) => b.timestamp - a.timestamp);
  }

  getEventsBetween(incidentId: string, startTime: number, endTime: number): TimelineEvent[] {
    return (this.events.get(incidentId) || [])
      .filter(e => e.timestamp >= startTime && e.timestamp <= endTime)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getLastEvent(incidentId: string): TimelineEvent | null {
    const timeline = this.getIncidentTimeline(incidentId);
    return timeline.length > 0 ? timeline[0] : null;
  }

  markAsViewed(userId: string, eventId: string): void {
    if (!this.viewedEvents.has(userId)) {
      this.viewedEvents.set(userId, new Set());
    }
    this.viewedEvents.get(userId)!.add(eventId);
  }

  getUnviewedEvents(userId: string): TimelineEvent[] {
    const viewed = this.viewedEvents.get(userId) || new Set();
    const unviewed: TimelineEvent[] = [];
    for (const events of this.events.values()) {
      unviewed.push(...events.filter(e => !viewed.has(e.id)));
    }
    return unviewed;
  }
}

export const timelineService = new TimelineServiceImpl();
