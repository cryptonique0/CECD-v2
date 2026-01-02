
import { aiService, PredictionResult } from './aiService';
import { notificationService } from './notificationService';
import { offlineService } from './offlineService';
import { baseVaultService } from './baseVaultService';
import { multiSigService } from './multiSigService';
import { Incident, Severity, IncidentStatus } from '../types';

/**
 * CECD Global Integrated Workflow Service
 */
export const workflowService = {
  
  async processIncidentReport(incident: Partial<Incident>) {
    console.log("[WORKFLOW] Processing new global incident disclosure...");

    let triage: PredictionResult | null = null;
    try {
      triage = await aiService.predictIncident(incident.description || "");
      console.log("[WORKFLOW] AI Triage Complete (Global Scale):", triage.severity);
    } catch (e) {
      console.warn("[WORKFLOW] AI Triage Failed, falling back to manual settings.");
    }

    const isOnline = offlineService.isOnline;
    if (!isOnline) {
      await offlineService.queueAction('CREATE_INCIDENT', incident);
      notificationService.sendNotification({
        type: 'system',
        title: 'Offline Sync Queued',
        message: 'Incident stored for Base Mainnet broadcast upon reconnection.',
        severity: 'info'
      });
      return { status: 'QUEUED_OFFLINE' };
    }

    const severity = triage?.severity.toLowerCase() || 'medium';
    notificationService.sendNotification({
      type: 'incident',
      title: `Tactical Alert: ${incident.title}`,
      message: triage?.reasoning || incident.description || "Active emergency requiring global response.",
      severity: severity === 'critical' ? 'critical' : severity === 'high' ? 'warning' : 'info'
    });

    return { status: 'PROCESSED_LIVE', triage };
  },

  async handleEmergencyGrant(incidentId: string, amount: string, currency: 'ETH' | 'USDC', reason: string) {
    console.log("[WORKFLOW] Initiating global emergency grant proposal...");

    const proposal = await multiSigService.proposeTransaction({
      description: `Tactical Aid: ${reason}`,
      amount,
      currency,
      incidentId
    });

    notificationService.sendNotification({
      type: 'donation',
      title: 'Global Grant Proposed',
      message: `A tactical relief fund of ${amount} ${currency} has been initialized for multi-sig audit on Base.`,
      severity: 'info'
    });

    return proposal;
  },

  async runIntegrationTest() {
    const mockDescription = "Major infrastructure failure in downtown London.";
    const result = await this.processIncidentReport({ 
      title: "Global Integration Test", 
      description: mockDescription 
    });
    
    const success = result.status === 'PROCESSED_LIVE' && !!result.triage;
    console.log("[TEST] Global Workflow Pattern Result:", success ? "PASSED" : "FAILED");
    return success;
  }
};
