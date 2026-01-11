import { Incident, IncidentStatus, Severity } from '../types';
import { auditTrailService } from './auditTrailService';

export interface EscalationRule {
  id: string;
  name: string;
  trigger: 'severity' | 'duration' | 'resource_gap' | 'custom';
  condition: string; // e.g., "severity >= High", "duration > 3600000"
  action: 'notify_command' | 'dispatch_additional' | 'escalate_level' | 'activate_protocol';
  enabled: boolean;
}

export interface EscalationEvent {
  id: string;
  incidentId: string;
  ruleId: string;
  timestamp: number;
  reason: string;
  previousLevel?: Severity;
  newLevel?: Severity;
  actionsTriggered: string[];
}

const defaultRules: EscalationRule[] = [
  {
    id: 'rule-1',
    name: 'High Severity Immediate Escalation',
    trigger: 'severity',
    condition: 'severity === High',
    action: 'notify_command',
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'Critical Severity Multi-Sig Activation',
    trigger: 'severity',
    condition: 'severity === Critical',
    action: 'escalate_level',
    enabled: true,
  },
  {
    id: 'rule-3',
    name: 'Extended Duration (1+ hour)',
    trigger: 'duration',
    condition: 'duration > 3600000',
    action: 'dispatch_additional',
    enabled: true,
  },
  {
    id: 'rule-4',
    name: 'Extended Duration (3+ hours)',
    trigger: 'duration',
    condition: 'duration > 10800000',
    action: 'activate_protocol',
    enabled: true,
  },
  {
    id: 'rule-5',
    name: 'Resource Gap Escalation',
    trigger: 'resource_gap',
    condition: 'gaps.length >= 3',
    action: 'dispatch_additional',
    enabled: true,
  },
];

export const escalationService = {
  rules: [...defaultRules],

  addRule(rule: EscalationRule): void {
    this.rules.push(rule);
  },

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  },

  enableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) rule.enabled = true;
  },

  disableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) rule.enabled = false;
  },

  evaluateIncident(incident: Incident, resourceGaps?: string[]): EscalationEvent[] {
    const events: EscalationEvent[] = [];
    const now = Date.now();
    const duration = now - incident.timestamp;

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      let shouldEscalate = false;
      let reason = '';

      if (rule.trigger === 'severity') {
        if (rule.condition.includes('===')) {
          const targetSeverity = rule.condition.split('===')[1].trim();
          shouldEscalate = incident.severity === targetSeverity;
          if (shouldEscalate) reason = `Severity level is ${incident.severity}`;
        } else if (rule.condition.includes('>=')) {
          const severityLevels = { Low: 1, Medium: 2, High: 3, Critical: 4 };
          const targetSeverity = rule.condition.split('>=')[1].trim();
          const targetLevel = severityLevels[targetSeverity as Severity] || 0;
          const currentLevel = severityLevels[incident.severity] || 0;
          shouldEscalate = currentLevel >= targetLevel;
          if (shouldEscalate) reason = `Severity ${incident.severity} meets or exceeds ${targetSeverity}`;
        }
      }

      if (rule.trigger === 'duration' && rule.condition.includes('>')) {
        const thresholdStr = rule.condition.split('>')[1].trim();
        const threshold = parseInt(thresholdStr, 10);
        shouldEscalate = duration > threshold;
        if (shouldEscalate) reason = `Incident duration ${(duration / 1000 / 60).toFixed(0)}min exceeds threshold`;
      }

      if (rule.trigger === 'resource_gap' && resourceGaps) {
        if (rule.condition.includes('>=')) {
          const countStr = rule.condition.split('>=')[1].trim();
          const count = parseInt(countStr, 10);
          shouldEscalate = resourceGaps.length >= count;
          if (shouldEscalate) reason = `${resourceGaps.length} resource gaps detected: ${resourceGaps.join(', ')}`;
        }
      }

      if (shouldEscalate) {
        const escalationEvent: EscalationEvent = {
          id: `esc-${Date.now()}-${Math.random()}`,
          incidentId: incident.id,
          ruleId: rule.id,
          timestamp: now,
          reason,
          previousLevel: incident.severity,
          actionsTriggered: [rule.action],
        };
        events.push(escalationEvent);
      }
    }

    return events;
  },

  processEscalation(
    incident: Incident,
    escalationEvent: EscalationEvent,
    currentUser: string
  ): { escalated: boolean; newIncident: Incident; message: string } {
    let newIncident = { ...incident };
    let message = '';
    let escalated = false;

    const actionMap: Record<string, (inc: Incident) => Incident> = {
      notify_command: (inc) => {
        // Notify command center (audit trail record)
        auditTrailService.recordEvent(
          inc.id,
          currentUser,
          'ESCALATION_TRIGGERED',
          `Rule: ${escalationEvent.reason}`
        );
        return inc;
      },
      dispatch_additional: (inc) => {
        // Flag for additional dispatch
        message = '⚠️ Additional responders recommended';
        return { ...inc, escalationLevel: (inc.escalationLevel || 0) + 1 };
      },
      escalate_level: (inc) => {
        // Escalate severity
        const severityProgression: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
        const currentIdx = severityProgression.indexOf(inc.severity);
        if (currentIdx < severityProgression.length - 1) {
          newIncident.severity = severityProgression[currentIdx + 1];
          message = `🚨 Escalated to ${newIncident.severity}`;
          escalated = true;
        }
        return newIncident;
      },
      activate_protocol: (inc) => {
        // Activate crisis protocol
        message = '🚨 CRISIS PROTOCOL ACTIVATED – Full coordination required';
        escalated = true;
        auditTrailService.recordEvent(inc.id, currentUser, 'PROTOCOL_ACTIVATED', 'Crisis protocol triggered by escalation');
        return { ...inc, escalationLevel: 3 };
      },
    };

    for (const action of escalationEvent.actionsTriggered) {
      const handler = actionMap[action];
      if (handler) {
        newIncident = handler(newIncident);
      }
    }

    if (!message) {
      message = `Escalation rule triggered: ${escalationEvent.reason}`;
    }

    return { escalated, newIncident, message };
  },

  getIncidentEscalationHistory(incidentId: string): EscalationEvent[] {
    // In a real system, query persistent storage
    return [];
  },
};
