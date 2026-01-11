import { Incident, IncidentCategory, IncidentStatus, Severity, User } from "../types";
import { playbookService } from "./playbookService";
import { auditTrailService } from "./auditTrailService";
export const analyticsService = {
  async get30DayTrends() {
    // Mock data for time-series analysis
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      incidents: Math.floor(Math.random() * 10) + (i > 20 ? 15 : 0), // Simulate a recent spike
      resolved: Math.floor(Math.random() * 8)
    }));
  },

  async getRiskHeatmap() {
    return [
      { location: 'New York, USA', riskLevel: 'Critical', activeIncidents: 12, trend: 'Increasing' },
      { location: 'London, UK', riskLevel: 'High', activeIncidents: 8, trend: 'Stable' },
      { location: 'Moscow, Russia', riskLevel: 'Medium', activeIncidents: 4, trend: 'Decreasing' },
      { location: 'Beijing, China', riskLevel: 'Low', activeIncidents: 2, trend: 'Stable' }
    ];
  },

  async getVolunteerPerformance() {
    return [
      { name: 'Unit Alpha', responseTime: '4.2m', completionRate: '98%' },
      { name: 'Unit Beta', responseTime: '5.8m', completionRate: '94%' },
      { name: 'Unit Gamma', responseTime: '6.1m', completionRate: '91%' }
    ];
  },

  getReadinessByRegion(incidents: Incident[], volunteers: User[]) {
    const byRegion = new Map<string, { incidents: Incident[]; volunteers: User[] }>();
    incidents.forEach(inc => {
      const region = inc.locationName;
      const entry = byRegion.get(region) || { incidents: [], volunteers: [] };
      entry.incidents.push(inc);
      byRegion.set(region, entry);
    });
    volunteers.forEach(v => {
      const region = v.location || 'Unknown';
      const entry = byRegion.get(region) || { incidents: [], volunteers: [] };
      entry.volunteers.push(v);
      byRegion.set(region, entry);
    });

    const severityMinutes: Record<Severity, number> = {
      [Severity.CRITICAL]: 8,
      [Severity.HIGH]: 12,
      [Severity.MEDIUM]: 15,
      [Severity.LOW]: 20,
    };

    return Array.from(byRegion.entries()).map(([region, data]) => {
      const incidentCount = data.incidents.length || 1;
      const avgResponseMins =
        data.incidents.reduce((acc, inc) => acc + (severityMinutes[inc.severity] || 15), 0) / incidentCount;
      const closures = data.incidents.filter(i => i.status === IncidentStatus.RESOLVED || i.status === IncidentStatus.CLOSED).length;
      const closureRate = incidentCount > 0 ? (closures / incidentCount) : 0;
      const gapsSet = new Set<string>();
      data.incidents.slice(0, 5).forEach(inc => {
        const pb = playbookService.generatePlaybook(inc, data.volunteers);
        pb.resourceGaps.forEach(g => gapsSet.add(g));
      });
      const skillGaps = Array.from(gapsSet);
      const readinessScore = Math.max(0, Math.min(1, (0.5 * (1 - (avgResponseMins / 20))) + (0.4 * closureRate) + (0.1 * (skillGaps.length === 0 ? 1 : Math.max(0, 1 - skillGaps.length / 5)))));
      return { region, avgResponseMins, closureRate, skillGaps, readinessScore };
    });
  },

  detectAnomalies(incidents: Incident[], users: User[]) {
    const userById = new Map(users.map(u => [u.id, u]));
    return incidents.map(inc => {
      let score = 0;
      const reporter = userById.get(inc.reporterId);
      if (!reporter || reporter.trustScore < 0.3) score += 0.3;
      if ((inc.confidenceScore || 0.5) < 0.4) score += 0.4;
      const text = (inc.description + ' ' + (inc.translatedDescription || '')).toLowerCase();
      const badTerms = ['spam', 'test', 'fake', 'hoax'];
      if (badTerms.some(t => text.includes(t))) score += 0.4;
      const suspicious = score >= 0.6;
      return {
        incidentId: inc.id,
        region: inc.locationName,
        suspicionScore: Math.min(1, score),
        reason: suspicious ? 'Low confidence + reporter trust or suspicious terms' : 'Normal',
        flagged: suspicious,
      };
    }).filter(a => a.flagged);
  },

  simulateDrills(region: string, scenario: IncidentCategory, count: number): Incident[] {
    const now = Date.now();
    const severities: Severity[] = [Severity.LOW, Severity.MEDIUM, Severity.HIGH];
    const sims: Incident[] = Array.from({ length: count }, (_, i) => ({
      id: `DRILL-${region.replace(/\s+/g, '-')}-${scenario}-${now + i}`,
      title: `Drill: ${scenario} ${i + 1}`,
      description: `Simulation event for readiness drill in ${region}.`,
      category: scenario,
      severity: severities[Math.floor(Math.random() * severities.length)],
      status: IncidentStatus.REPORTED,
      locationName: region,
      lat: 0,
      lng: 0,
      reporterId: 'system-drill',
      timestamp: now + i * 60000,
      assignedResponders: [],
      isWhisperMode: false,
      pendingSync: false,
    }));
    sims.forEach(sim => auditTrailService.recordEvent(sim.id, 'system', 'DRILL_SIMULATED', `Scenario ${scenario} @ ${region}`));
    return sims;
  }
};
