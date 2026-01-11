import { Incident } from "../types";
import { auditTrailService } from "./auditTrailService";

interface DisclosureSchedule {
  incidentId: string;
  scheduledAt: number; // epoch ms
  summary?: string;
  createdBy: string;
}

const schedules = new Map<string, DisclosureSchedule>();
const publication = new Map<string, { incidentId: string; publishedAt: number; summary?: string }>();

export const disclosureService = {
  scheduleDisclosure(incident: Incident, scheduledAt: number, actor: string, summary?: string): Incident {
    const sch: DisclosureSchedule = { incidentId: incident.id, scheduledAt, createdBy: actor, summary };
    schedules.set(incident.id, sch);
    const updated: Incident = { ...incident, disclosure: { ...(incident.disclosure || {}), scheduledAt, isPublic: false, summary } };
    auditTrailService.recordEvent(incident.id, actor, 'DISCLOSURE_SCHEDULED', `Public at ${new Date(scheduledAt).toISOString()}${summary ? ` • ${summary}` : ''}`);
    return updated;
  },

  cancelDisclosure(incident: Incident, actor: string): Incident {
    schedules.delete(incident.id);
    const updated: Incident = { ...incident, disclosure: { ...(incident.disclosure || {}), scheduledAt: undefined } };
    auditTrailService.recordEvent(incident.id, actor, 'DISCLOSURE_CANCELLED', `Cancelled`);
    return updated;
  },

  publishNow(incident: Incident, actor: string, summary?: string): Incident {
    publication.set(incident.id, { incidentId: incident.id, publishedAt: Date.now(), summary });
    schedules.delete(incident.id);
    const updated: Incident = { ...incident, disclosure: { ...(incident.disclosure || {}), isPublic: true, scheduledAt: undefined, summary } };
    auditTrailService.recordEvent(incident.id, actor, 'DISCLOSURE_PUBLISHED', `Immediate${summary ? ` • ${summary}` : ''}`);
    return updated;
  },

  tickAutoPublish(getIncident: (id: string) => Incident | undefined, updateIncident: (updated: Incident) => void): void {
    const now = Date.now();
    for (const [incidentId, sch] of schedules.entries()) {
      if (sch.scheduledAt <= now) {
        const inc = getIncident(incidentId);
        if (!inc) continue;
        const updated = this.publishNow(inc, sch.createdBy, sch.summary);
        updateIncident(updated);
      }
    }
  },

  getPublication(incidentId: string): { incidentId: string; publishedAt: number; summary?: string } | undefined {
    return publication.get(incidentId);
  },

  getSchedule(incidentId: string): DisclosureSchedule | undefined {
    return schedules.get(incidentId);
  }
};
