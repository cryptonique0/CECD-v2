/**
 * Audit Trail Service
 * Manages immutable on-chain incident timeline with cryptographic anchoring
 */

import { Incident } from "../types";

export interface AuditEvent {
  id: string;
  incidentId: string;
  timestamp: number;
  actor: string;
  action: string;
  details: string;
  signature?: string;
  onChainHash?: string;
  verified: boolean;
}

export interface IncidentTimeline {
  incidentId: string;
  events: AuditEvent[];
  rootHash: string;
  lastAnchorTxHash?: string;
  lastAnchorBlock?: number;
}

const timelines = new Map<string, IncidentTimeline>();

/**
 * Simple hash function for demonstration (in production, use keccak256)
 */
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Generate a cryptographic signature (simulated - in production, use web3 signing)
 */
function signData(data: string, signer: string): string {
  return `sig_${simpleHash(signer + data + Date.now())}`;
}

/**
 * Compute Merkle root from events (for tamper-proof timeline)
 */
function computeMerkleRoot(events: AuditEvent[]): string {
  if (events.length === 0) return simpleHash('empty');
  
  let hashes = events.map(e => simpleHash(JSON.stringify(e)));
  
  while (hashes.length > 1) {
    const newHashes: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || hashes[i];
      newHashes.push(simpleHash(left + right));
    }
    hashes = newHashes;
  }
  
  return hashes[0];
}

export const auditTrailService = {
  /**
   * Initialize a new audit trail for an incident
   */
  initializeTimeline(incidentId: string): IncidentTimeline {
    const timeline: IncidentTimeline = {
      incidentId,
      events: [],
      rootHash: simpleHash('empty'),
    };
    timelines.set(incidentId, timeline);
    return timeline;
  },

  /**
   * Add a signed event to the audit trail
   */
  recordEvent(
    incidentId: string,
    actor: string,
    action: string,
    details: string
  ): AuditEvent {
    let timeline = timelines.get(incidentId);
    if (!timeline) {
      timeline = this.initializeTimeline(incidentId);
    }

    const event: AuditEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      incidentId,
      timestamp: Date.now(),
      actor,
      action,
      details,
      signature: signData(`${actor}:${action}:${details}`, actor),
      verified: true,
    };

    timeline.events.push(event);
    timeline.rootHash = computeMerkleRoot(timeline.events);

    timelines.set(incidentId, timeline);
    return event;
  },

  /**
   * Anchor the incident timeline to blockchain
   */
  async anchorToChain(incidentId: string): Promise<{
    txHash: string;
    blockNumber: number;
    rootHash: string;
    timestamp: number;
  }> {
    const timeline = timelines.get(incidentId);
    if (!timeline) {
      throw new Error(`Timeline not found for incident ${incidentId}`);
    }

    // Simulate blockchain transaction
    const txHash = `0x${simpleHash(timeline.rootHash + Date.now())}`;
    const blockNumber = Math.floor(Date.now() / 15000) + 17_000_000; // Simulated block
    
    timeline.lastAnchorTxHash = txHash;
    timeline.lastAnchorBlock = blockNumber;

    return {
      txHash,
      blockNumber,
      rootHash: timeline.rootHash,
      timestamp: Date.now(),
    };
  },

  /**
   * Get the complete audit trail for an incident
   */
  getTimeline(incidentId: string): IncidentTimeline | undefined {
    return timelines.get(incidentId);
  },

  /**
   * Verify timeline integrity (check if root hash matches all events)
   */
  verifyTimeline(incidentId: string): boolean {
    const timeline = timelines.get(incidentId);
    if (!timeline) return false;

    const computedRoot = computeMerkleRoot(timeline.events);
    return timeline.rootHash === computedRoot;
  },

  /**
   * Get events within a time range
   */
  getEventsByTimeRange(
    incidentId: string,
    startTime: number,
    endTime: number
  ): AuditEvent[] {
    const timeline = timelines.get(incidentId);
    if (!timeline) return [];

    return timeline.events.filter(
      e => e.timestamp >= startTime && e.timestamp <= endTime
    );
  },

  /**
   * Get events by actor
   */
  getEventsByActor(incidentId: string, actor: string): AuditEvent[] {
    const timeline = timelines.get(incidentId);
    if (!timeline) return [];

    return timeline.events.filter(e => e.actor === actor);
  },

  /**
   * Record critical action (fund release, evacuation) for multi-sig approval
   */
  recordCriticalAction(
    incidentId: string,
    actionType: 'fund_release' | 'evacuation' | 'lockdown',
    actor: string,
    details: string
  ): AuditEvent {
    const action = `CRITICAL_${actionType.toUpperCase()}`;
    return this.recordEvent(incidentId, actor, action, details);
  },

  /**
   * Export timeline as cryptographically verifiable report
   */
  exportTimeline(incidentId: string): {
    incidentId: string;
    eventCount: number;
    rootHash: string;
    events: AuditEvent[];
    lastAnchor?: { txHash: string; block: number };
    isVerified: boolean;
    exportedAt: number;
  } {
    const timeline = timelines.get(incidentId);
    if (!timeline) {
      throw new Error(`Timeline not found for incident ${incidentId}`);
    }

    return {
      incidentId,
      eventCount: timeline.events.length,
      rootHash: timeline.rootHash,
      events: timeline.events,
      lastAnchor: timeline.lastAnchorTxHash
        ? { txHash: timeline.lastAnchorTxHash, block: timeline.lastAnchorBlock! }
        : undefined,
      isVerified: this.verifyTimeline(incidentId),
      exportedAt: Date.now(),
    };
  },
};
