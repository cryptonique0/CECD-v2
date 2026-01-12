export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: 'incident_count' | 'response_time' | 'severity_spike' | 'resource_shortage' | 'team_availability' | 'anomaly';
  threshold: number;
  timeWindow: number; // minutes
  enabled: boolean;
  actions: AlertAction[];
  createdAt: number;
}

export interface AlertAction {
  type: 'notification' | 'escalation' | 'auto_dispatch' | 'resource_request' | 'team_alert';
  target: string[]; // userIds or roles
  message: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedAt?: number;
  affectedIncidents?: string[];
  recommendations?: string[];
}

export interface AlertStatistics {
  totalAlerts: number;
  critical: number;
  warning: number;
  info: number;
  unacknowledged: number;
  avgResolutionTime: number; // minutes
  mostCommonRules: Array<{ ruleName: string; count: number }>;
}

interface AlertManagementService {
  createRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): AlertRule;
  updateRule(ruleId: string, updates: Partial<AlertRule>): AlertRule | null;
  deleteRule(ruleId: string): boolean;
  getRules(enabled?: boolean): AlertRule[];
  triggerAlert(ruleId: string, title: string, description: string, severity: Alert['severity'], metadata?: Record<string, any>, recommendations?: string[]): Alert;
  getAlerts(limit?: number, offset?: number): Alert[];
  getUnacknowledgedAlerts(): Alert[];
  acknowledgeAlert(alertId: string, userId: string): void;
  resolveAlert(alertId: string): void;
  getAlertStatistics(startDate?: number, endDate?: number): AlertStatistics;
  checkAlertConditions(incidents: any[], teams: any[], resources: any[]): void;
  getAlertsForIncident(incidentId: string): Alert[];
}

class AlertManagementServiceImpl implements AlertManagementService {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private ruleCounter = 0;
  private alertCounter = 0;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // High incident count alert
    this.createRule({
      name: 'High Incident Volume',
      description: 'Alert when incident count exceeds threshold',
      condition: 'incident_count',
      threshold: 5,
      timeWindow: 60,
      enabled: true,
      actions: [
        {
          type: 'notification',
          target: ['Dispatcher', 'Analyst'],
          message: 'High volume of incidents detected. Consider requesting additional resources.',
        },
        {
          type: 'escalation',
          target: ['Owner'],
          message: 'Emergency escalation: High incident volume',
        },
      ],
    });

    // Slow response time alert
    this.createRule({
      name: 'Slow Response Time',
      description: 'Alert when average response time exceeds threshold',
      condition: 'response_time',
      threshold: 20,
      timeWindow: 120,
      enabled: true,
      actions: [
        {
          type: 'notification',
          target: ['Dispatcher'],
          message: 'Response times are slower than baseline. Check team availability.',
        },
      ],
    });

    // Critical incidents alert
    this.createRule({
      name: 'Critical Incident Detected',
      description: 'Alert when critical incidents are reported',
      condition: 'severity_spike',
      threshold: 1,
      timeWindow: 5,
      enabled: true,
      actions: [
        {
          type: 'notification',
          target: ['Dispatcher', 'IncidentCommander'],
          message: 'Critical incident detected. Immediate action required.',
        },
        {
          type: 'auto_dispatch',
          target: ['nearest_team'],
          message: 'Auto-dispatching closest available team.',
        },
      ],
    });

    // Low resource alert
    this.createRule({
      name: 'Critical Resource Shortage',
      description: 'Alert when critical resources fall below minimum',
      condition: 'resource_shortage',
      threshold: 3,
      timeWindow: 0,
      enabled: true,
      actions: [
        {
          type: 'resource_request',
          target: ['Logistics'],
          message: 'Critical resource shortage. Request resupply immediately.',
        },
        {
          type: 'notification',
          target: ['Owner'],
          message: 'Critical resources are low.',
        },
      ],
    });

    // Team availability alert
    this.createRule({
      name: 'Low Team Availability',
      description: 'Alert when available teams fall below minimum',
      condition: 'team_availability',
      threshold: 2,
      timeWindow: 0,
      enabled: true,
      actions: [
        {
          type: 'team_alert',
          target: ['on-call_teams'],
          message: 'Request standby teams to mobilize.',
        },
      ],
    });
  }

  createRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): AlertRule {
    const fullRule: AlertRule = {
      id: `rule-${++this.ruleCounter}`,
      ...rule,
      createdAt: Date.now(),
    };
    this.rules.set(fullRule.id, fullRule);
    return fullRule;
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): AlertRule | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;
    const updated = { ...rule, ...updates };
    this.rules.set(ruleId, updated);
    return updated;
  }

  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRules(enabled?: boolean): AlertRule[] {
    const all = Array.from(this.rules.values());
    if (enabled === undefined) return all;
    return all.filter(r => r.enabled === enabled);
  }

  triggerAlert(ruleId: string, title: string, description: string, severity: Alert['severity'], metadata?: Record<string, any>, recommendations?: string[]): Alert {
    const alert: Alert = {
      id: `alert-${++this.alertCounter}`,
      ruleId,
      timestamp: Date.now(),
      severity,
      title,
      description,
      metadata: metadata || {},
      acknowledged: false,
      recommendations,
    };

    this.alerts.push(alert);

    // Execute alert actions
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.executeAlertActions(rule, alert);
    }

    return alert;
  }

  private executeAlertActions(rule: AlertRule, alert: Alert): void {
    rule.actions.forEach(action => {
      // In a real implementation, these would trigger actual notifications, escalations, etc.
      console.log(`[ALERT ACTION] ${action.type}: ${action.message}`);
      // Actions could include:
      // - Sending notifications to specified users
      // - Creating escalation tickets
      // - Auto-dispatching teams
      // - Requesting resources
      // - Activating on-call teams
    });
  }

  getAlerts(limit: number = 100, offset: number = 0): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
  }

  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(a => !a.acknowledged).sort((a, b) => {
      const severityMap = { critical: 3, warning: 2, info: 1 };
      return severityMap[b.severity] - severityMap[a.severity];
    });
  }

  acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = Date.now();
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = Date.now();
    }
  }

  getAlertStatistics(startDate?: number, endDate?: number): AlertStatistics {
    const now = Date.now();
    const start = startDate || now - 30 * 24 * 60 * 60 * 1000;
    const end = endDate || now;

    const filtered = this.alerts.filter(a => a.timestamp >= start && a.timestamp <= end);
    const resolved = filtered.filter(a => a.resolvedAt);
    const avgResolutionTime = resolved.length > 0
      ? Math.round(resolved.reduce((sum, a) => sum + (a.resolvedAt! - a.timestamp), 0) / resolved.length / 60000)
      : 0;

    const severityCount = { critical: 0, warning: 0, info: 0 };
    const ruleCounts: Record<string, number> = {};

    filtered.forEach(a => {
      severityCount[a.severity]++;
      ruleCounts[a.ruleId] = (ruleCounts[a.ruleId] || 0) + 1;
    });

    const mostCommonRules = Object.entries(ruleCounts)
      .map(([ruleId, count]) => ({
        ruleName: this.rules.get(ruleId)?.name || ruleId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAlerts: filtered.length,
      critical: severityCount.critical,
      warning: severityCount.warning,
      info: severityCount.info,
      unacknowledged: filtered.filter(a => !a.acknowledged).length,
      avgResolutionTime,
      mostCommonRules,
    };
  }

  checkAlertConditions(incidents: any[], teams: any[], resources: any[]): void {
    // This would be called periodically to check if any alert conditions are met
    // For now, this is a placeholder for the logic that would evaluate conditions
  }

  getAlertsForIncident(incidentId: string): Alert[] {
    return this.alerts.filter(a => a.affectedIncidents?.includes(incidentId) || a.metadata.incidentId === incidentId);
  }
}

export const alertManagementService = new AlertManagementServiceImpl();
