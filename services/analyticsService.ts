import { Incident, IncidentCategory, IncidentStatus, Severity, User } from "../types";
import { playbookService } from "./playbookService";
import { auditTrailService } from "./auditTrailService";

export interface ResponseTimeMetric {
  day: number;
  avgResponseTimeMins: number;
  medianResponseTimeMins: number;
  p95ResponseTimeMins: number;
  incidentsResponded: number;
}

export interface SuccessRateByCategory {
  category: IncidentCategory;
  resolved: number;
  total: number;
  successRate: number;
  avgResolutionTimeMins: number;
}

export interface ResponderPerformance {
  id: string;
  name: string;
  skillPrimary: string;
  incidentsResponded: number;
  avgResponseTimeMins: number;
  successRate: number;
  trustScore: number;
  location: string;
  status: string;
}

export const analyticsService = {
  async get30DayTrends() {
    // Mock data for time-series analysis with more realistic patterns
    return Array.from({ length: 30 }, (_, i) => {
      const baseIncidents = 5 + Math.floor(i / 10) * 3;
      const variance = Math.sin(i * 0.3) * 3;
      return {
        day: i + 1,
        incidents: Math.max(1, Math.floor(baseIncidents + variance + Math.random() * 4)),
        resolved: Math.max(0, Math.floor(baseIncidents * 0.8 + Math.random() * 2)),
        avgResponseTime: 8 + Math.random() * 6,
        successRate: 0.82 + Math.random() * 0.15
      };
    });
  },

  getResponseTimeMetrics(incidents: Incident[]): ResponseTimeMetric[] {
    const byDay = new Map<number, number[]>();
    const now = Date.now();
    
    incidents.forEach(inc => {
      const dayOfWeek = Math.floor((now - inc.timestamp) / (24 * 60 * 60 * 1000)) % 30;
      if (dayOfWeek >= 0 && dayOfWeek < 30) {
        if (!byDay.has(dayOfWeek)) byDay.set(dayOfWeek, []);
        
        // Simulate response time in minutes
        const responseTime = 5 + Math.random() * 15;
        byDay.get(dayOfWeek)!.push(responseTime);
      }
    });

    return Array.from({ length: 30 }, (_, i) => {
      const responseTimes = byDay.get(i) || [];
      if (responseTimes.length === 0) {
        return {
          day: i + 1,
          avgResponseTimeMins: 0,
          medianResponseTimeMins: 0,
          p95ResponseTimeMins: 0,
          incidentsResponded: 0
        };
      }
      
      responseTimes.sort((a, b) => a - b);
      const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const median = responseTimes[Math.floor(responseTimes.length / 2)];
      const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];

      return {
        day: i + 1,
        avgResponseTimeMins: Math.round(avg * 10) / 10,
        medianResponseTimeMins: Math.round(median * 10) / 10,
        p95ResponseTimeMins: Math.round(p95 * 10) / 10,
        incidentsResponded: responseTimes.length
      };
    });
  },

  getSuccessRateByCategory(incidents: Incident[]): SuccessRateByCategory[] {
    const byCategory = new Map<IncidentCategory, Incident[]>();
    
    incidents.forEach(inc => {
      if (!byCategory.has(inc.category)) {
        byCategory.set(inc.category, []);
      }
      byCategory.get(inc.category)!.push(inc);
    });

    return Array.from(byCategory.entries()).map(([category, incs]) => {
      const resolved = incs.filter(i => i.status === IncidentStatus.RESOLVED || i.status === IncidentStatus.CLOSED).length;
      const total = incs.length;
      const successRate = total > 0 ? resolved / total : 0;
      
      const resolutionTimes = incs
        .filter(i => i.status === IncidentStatus.RESOLVED || i.status === IncidentStatus.CLOSED)
        .map(i => (Date.now() - i.timestamp) / (60 * 1000));
      
      const avgResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

      return {
        category,
        resolved,
        total,
        successRate: Math.round(successRate * 100) / 100,
        avgResolutionTimeMins: Math.round(avgResolutionTime * 10) / 10
      };
    }).sort((a, b) => b.successRate - a.successRate);
  },

  getResponderPerformanceHeatmap(incidents: Incident[], volunteers: User[]): ResponderPerformance[] {
    return volunteers.map(vol => {
      const assigned = incidents.filter(inc => inc.assignedResponders.includes(vol.id));
      const resolved = assigned.filter(inc => inc.status === IncidentStatus.RESOLVED || inc.status === IncidentStatus.CLOSED).length;
      
      const responseTimes = assigned.map(inc => (Date.now() - inc.timestamp) / (60 * 1000));
      const avgResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length * 10) / 10
        : 0;
      
      const successRate = assigned.length > 0 
        ? Math.round((resolved / assigned.length) * 100) / 100
        : 0;

      return {
        id: vol.id,
        name: vol.name,
        skillPrimary: vol.skills[0] || 'General',
        incidentsResponded: assigned.length,
        avgResponseTimeMins: avgResponseTime,
        successRate,
        trustScore: vol.trustScore,
        location: vol.location || 'Unknown',
        status: vol.status
      };
    }).sort((a, b) => b.successRate - a.successRate);
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
  },

  exportAnalyticsReport(incidents: Incident[], volunteers: User[]): {
    timestamp: number;
    totalIncidents: number;
    resolvedIncidents: number;
    successRate: number;
    topResponders: ResponderPerformance[];
    categoryBreakdown: SuccessRateByCategory[];
    regionReadiness: Array<any>;
  } {
    const resolvedIncidents = incidents.filter(i => i.status === IncidentStatus.RESOLVED || i.status === IncidentStatus.CLOSED).length;
    const successRate = incidents.length > 0 ? resolvedIncidents / incidents.length : 0;
    
    return {
      timestamp: Date.now(),
      totalIncidents: incidents.length,
      resolvedIncidents,
      successRate: Math.round(successRate * 100) / 100,
      topResponders: this.getResponderPerformanceHeatmap(incidents, volunteers).slice(0, 5),
      categoryBreakdown: this.getSuccessRateByCategory(incidents),
      regionReadiness: this.getReadinessByRegion(incidents, volunteers)
    };
  },

  downloadAnalyticsAsJSON(incidents: Incident[], volunteers: User[]): void {
    const report = this.exportAnalyticsReport(incidents, volunteers);
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  downloadAnalyticsAsCSV(incidents: Incident[], volunteers: User[]): void {
    const report = this.exportAnalyticsReport(incidents, volunteers);
    const rows = [
      ['Analytics Report', new Date().toISOString()],
      [],
      ['Metric', 'Value'],
      ['Total Incidents', report.totalIncidents],
      ['Resolved Incidents', report.resolvedIncidents],
      ['Success Rate (%)', Math.round(report.successRate * 100)],
      [],
      ['Top Responders'],
      ['Name', 'Skill', 'Incidents Responded', 'Success Rate (%)', 'Avg Response (min)'],
      ...report.topResponders.map(r => [r.name, r.skillPrimary, r.incidentsResponded, Math.round(r.successRate * 100), r.avgResponseTimeMins]),
      [],
      ['Success by Category'],
      ['Category', 'Resolved', 'Total', 'Success Rate (%)', 'Avg Resolution (min)'],
      ...report.categoryBreakdown.map(c => [c.category, c.resolved, c.total, Math.round(c.successRate * 100), c.avgResolutionTimeMins])
    ];

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
