/**
 * Jurisdiction-Aware Data Privacy Service
 * Handles GDPR, HIPAA, CCPA, and other regional data protection laws
 */

export type Jurisdiction = 'EU' | 'US' | 'US_CALIFORNIA' | 'UK' | 'CANADA' | 'AUSTRALIA' | 'GLOBAL';

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'medical' | 'pii';

export interface JurisdictionPolicy {
  jurisdiction: Jurisdiction;
  name: string;
  regulations: string[];
  dataRetention: {
    default: number; // days
    medical: number;
    pii: number;
    minRetention: number;
    maxRetention: number;
  };
  consentRequired: boolean;
  rightToErasure: boolean;
  rightToPortability: boolean;
  breachNotificationHours: number;
  encryptionRequired: boolean;
  auditLogRetention: number; // days
  crossBorderTransferRestrictions: boolean;
  allowedCountries?: string[];
}

export interface FieldEncryptionRule {
  fieldPath: string;
  classification: DataClassification;
  encryptionAlgorithm: 'AES-256-GCM' | 'RSA-2048' | 'ChaCha20-Poly1305';
  allowedRoles: string[];
  allowedCertifications?: string[];
  requiresMFA: boolean;
  autoExpiry?: number; // milliseconds
  jurisdictionOverride?: Jurisdiction[];
}

export interface DataRetentionPolicy {
  incidentType: string;
  jurisdiction: Jurisdiction;
  retentionPeriod: number; // days
  autoDelete: boolean;
  archiveAfter?: number; // days
  legalHoldOverride?: boolean;
  anonymizeAfter?: number; // days
}

export interface ConsentRecord {
  userId: string;
  purpose: 'analytics' | 'medical_research' | 'cross_border_transfer' | 'third_party_sharing';
  granted: boolean;
  timestamp: number;
  expiresAt?: number;
  withdrawnAt?: number;
  jurisdiction: Jurisdiction;
}

class JurisdictionService {
  private policies: Map<Jurisdiction, JurisdictionPolicy> = new Map();
  private encryptionRules: FieldEncryptionRule[] = [];
  private retentionPolicies: Map<string, DataRetentionPolicy[]> = new Map();
  private consentRecords: Map<string, ConsentRecord[]> = new Map();

  constructor() {
    this.initializePolicies();
    this.initializeEncryptionRules();
    this.initializeRetentionPolicies();
  }

  /**
   * Initialize jurisdiction-specific policies
   */
  private initializePolicies() {
    // GDPR (EU)
    this.policies.set('EU', {
      jurisdiction: 'EU',
      name: 'General Data Protection Regulation',
      regulations: ['GDPR', 'ePrivacy Directive'],
      dataRetention: {
        default: 365,
        medical: 730, // 2 years
        pii: 365,
        minRetention: 30,
        maxRetention: 2555, // 7 years
      },
      consentRequired: true,
      rightToErasure: true,
      rightToPortability: true,
      breachNotificationHours: 72,
      encryptionRequired: true,
      auditLogRetention: 2555,
      crossBorderTransferRestrictions: true,
      allowedCountries: ['EU', 'UK', 'CANADA', 'AUSTRALIA'], // Countries with adequacy decisions
    });

    // HIPAA (US Medical)
    this.policies.set('US', {
      jurisdiction: 'US',
      name: 'Health Insurance Portability and Accountability Act',
      regulations: ['HIPAA', 'HITECH'],
      dataRetention: {
        default: 2190, // 6 years
        medical: 2555, // 7 years (safe harbor)
        pii: 2190,
        minRetention: 365,
        maxRetention: 3650, // 10 years
      },
      consentRequired: false, // Treatment, Payment, Operations exempt
      rightToErasure: false,
      rightToPortability: true,
      breachNotificationHours: 720, // 30 days
      encryptionRequired: true,
      auditLogRetention: 2555,
      crossBorderTransferRestrictions: false,
    });

    // CCPA (California)
    this.policies.set('US_CALIFORNIA', {
      jurisdiction: 'US_CALIFORNIA',
      name: 'California Consumer Privacy Act',
      regulations: ['CCPA', 'CPRA'],
      dataRetention: {
        default: 730, // 2 years
        medical: 2555,
        pii: 730,
        minRetention: 90,
        maxRetention: 2555,
      },
      consentRequired: false, // Opt-out model
      rightToErasure: true,
      rightToPortability: true,
      breachNotificationHours: 720,
      encryptionRequired: false, // Recommended but not required
      auditLogRetention: 730,
      crossBorderTransferRestrictions: false,
    });

    // UK (Post-Brexit)
    this.policies.set('UK', {
      jurisdiction: 'UK',
      name: 'UK Data Protection Act',
      regulations: ['UK GDPR', 'DPA 2018'],
      dataRetention: {
        default: 365,
        medical: 730,
        pii: 365,
        minRetention: 30,
        maxRetention: 2555,
      },
      consentRequired: true,
      rightToErasure: true,
      rightToPortability: true,
      breachNotificationHours: 72,
      encryptionRequired: true,
      auditLogRetention: 2555,
      crossBorderTransferRestrictions: true,
      allowedCountries: ['EU', 'CANADA', 'AUSTRALIA'],
    });

    // Canada (PIPEDA)
    this.policies.set('CANADA', {
      jurisdiction: 'CANADA',
      name: 'Personal Information Protection and Electronic Documents Act',
      regulations: ['PIPEDA'],
      dataRetention: {
        default: 365,
        medical: 730,
        pii: 365,
        minRetention: 30,
        maxRetention: 2555,
      },
      consentRequired: true,
      rightToErasure: true,
      rightToPortability: true,
      breachNotificationHours: 720,
      encryptionRequired: false,
      auditLogRetention: 730,
      crossBorderTransferRestrictions: false,
    });

    // Global (most restrictive combination)
    this.policies.set('GLOBAL', {
      jurisdiction: 'GLOBAL',
      name: 'Global Privacy Standards',
      regulations: ['GDPR', 'HIPAA', 'CCPA', 'PIPEDA'],
      dataRetention: {
        default: 365,
        medical: 730,
        pii: 365,
        minRetention: 30,
        maxRetention: 2555,
      },
      consentRequired: true,
      rightToErasure: true,
      rightToPortability: true,
      breachNotificationHours: 72,
      encryptionRequired: true,
      auditLogRetention: 2555,
      crossBorderTransferRestrictions: true,
    });
  }

  /**
   * Initialize field-level encryption rules
   */
  private initializeEncryptionRules() {
    // Medical notes - only certified EMTs/Paramedics
    this.encryptionRules.push({
      fieldPath: 'medicalNotes',
      classification: 'medical',
      encryptionAlgorithm: 'AES-256-GCM',
      allowedRoles: ['emt', 'paramedic', 'doctor', 'nurse', 'admin'],
      allowedCertifications: ['EMT-B', 'EMT-A', 'EMT-P', 'RN', 'MD', 'DO'],
      requiresMFA: true,
      autoExpiry: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Patient vitals
    this.encryptionRules.push({
      fieldPath: 'patientVitals',
      classification: 'medical',
      encryptionAlgorithm: 'AES-256-GCM',
      allowedRoles: ['emt', 'paramedic', 'doctor', 'nurse', 'dispatcher', 'admin'],
      allowedCertifications: ['EMT-B', 'EMT-A', 'EMT-P', 'RN', 'MD', 'CPR'],
      requiresMFA: false,
    });

    // Personal Identifiable Information (PII)
    this.encryptionRules.push({
      fieldPath: 'personalInfo',
      classification: 'pii',
      encryptionAlgorithm: 'AES-256-GCM',
      allowedRoles: ['dispatcher', 'commander', 'admin'],
      requiresMFA: true,
      jurisdictionOverride: ['EU', 'UK'], // Extra strict in EU/UK
    });

    // Location data (considered PII in EU)
    this.encryptionRules.push({
      fieldPath: 'location.coordinates',
      classification: 'pii',
      encryptionAlgorithm: 'AES-256-GCM',
      allowedRoles: ['dispatcher', 'responder', 'commander', 'admin'],
      requiresMFA: false,
      jurisdictionOverride: ['EU', 'UK'],
    });

    // Financial information
    this.encryptionRules.push({
      fieldPath: 'financialData',
      classification: 'restricted',
      encryptionAlgorithm: 'AES-256-GCM',
      allowedRoles: ['admin', 'financial_manager'],
      requiresMFA: true,
      autoExpiry: 12 * 60 * 60 * 1000, // 12 hours
    });

    // Sensitive witness statements
    this.encryptionRules.push({
      fieldPath: 'witnessStatements',
      classification: 'confidential',
      encryptionAlgorithm: 'AES-256-GCM',
      allowedRoles: ['commander', 'analyst', 'admin'],
      requiresMFA: false,
    });
  }

  /**
   * Initialize data retention policies
   */
  private initializeRetentionPolicies() {
    const incidentTypes = ['medical', 'fire', 'flood', 'earthquake', 'hazmat', 'security', 'other'];
    
    incidentTypes.forEach(type => {
      const policies: DataRetentionPolicy[] = [];

      // EU GDPR policy
      policies.push({
        incidentType: type,
        jurisdiction: 'EU',
        retentionPeriod: type === 'medical' ? 730 : 365,
        autoDelete: false,
        archiveAfter: type === 'medical' ? 365 : 180,
        anonymizeAfter: type === 'medical' ? 1095 : 730, // 3 years for medical, 2 for others
        legalHoldOverride: true,
      });

      // US HIPAA policy (medical incidents)
      if (type === 'medical') {
        policies.push({
          incidentType: type,
          jurisdiction: 'US',
          retentionPeriod: 2555, // 7 years
          autoDelete: false,
          archiveAfter: 365,
          legalHoldOverride: true,
        });
      }

      // US general policy (non-medical)
      policies.push({
        incidentType: type,
        jurisdiction: 'US',
        retentionPeriod: 2190, // 6 years
        autoDelete: false,
        archiveAfter: 365,
        legalHoldOverride: true,
      });

      this.retentionPolicies.set(type, policies);
    });
  }

  /**
   * Detect jurisdiction from location coordinates
   */
  detectJurisdiction(lat: number, lng: number): Jurisdiction {
    // Simplified jurisdiction detection (in production, use a geocoding service)
    if (lat >= 36 && lat <= 71 && lng >= -25 && lng <= 45) {
      return 'EU';
    } else if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -66) {
      // Check if California
      if (lat >= 32 && lat <= 42 && lng >= -124 && lng <= -114) {
        return 'US_CALIFORNIA';
      }
      return 'US';
    } else if (lat >= 49 && lat <= 71 && lng >= -141 && lng <= -52) {
      return 'CANADA';
    } else if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
      return 'UK';
    }
    return 'GLOBAL';
  }

  /**
   * Get policy for jurisdiction
   */
  getPolicy(jurisdiction: Jurisdiction): JurisdictionPolicy | undefined {
    return this.policies.get(jurisdiction);
  }

  /**
   * Check if field requires encryption
   */
  requiresEncryption(fieldPath: string, jurisdiction: Jurisdiction): FieldEncryptionRule | null {
    const rule = this.encryptionRules.find(rule => {
      if (rule.jurisdictionOverride && !rule.jurisdictionOverride.includes(jurisdiction)) {
        return false;
      }
      return rule.fieldPath === fieldPath;
    });

    return rule || null;
  }

  /**
   * Check if user can access encrypted field
   */
  canAccessField(
    fieldPath: string,
    userRole: string,
    userCertifications: string[],
    hasMFA: boolean
  ): boolean {
    const rule = this.encryptionRules.find(r => r.fieldPath === fieldPath);
    if (!rule) return true; // No encryption rule, allow access

    // Check role
    if (!rule.allowedRoles.includes(userRole)) {
      return false;
    }

    // Check certifications if required
    if (rule.allowedCertifications) {
      const hasCertification = userCertifications.some(cert =>
        rule.allowedCertifications!.includes(cert)
      );
      if (!hasCertification) {
        return false;
      }
    }

    // Check MFA if required
    if (rule.requiresMFA && !hasMFA) {
      return false;
    }

    return true;
  }

  /**
   * Get retention policy for incident
   */
  getRetentionPolicy(incidentType: string, jurisdiction: Jurisdiction): DataRetentionPolicy | null {
    const policies = this.retentionPolicies.get(incidentType);
    if (!policies) return null;

    return policies.find(p => p.jurisdiction === jurisdiction) || null;
  }

  /**
   * Calculate deletion date for incident
   */
  calculateDeletionDate(
    incidentType: string,
    jurisdiction: Jurisdiction,
    createdAt: number
  ): number | null {
    const policy = this.getRetentionPolicy(incidentType, jurisdiction);
    if (!policy || !policy.autoDelete) return null;

    return createdAt + (policy.retentionPeriod * 24 * 60 * 60 * 1000);
  }

  /**
   * Check if data transfer to country is allowed
   */
  canTransferToCountry(fromJurisdiction: Jurisdiction, toCountry: string): boolean {
    const policy = this.policies.get(fromJurisdiction);
    if (!policy) return true;

    if (!policy.crossBorderTransferRestrictions) return true;

    if (policy.allowedCountries) {
      return policy.allowedCountries.includes(toCountry);
    }

    return false;
  }

  /**
   * Record consent
   */
  recordConsent(userId: string, consent: ConsentRecord) {
    if (!this.consentRecords.has(userId)) {
      this.consentRecords.set(userId, []);
    }
    this.consentRecords.get(userId)!.push(consent);
  }

  /**
   * Check if user has valid consent
   */
  hasValidConsent(
    userId: string,
    purpose: ConsentRecord['purpose'],
    jurisdiction: Jurisdiction
  ): boolean {
    const consents = this.consentRecords.get(userId) || [];
    const relevantConsent = consents.find(
      c =>
        c.purpose === purpose &&
        c.jurisdiction === jurisdiction &&
        c.granted &&
        !c.withdrawnAt &&
        (!c.expiresAt || c.expiresAt > Date.now())
    );

    return !!relevantConsent;
  }

  /**
   * Withdraw consent
   */
  withdrawConsent(userId: string, purpose: ConsentRecord['purpose']) {
    const consents = this.consentRecords.get(userId);
    if (!consents) return;

    consents.forEach(c => {
      if (c.purpose === purpose && c.granted && !c.withdrawnAt) {
        c.withdrawnAt = Date.now();
      }
    });
  }

  /**
   * Get all encryption rules
   */
  getEncryptionRules(): FieldEncryptionRule[] {
    return this.encryptionRules;
  }

  /**
   * Check if jurisdiction requires breach notification
   */
  requiresBreachNotification(jurisdiction: Jurisdiction, affectedRecords: number): boolean {
    const policy = this.policies.get(jurisdiction);
    if (!policy) return false;

    // Most jurisdictions require notification for any breach affecting personal data
    return affectedRecords > 0;
  }

  /**
   * Get breach notification deadline
   */
  getBreachNotificationDeadline(jurisdiction: Jurisdiction, breachDetectedAt: number): number {
    const policy = this.policies.get(jurisdiction);
    if (!policy) return breachDetectedAt + (72 * 60 * 60 * 1000); // Default 72 hours

    return breachDetectedAt + (policy.breachNotificationHours * 60 * 60 * 1000);
  }

  /**
   * Anonymize incident data (for retention compliance)
   */
  anonymizeIncidentData(incident: any): any {
    return {
      ...incident,
      reportedBy: 'ANONYMIZED',
      assignedTo: [],
      location: {
        ...incident.location,
        address: 'ANONYMIZED',
        coordinates: null,
      },
      personalInfo: null,
      medicalNotes: null,
      witnessStatements: null,
      // Keep statistical data
      category: incident.category,
      severity: incident.severity,
      status: incident.status,
      timestamp: incident.timestamp,
    };
  }

  /**
   * Export user data (right to portability)
   */
  exportUserData(userId: string, incidents: any[]): any {
    const userIncidents = incidents.filter(
      i => i.reportedBy === userId || i.assignedTo?.includes(userId)
    );

    const consents = this.consentRecords.get(userId) || [];

    return {
      userId,
      exportedAt: Date.now(),
      incidents: userIncidents,
      consents,
      metadata: {
        totalIncidents: userIncidents.length,
        jurisdictions: [...new Set(userIncidents.map(i => i.jurisdiction))],
      },
    };
  }
}

// Export singleton
export const jurisdictionService = new JurisdictionService();
export type { JurisdictionPolicy, FieldEncryptionRule, DataRetentionPolicy, ConsentRecord };
