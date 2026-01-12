// ImpactService
// Tracks incident impact, lives assisted, response time improvements, and region-level reports

import type { Incident } from '../types';

export interface IncidentImpactSummary {
  incidentId: string;
  title: string;
  region: string;
  livesAssisted: number;
  responseTimeImprovement: number; // seconds
  resourcesUsed: string[];
  narrative: string;
  timestamp: number;
}

export interface RegionImpactReport {
  region: string;
  totalIncidents: number;
  totalLivesAssisted: number;
  avgResponseTimeImprovement: number;
  improvementNarrative: string;
  lastUpdated: number;
}

class ImpactService {
  private incidentSummaries: IncidentImpactSummary[] = [];
  private regionReports: RegionImpactReport[] = [];

  addIncidentImpact(summary: IncidentImpactSummary) {
    this.incidentSummaries.push(summary);
  }

  getIncidentImpact(incidentId: string): IncidentImpactSummary | undefined {
    return this.incidentSummaries.find(s => s.incidentId === incidentId);
  }

  getAllIncidentImpacts(): IncidentImpactSummary[] {
    return this.incidentSummaries;
  }

  addRegionReport(report: RegionImpactReport) {
    this.regionReports.push(report);
  }

  getRegionReport(region: string): RegionImpactReport | undefined {
    return this.regionReports.find(r => r.region === region);
  }

  getAllRegionReports(): RegionImpactReport[] {
    return this.regionReports;
  }
}

export const impactService = new ImpactService();
