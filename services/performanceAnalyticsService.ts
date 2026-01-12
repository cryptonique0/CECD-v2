export interface AnalyticsMetric {
  id: string;
  type: 'response_time' | 'resolution_time' | 'success_rate' | 'team_performance' | 'resource_utilization';
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface IncidentAnalytics {
  totalIncidents: number;
  resolvedIncidents: number;
  activeIncidents: number;
  averageResponseTime: number; // minutes
  averageResolutionTime: number; // minutes
  successRate: number; // 0-100
  byCategoryBreakdown: Record<string, number>;
  bySeverityBreakdown: Record<string, number>;
  byStatusBreakdown: Record<string, number>;
  trendData: AnalyticsMetric[];
}

export interface ResponderAnalytics {
  responderId: string;
  name: string;
  role: string;
  totalIncidentsResponded: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  successRate: number;
  skillsMastered: string[];
  skillsDeveloping: string[];
  performanceScore: number; // 0-100
}

export interface ResourceAnalytics {
  resourceId: string;
  name: string;
  totalAllocations: number;
  averageUtilizationTime: number; // minutes
  utilizationRate: number; // 0-100
  currentStatus: 'available' | 'allocated' | 'in-maintenance';
  lastMaintenanceDate: number;
}

interface AnalyticsService {
  recordIncident(incidentId: string, category: string, severity: string, responseTime: number, resolutionTime: number, success: boolean): void;
  recordResponderAction(responderId: string, incidentId: string, actionType: string): void;
  recordResourceUsage(resourceId: string, quantity: number, duration: number): void;
  getIncidentAnalytics(startDate?: number, endDate?: number): IncidentAnalytics;
  getResponderAnalytics(responderId: string): ResponderAnalytics;
  getResourceAnalytics(resourceId: string): ResourceAnalytics;
  getTopPerformers(limit: number): ResponderAnalytics[];
  getIncidentTrends(period: 'daily' | 'weekly' | 'monthly'): AnalyticsMetric[];
  comparePerformance(responderId1: string, responderId2: string): { responder1: ResponderAnalytics; responder2: ResponderAnalytics };
  exportAnalytics(format: 'json' | 'csv'): string;
}

class AnalyticsServiceImpl implements AnalyticsService {
  private incidents: Array<any> = [];
  private responderActions: Map<string, any[]> = new Map();
  private resourceUsage: Map<string, any[]> = new Map();
  private metrics: AnalyticsMetric[] = [];

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleIncidents = [
      { id: 'inc-1', category: 'Medical', severity: 'High', responseTime: 8, resolutionTime: 45, success: true, timestamp: Date.now() - 86400000 },
      { id: 'inc-2', category: 'Fire', severity: 'Critical', responseTime: 5, resolutionTime: 120, success: true, timestamp: Date.now() - 172800000 },
      { id: 'inc-3', category: 'Medical', severity: 'Medium', responseTime: 12, resolutionTime: 30, success: true, timestamp: Date.now() - 259200000 },
      { id: 'inc-4', category: 'Security', severity: 'Medium', responseTime: 15, resolutionTime: 60, success: false, timestamp: Date.now() - 345600000 },
    ];

    sampleIncidents.forEach(inc => this.recordIncident(inc.id, inc.category, inc.severity, inc.responseTime, inc.resolutionTime, inc.success));
  }

  recordIncident(incidentId: string, category: string, severity: string, responseTime: number, resolutionTime: number, success: boolean): void {
    this.incidents.push({
      incidentId,
      category,
      severity,
      responseTime,
      resolutionTime,
      success,
      timestamp: Date.now(),
    });

    // Record metrics
    this.metrics.push({
      id: `metric-${Date.now()}`,
      type: 'response_time',
      period: 'hourly',
      value: responseTime,
      timestamp: Date.now(),
      metadata: { incidentId, category },
    });
  }

  recordResponderAction(responderId: string, incidentId: string, actionType: string): void {
    if (!this.responderActions.has(responderId)) {
      this.responderActions.set(responderId, []);
    }
    this.responderActions.get(responderId)!.push({
      incidentId,
      actionType,
      timestamp: Date.now(),
    });
  }

  recordResourceUsage(resourceId: string, quantity: number, duration: number): void {
    if (!this.resourceUsage.has(resourceId)) {
      this.resourceUsage.set(resourceId, []);
    }
    this.resourceUsage.get(resourceId)!.push({
      quantity,
      duration,
      timestamp: Date.now(),
    });
  }

  getIncidentAnalytics(startDate?: number, endDate?: number): IncidentAnalytics {
    const now = Date.now();
    const start = startDate || now - 30 * 24 * 60 * 60 * 1000; // 30 days
    const end = endDate || now;

    const filtered = this.incidents.filter(i => i.timestamp >= start && i.timestamp <= end);
    const resolved = filtered.filter(i => i.success);

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    filtered.forEach(i => {
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    });

    const avgResponseTime = filtered.length > 0 ? filtered.reduce((sum, i) => sum + i.responseTime, 0) / filtered.length : 0;
    const avgResolutionTime = filtered.length > 0 ? filtered.reduce((sum, i) => sum + i.resolutionTime, 0) / filtered.length : 0;

    return {
      totalIncidents: filtered.length,
      resolvedIncidents: resolved.length,
      activeIncidents: filtered.length - resolved.length,
      averageResponseTime: Math.round(avgResponseTime),
      averageResolutionTime: Math.round(avgResolutionTime),
      successRate: filtered.length > 0 ? Math.round((resolved.length / filtered.length) * 100) : 0,
      byCategoryBreakdown: byCategory,
      bySeverityBreakdown: bySeverity,
      byStatusBreakdown: { resolved: resolved.length, active: filtered.length - resolved.length },
      trendData: this.metrics.filter(m => m.timestamp >= start && m.timestamp <= end),
    };
  }

  getResponderAnalytics(responderId: string): ResponderAnalytics {
    const actions = this.responderActions.get(responderId) || [];
    const incidentIds = new Set(actions.map(a => a.incidentId));
    const incidentsResponded = Array.from(incidentIds);
    const responderIncidents = this.incidents.filter(i => incidentsResponded.includes(i.incidentId));

    const responseTime = responderIncidents.length > 0 ? Math.round(responderIncidents.reduce((sum, i) => sum + i.responseTime, 0) / responderIncidents.length) : 0;
    const resolutionTime = responderIncidents.length > 0 ? Math.round(responderIncidents.reduce((sum, i) => sum + i.resolutionTime, 0) / responderIncidents.length) : 0;
    const successRate = responderIncidents.length > 0 ? Math.round((responderIncidents.filter(i => i.success).length / responderIncidents.length) * 100) : 0;

    return {
      responderId,
      name: `Responder ${responderId}`,
      role: 'Field Operator',
      totalIncidentsResponded: responderIncidents.length,
      averageResponseTime: responseTime,
      averageResolutionTime: resolutionTime,
      successRate,
      skillsMastered: ['First Aid', 'CPR'],
      skillsDeveloping: ['Advanced Life Support'],
      performanceScore: Math.round((successRate * 0.6 + (100 - responseTime / 10) * 0.4)),
    };
  }

  getResourceAnalytics(resourceId: string): ResourceAnalytics {
    const usage = this.resourceUsage.get(resourceId) || [];
    const totalDuration = usage.reduce((sum, u) => sum + u.duration, 0);
    const utilizationRate = usage.length > 0 ? Math.min(100, Math.round((totalDuration / (30 * 24 * 60)) * 100)) : 0;

    return {
      resourceId,
      name: `Resource ${resourceId}`,
      totalAllocations: usage.length,
      averageUtilizationTime: usage.length > 0 ? Math.round(totalDuration / usage.length) : 0,
      utilizationRate,
      currentStatus: 'available',
      lastMaintenanceDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    };
  }

  getTopPerformers(limit: number): ResponderAnalytics[] {
    const responders = Array.from(this.responderActions.keys()).map(id => this.getResponderAnalytics(id));
    return responders.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, limit);
  }

  getIncidentTrends(period: 'daily' | 'weekly' | 'monthly'): AnalyticsMetric[] {
    const periodMs = period === 'daily' ? 86400000 : period === 'weekly' ? 604800000 : 2592000000;
    const now = Date.now();
    const trends: AnalyticsMetric[] = [];

    for (let i = 10; i >= 0; i--) {
      const timestamp = now - i * periodMs;
      const periodIncidents = this.incidents.filter(inc => inc.timestamp <= timestamp && inc.timestamp > timestamp - periodMs);
      trends.push({
        id: `trend-${i}`,
        type: 'success_rate',
        period: period as any,
        value: periodIncidents.length > 0 ? Math.round((periodIncidents.filter(i => i.success).length / periodIncidents.length) * 100) : 0,
        timestamp,
      });
    }

    return trends;
  }

  comparePerformance(responderId1: string, responderId2: string) {
    return {
      responder1: this.getResponderAnalytics(responderId1),
      responder2: this.getResponderAnalytics(responderId2),
    };
  }

  exportAnalytics(format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(this.getIncidentAnalytics(), null, 2);
    }

    // CSV format
    let csv = 'Incident ID,Category,Severity,Response Time,Resolution Time,Success\n';
    csv += this.incidents.map(i => `${i.incidentId},${i.category},${i.severity},${i.responseTime},${i.resolutionTime},${i.success ? 'Yes' : 'No'}`).join('\n');
    return csv;
  }
}

export const analyticsService = new AnalyticsServiceImpl();
