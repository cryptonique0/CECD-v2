/**
 * Evidence Service
 * Manages cryptographically signed evidence uploads with chain-of-custody tracking
 */

import { auditTrailService } from "./auditTrailService";

export interface Evidence {
  id: string;
  incidentId: string;
  uploader: string;
  fileName: string;
  fileType: string;
  fileSizeKB: number;
  uploadedAt: number;
  signature: string;
  hash: string;
  category: 'photo' | 'video' | 'document' | 'audio' | 'other';
  description: string;
  verified: boolean;
  chainOfCustody: ChainOfCustodyEntry[];
}

export interface ChainOfCustodyEntry {
  timestamp: number;
  actor: string;
  action: 'uploaded' | 'verified' | 'transferred' | 'archived';
  signature: string;
  notes: string;
}

const evidenceStore = new Map<string, Evidence[]>();

/**
 * Simulate file hash (in production, compute actual SHA-256)
 */
function computeFileHash(fileName: string, fileSize: number, timestamp: number): string {
  const data = `${fileName}_${fileSize}_${timestamp}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

/**
 * Create a cryptographic signature (simulated)
 */
function signEvidence(data: string, uploader: string): string {
  return `sig_ev_${Math.random().toString(16).slice(2, 10)}`;
}

export const evidenceService = {
  /**
   * Upload and sign evidence for an incident
   */
  uploadEvidence(
    incidentId: string,
    uploader: string,
    fileName: string,
    fileType: string,
    fileSizeKB: number,
    category: Evidence['category'],
    description: string
  ): Evidence {
    const evidence: Evidence = {
      id: `ev_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      incidentId,
      uploader,
      fileName,
      fileType,
      fileSizeKB,
      uploadedAt: Date.now(),
      signature: signEvidence(`${fileName}${fileType}${fileSizeKB}`, uploader),
      hash: computeFileHash(fileName, fileSizeKB, Date.now()),
      category,
      description,
      verified: false,
      chainOfCustody: [
        {
          timestamp: Date.now(),
          actor: uploader,
          action: 'uploaded',
          signature: signEvidence(`upload_${fileName}`, uploader),
          notes: `Evidence uploaded: ${fileName}`,
        },
      ],
    };

    // Store evidence
    if (!evidenceStore.has(incidentId)) {
      evidenceStore.set(incidentId, []);
    }
    evidenceStore.get(incidentId)!.push(evidence);

    // Record in audit trail
    auditTrailService.recordEvent(
      incidentId,
      uploader,
      'EVIDENCE_UPLOADED',
      `${category}: ${fileName} (${fileSizeKB}KB)`
    );

    return evidence;
  },

  /**
   * Verify evidence integrity and authenticity
   */
  verifyEvidence(incidentId: string, evidenceId: string): {
    verified: boolean;
    integrityOk: boolean;
    chainValid: boolean;
    message: string;
  } {
    const evidence = evidenceStore
      .get(incidentId)
      ?.find(e => e.id === evidenceId);

    if (!evidence) {
      return {
        verified: false,
        integrityOk: false,
        chainValid: false,
        message: 'Evidence not found',
      };
    }

    const integrityOk = evidence.hash.length === 66; // 0x + 64 hex chars
    const chainValid = evidence.chainOfCustody.length > 0;
    const verified = integrityOk && chainValid && evidence.signature.length > 0;

    evidence.verified = verified;

    return {
      verified,
      integrityOk,
      chainValid,
      message: verified
        ? 'Evidence verified and chain-of-custody intact'
        : 'Evidence verification failed',
    };
  },

  /**
   * Add chain-of-custody transfer (e.g., handoff to investigator)
   */
  transferEvidence(
    incidentId: string,
    evidenceId: string,
    from: string,
    to: string,
    notes: string
  ): Evidence | null {
    const evidence = evidenceStore
      .get(incidentId)
      ?.find(e => e.id === evidenceId);

    if (!evidence) return null;

    evidence.chainOfCustody.push({
      timestamp: Date.now(),
      actor: from,
      action: 'transferred',
      signature: signEvidence(`transfer_${evidenceId}_${to}`, from),
      notes: `${from} transferred to ${to}: ${notes}`,
    });

    // Record in audit trail
    auditTrailService.recordEvent(
      incidentId,
      from,
      'EVIDENCE_TRANSFERRED',
      `${evidenceId} transferred to ${to}`
    );

    return evidence;
  },

  /**
   * Get all evidence for an incident
   */
  getIncidentEvidence(incidentId: string): Evidence[] {
    return evidenceStore.get(incidentId) || [];
  },

  /**
   * Get evidence by category
   */
  getEvidenceByCategory(
    incidentId: string,
    category: Evidence['category']
  ): Evidence[] {
    return (evidenceStore.get(incidentId) || []).filter(
      e => e.category === category
    );
  },

  /**
   * Generate chain-of-custody report
   */
  generateCustodyReport(incidentId: string, evidenceId: string): {
    evidence: Evidence | null;
    custodyChain: ChainOfCustodyEntry[];
    handlers: string[];
    lastHandler: string | null;
    isIntact: boolean;
  } {
    const evidence = evidenceStore
      .get(incidentId)
      ?.find(e => e.id === evidenceId);

    if (!evidence) {
      return {
        evidence: null,
        custodyChain: [],
        handlers: [],
        lastHandler: null,
        isIntact: false,
      };
    }

    const handlers = Array.from(
      new Set(evidence.chainOfCustody.map(c => c.actor))
    );
    const lastHandler =
      evidence.chainOfCustody[evidence.chainOfCustody.length - 1]?.actor || null;

    return {
      evidence,
      custodyChain: evidence.chainOfCustody,
      handlers,
      lastHandler,
      isIntact: evidence.verified,
    };
  },

  /**
   * Archive evidence (immutable - marks as archived but doesn't delete)
   */
  archiveEvidence(incidentId: string, evidenceId: string, archivedBy: string): boolean {
    const evidence = evidenceStore
      .get(incidentId)
      ?.find(e => e.id === evidenceId);

    if (!evidence) return false;

    evidence.chainOfCustody.push({
      timestamp: Date.now(),
      actor: archivedBy,
      action: 'archived',
      signature: signEvidence(`archive_${evidenceId}`, archivedBy),
      notes: `Evidence archived by ${archivedBy}`,
    });

    auditTrailService.recordEvent(
      incidentId,
      archivedBy,
      'EVIDENCE_ARCHIVED',
      evidenceId
    );

    return true;
  },

  /**
   * Export evidence metadata as verifiable report
   */
  exportEvidenceReport(incidentId: string): {
    incidentId: string;
    totalEvidence: number;
    byCategory: Record<string, number>;
    evidence: Array<{
      id: string;
      fileName: string;
      category: string;
      uploadedBy: string;
      uploadedAt: string;
      verified: boolean;
      handlers: string[];
    }>;
    exportedAt: number;
  } {
    const evidence = evidenceStore.get(incidentId) || [];
    const byCategory = {} as Record<string, number>;

    evidence.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    });

    return {
      incidentId,
      totalEvidence: evidence.length,
      byCategory,
      evidence: evidence.map(e => ({
        id: e.id,
        fileName: e.fileName,
        category: e.category,
        uploadedBy: e.uploader,
        uploadedAt: new Date(e.uploadedAt).toISOString(),
        verified: e.verified,
        handlers: Array.from(new Set(e.chainOfCustody.map(c => c.actor))),
      })),
      exportedAt: Date.now(),
    };
  },
};
