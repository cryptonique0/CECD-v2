import { Incident } from "../types";
import { auditTrailService } from "./auditTrailService";

export type RedactionMode = 'none' | 'coarse' | 'hidden';

function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

export const incidentPrivacyService = {
  setSensitive(incident: Incident, isSensitive: boolean, actor: string, reason?: string): Incident {
    const updated: Incident = {
      ...incident,
      isSensitive,
      redactionReason: reason || incident.redactionReason,
      locationRedaction: isSensitive ? (incident.locationRedaction || 'coarse') : (incident.locationRedaction || 'none'),
    };
    auditTrailService.recordEvent(incident.id, actor, 'PRIVACY_SENSITIVITY_SET', `${isSensitive ? 'Sensitive' : 'Normal'}${reason ? ` • ${reason}` : ''}`);
    return updated;
  },

  setLocationRedaction(incident: Incident, mode: RedactionMode, actor: string): Incident {
    const updated: Incident = {
      ...incident,
      locationRedaction: mode,
    };
    auditTrailService.recordEvent(incident.id, actor, 'PRIVACY_LOCATION_REDACTION', `Mode: ${mode}`);
    return updated;
  },

  getDisplayLocation(incident: Incident): { name: string; lat?: number; lng?: number; subtitle?: string } {
    const mode = incident.locationRedaction || 'none';
    if (mode === 'hidden') {
      return {
        name: '[REDACTED]',
        subtitle: incident.redactionReason || 'Location withheld for safety',
      };
    }
    if (mode === 'coarse') {
      return {
        name: incident.locationName,
        lat: roundTo(incident.lat, 2), // ~1km precision
        lng: roundTo(incident.lng, 2),
        subtitle: 'Approximate coordinates',
      };
    }
    return {
      name: incident.locationName,
      lat: incident.lat,
      lng: incident.lng,
    };
  }
};
