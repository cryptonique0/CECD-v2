// interoperabilityService.ts
// Cross-agency interoperability: EDXL, CAP, OCHA standards, connectors

export type AgencyType = 'police' | 'fire' | 'ems' | 'ngo' | 'government';
export type DataStandard = 'EDXL' | 'CAP' | 'OCHA_3W';

export interface InteropIncident {
  id: string;
  title: string;
  category: string;
  severity: string;
  location: { lat: number; lng: number; region?: string };
  status: string;
  agency: AgencyType;
  timestamp: number;
  dataStandard: DataStandard;
  rawPayload?: any;
}

class InteroperabilityService {
  private incidents: InteropIncident[] = [];

  // Import incident from external agency (EDXL, CAP, OCHA)
  importIncident(payload: any, standard: DataStandard, agency: AgencyType): InteropIncident {
    // Map payload to internal format
    let incident: InteropIncident = {
      id: payload.id || `interop-${Date.now()}`,
      title: payload.title || payload.incidentType || 'Unknown',
      category: payload.category || payload.type || 'general',
      severity: payload.severity || 'moderate',
      location: payload.location || { lat: 0, lng: 0 },
      status: payload.status || 'reported',
      agency,
      timestamp: payload.timestamp || Date.now(),
      dataStandard: standard,
      rawPayload: payload
    };
    this.incidents.push(incident);
    return incident;
  }

  // Export incident to external agency format
  exportIncident(incident: InteropIncident, standard: DataStandard): any {
    // Map internal format to external schema
    if (standard === 'EDXL') {
      return {
        id: incident.id,
        incidentType: incident.title,
        category: incident.category,
        severity: incident.severity,
        location: incident.location,
        status: incident.status,
        timestamp: incident.timestamp
      };
    } else if (standard === 'CAP') {
      return {
        identifier: incident.id,
        event: incident.title,
        urgency: incident.severity,
        area: incident.location.region,
        status: incident.status,
        sent: new Date(incident.timestamp).toISOString()
      };
    } else if (standard === 'OCHA_3W') {
      return {
        id: incident.id,
        title: incident.title,
        type: incident.category,
        region: incident.location.region,
        status: incident.status,
        agency: incident.agency
      };
    }
    return incident;
  }

  // List all imported incidents
  getInteropIncidents(): InteropIncident[] {
    return this.incidents;
  }

  // Connectors for external APIs (stub)
  async fetchFromAgencyAPI(endpoint: string, apiKey: string): Promise<any> {
    // TODO: Implement real API call
    return { status: 'ok', data: [] };
  }
}

export const interoperabilityService = new InteroperabilityService();
