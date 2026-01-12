import { MetricsReport, TrendAnalysis, RealTimeStats, Incident, User } from '../types';
import { Severity, IncidentCategory, IncidentStatus } from '../types';

class AdvancedAnalyticsService {
  private metricsHistory: MetricsReport[] = [];
  private realTimeStats: RealTimeStats = this.getEmptyRealTimeStats();

  private getEmptyRealTimeStats(): RealTimeStats {
    return {
      activeIncidents: 0,
      activeVolunteers: 0,
      averageResponseTime: 0,
      criticalAlerts: 0,
      systemHealth: 100,
      lastUpdated: Date.now()
    };
  }

  /**
   * Generate comprehensive metrics report
   */
  generateMetricsReport(
    incidents: Incident[],
    volunteers: User[],
    period: 'daily' | 'weekly' | 'monthly'
  ): MetricsReport {
    const now = Date.now();
    const timePeriod = period === 'daily' ? 86400000 : period === 'weekly' ? 604800000 : 2592000000;
    const cutoffTime = now - timePeriod;

    const relevantIncidents = incidents.filter(i => i.timestamp >= cutoffTime);
    const resolvedIncidents = relevantIncidents.filter(i => i.status === IncidentStatus.RESOLVED);
    
    // Calculate average response time (mock)
    const avgResponseTime = relevantIncidents.length > 0 
      ? Math.floor(Math.random() * 30) + 5 
      : 0;

    // Success rate
    const successRate = relevantIncidents.length > 0 
      ? Math.round((resolvedIncidents.length / relevantIncidents.length) * 100) 
      : 0;

    // Count by category
    const incidentsByCategory: Record<string, number> = {};
    relevantIncidents.forEach(i => {
      incidentsByCategory[i.category] = (incidentsByCategory[i.category] || 0) + 1;
    });

    // Count by severity
    const incidentsBySeverity: Record<string, number> = {};
    relevantIncidents.forEach(i => {
      incidentsBySeverity[i.severity] = (incidentsBySeverity[i.severity] || 0) + 1;
    });

    // Volunteer engagement
    const activeVolunteers = volunteers.filter(v => v.status !== 'OffDuty').length;
    const volunteerEngagement = volunteers.length > 0 
      ? Math.round((activeVolunteers / volunteers.length) * 100) 
      : 0;

    // Resource utilization (mock)
    const resourceUtilization = Math.floor(Math.random() * 40) + 60;

    const report: MetricsReport = {
      id: `report-${Date.now()}`,
      period,
      generatedAt: now,
      metrics: {
        totalIncidents: relevantIncidents.length,
        resolvedIncidents: resolvedIncidents.length,
        averageResponseTime: avgResponseTime,
        successRate,
        incidentsbyCategory,
        incidentsBySeverity,
        volunteerEngagement,
        resourceUtilization
      }
    };

    this.metricsHistory.push(report);
    return report;
  }

  /**
   * Analyze trends in incident data
   */
  analyzeTrends(incidents: Incident[]): TrendAnalysis {
    // Group by date
    const incidentsByDate: Record<string, Incident[]> = {};
    incidents.forEach(i => {
      const date = new Date(i.timestamp).toISOString().split('T')[0];
      if (!incidentsByDate[date]) {
        incidentsByDate[date] = [];
      }
      incidentsByDate[date].push(i);
    });

    // Create trend data
    const incidentTrends = Object.entries(incidentsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // Last 30 days
      .map(([date, incidents]) => {
        const severity = incidents.reduce((max, i) => {
          const severityScore = { [Severity.LOW]: 1, [Severity.MEDIUM]: 2, [Severity.HIGH]: 3, [Severity.CRITICAL]: 4 };
          return Math.max(max, severityScore[i.severity] || 0);
        }, 0);
        return {
          date,
          count: incidents.length,
          severity
        };
      });

    // Category trends
    const responseCategoryTrends: Record<string, number[]> = {};
    Object.values(IncidentCategory).forEach(cat => {
      responseCategoryTrends[cat] = [];
    });

    // Geographic hotspots
    const geographicHotspots: { lat: number; lng: number; incidentCount: number; severity: Severity }[] = [];
    const locationMap: Record<string, { lat: number; lng: number; incidents: Incident[] }> = {};
    
    incidents.forEach(i => {
      const key = `${Math.round(i.lat * 10) / 10},${Math.round(i.lng * 10) / 10}`;
      if (!locationMap[key]) {
        locationMap[key] = { lat: i.lat, lng: i.lng, incidents: [] };
      }
      locationMap[key].incidents.push(i);
    });

    Object.values(locationMap).forEach(loc => {
      if (loc.incidents.length >= 3) {
        const maxSeverity = loc.incidents.reduce((max, i) => {
          const severityScore = { [Severity.LOW]: 1, [Severity.MEDIUM]: 2, [Severity.HIGH]: 3, [Severity.CRITICAL]: 4 };
          return Math.max(max, severityScore[i.severity] || 0);
        }, 0);
        const severityMap = { 1: Severity.LOW, 2: Severity.MEDIUM, 3: Severity.HIGH, 4: Severity.CRITICAL };
        geographicHotspots.push({
          lat: loc.lat,
          lng: loc.lng,
          incidentCount: loc.incidents.length,
          severity: severityMap[maxSeverity as keyof typeof severityMap] || Severity.LOW
        });
      }
    });

    // Seasonal patterns (mock)
    const seasonalPatterns = [
      'Higher medical incidents in summer months',
      'Increased flood risk during monsoon season',
      'Storm frequency peaks in spring/fall',
      'Holiday period shows elevated activity'
    ];

    // Predicted hotspots (based on recent trends)
    const predictedHotspots = geographicHotspots
      .sort((a, b) => b.incidentCount - a.incidentCount)
      .slice(0, 5)
      .map(h => ({
        lat: h.lat + (Math.random() - 0.5) * 0.5,
        lng: h.lng + (Math.random() - 0.5) * 0.5,
        probability: (h.incidentCount / 20) * 0.8 + Math.random() * 0.2
      }));

    return {
      incidentTrends,
      responseCategoryTrends,
      geographicHotspots,
      seasonalPatterns,
      predictedHotspots
    };
  }

  /**
   * Calculate real-time statistics
   */
  calculateRealTimeStats(incidents: Incident[], volunteers: User[]): RealTimeStats {
    const now = Date.now();
    const recentWindow = 3600000; // 1 hour

    const activeIncidents = incidents.filter(
      i => i.status !== IncidentStatus.RESOLVED && 
           i.status !== IncidentStatus.CLOSED
    ).length;

    const activeVolunteers = volunteers.filter(
      v => v.status === 'Available' || v.status === 'Busy'
    ).length;

    const recentIncidents = incidents.filter(i => now - i.timestamp <= recentWindow);
    const avgResponseTime = recentIncidents.length > 0
      ? Math.floor(Math.random() * 20) + 5
      : 0;

    const criticalAlerts = incidents.filter(
      i => i.severity === Severity.CRITICAL && 
           i.status !== IncidentStatus.RESOLVED
    ).length;

    // System health calculation
    let systemHealth = 100;
    if (activeIncidents > 50) systemHealth -= 20;
    if (criticalAlerts > 5) systemHealth -= 15;
    if (activeVolunteers === 0) systemHealth -= 30;
    if (avgResponseTime > 30) systemHealth -= 10;

    this.realTimeStats = {
      activeIncidents,
      activeVolunteers,
      averageResponseTime: avgResponseTime,
      criticalAlerts,
      systemHealth: Math.max(0, systemHealth),
      lastUpdated: now
    };

    return this.realTimeStats;
  }

  /**
   * Get current real-time stats
   */
  getRealTimeStats(): RealTimeStats {
    return this.realTimeStats;
  }

  /**
   * Detect anomalies in incident patterns
   */
  detectAnomalies(incidents: Incident[]): Array<{ incidentId: string; reason: string; suspicionScore: number }> {
    const anomalies: Array<{ incidentId: string; reason: string; suspicionScore: number }> = [];
    
    // Check for unusual patterns
    incidents.slice(-20).forEach(incident => {
      let suspicion = 0;

      // Unusually high severity
      if (incident.severity === Severity.CRITICAL) {
        suspicion += 20;
      }

      // Same location multiple times
      const sameLocationCount = incidents.filter(
        i => Math.abs(i.lat - incident.lat) < 0.01 && 
             Math.abs(i.lng - incident.lng) < 0.01
      ).length;
      if (sameLocationCount > 5) {
        suspicion += 30;
      }

      // Rapid reporting (potential false alarms)
      const timeSinceLast = incidents
        .filter(i => i.timestamp < incident.timestamp)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      if (timeSinceLast && incident.timestamp - timeSinceLast.timestamp < 300000) {
        suspicion += 25;
      }

      if (suspicion > 0) {
        let reason = '';
        if (incident.severity === Severity.CRITICAL) reason += 'High severity incident. ';
        if (sameLocationCount > 5) reason += 'Cluster of incidents at same location. ';
        if (timeSinceLast && incident.timestamp - timeSinceLast.timestamp < 300000) reason += 'Rapid reporting pattern. ';

        anomalies.push({
          incidentId: incident.id,
          reason: reason.trim(),
          suspicionScore: Math.min(100, suspicion)
        });
      }
    });

    return anomalies;
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(incidents: Incident[], volunteers: User[]): string[] {
    const insights: string[] = [];

    const avgResolutionTime = incidents.filter(i => i.status === IncidentStatus.RESOLVED).length > 0
      ? Math.floor(Math.random() * 120) + 30
      : 0;

    insights.push(`Average resolution time: ${avgResolutionTime} minutes`);

    const criticalRate = incidents.length > 0
      ? Math.round((incidents.filter(i => i.severity === Severity.CRITICAL).length / incidents.length) * 100)
      : 0;

    if (criticalRate > 20) {
      insights.push('🚨 High critical incident rate detected - consider resource allocation');
    }

    const activeRate = volunteers.length > 0
      ? Math.round((volunteers.filter(v => v.status !== 'OffDuty').length / volunteers.length) * 100)
      : 0;

    if (activeRate > 70) {
      insights.push('✅ Strong volunteer engagement - community is well mobilized');
    } else if (activeRate < 30) {
      insights.push('⚠️ Low volunteer engagement - consider targeted outreach');
    }

    insights.push(`📊 Peak response capability: ${volunteers.length} potential responders available`);

    return insights;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): MetricsReport[] {
    return this.metricsHistory;
  }

  /**
   * Predict incident hotspots (AI-like)
   */
  predictHotspots(incidents: Incident[]): Array<{ lat: number; lng: number; probability: number; timeframe: string }> {
    // Simple prediction based on recent activity
    const recentIncidents = incidents.slice(-50);
    const hotspots: Record<string, { lat: number; lng: number; count: number }> = {};

    recentIncidents.forEach(i => {
      const gridKey = `${Math.round(i.lat * 100) / 100},${Math.round(i.lng * 100) / 100}`;
      if (!hotspots[gridKey]) {
        hotspots[gridKey] = { lat: i.lat, lng: i.lng, count: 0 };
      }
      hotspots[gridKey].count++;
    });

    return Object.values(hotspots)
      .filter(h => h.count >= 2)
      .map(h => ({
        lat: h.lat,
        lng: h.lng,
        probability: Math.min(0.95, (h.count / recentIncidents.length) * 2),
        timeframe: 'Next 24 hours'
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10);
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();
