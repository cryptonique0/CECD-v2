/**
 * Fraud Detection Service
 * Analyzes donations and receipts for suspicious patterns
 * Implements anomaly detection and risk scoring
 */

import { StepDonation } from './stepDonationsService';

export interface FraudAlert {
  id: string;
  incidentId: string;
  donationId?: string;
  receiptId?: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  type: 'duplicate_donation' | 'unusually_large' | 'rapid_sequence' | 'missing_receipt' | 'receipt_discrepancy' | 'mismatched_vendor' | 'suspicious_location';
  description: string;
  evidence: string[];
  flaggedAt: number;
  resolved: boolean;
  resolvedAt?: number;
  notes?: string;
}

export interface DonationRiskProfile {
  donationId: string;
  donorName: string;
  riskScore: number;
  flags: string[];
  isBlacklisted: boolean;
  donationHistory: Array<{
    incidentId: string;
    amount: number;
    timestamp: number;
  }>;
}

export interface ReceiptValidation {
  receiptId: string;
  isValid: boolean;
  riskScore: number;
  issues: string[];
  vendorVerified: boolean;
  amountVerified: boolean;
}

class FraudDetectionService {
  private alerts: Map<string, FraudAlert[]> = new Map();
  private riskProfiles: Map<string, DonationRiskProfile> = new Map();
  private blacklist: Set<string> = new Set();
  private knownVendors: Map<string, { name: string; verified: boolean; locations: string[] }> = new Map();
  private donationHistory: Map<string, StepDonation[]> = new Map();

  // Thresholds
  private readonly LARGE_DONATION_THRESHOLD = 5000; // USD
  private readonly RAPID_SEQUENCE_MINUTES = 5;
  private readonly MISSING_RECEIPT_DAYS = 3;
  private readonly DUPLICATE_CHECK_DAYS = 30;

  constructor() {
    this.initializeKnownVendors();
  }

  /**
   * Initialize database of known vendors
   */
  private initializeKnownVendors() {
    const vendors = [
      { name: 'Red Cross', verified: true, locations: ['US', 'International'] },
      { name: 'First Aid Supplies Inc', verified: true, locations: ['US', 'CA'] },
      { name: 'Emergency Response Equipment', verified: true, locations: ['US', 'EU'] },
      { name: 'Medical Supplies Online', verified: true, locations: ['US', 'UK', 'CA'] },
      { name: 'Local Hardware Store', verified: false, locations: [] }, // Unverified
    ];

    vendors.forEach(v => {
      this.knownVendors.set(v.name.toLowerCase(), v);
    });
  }

  /**
   * Analyze donation for fraud risk
   */
  analyzeDonation(
    incidentId: string,
    donation: StepDonation,
    allDonations: StepDonation[] = []
  ): { riskScore: number; alerts: FraudAlert[] } {
    const alerts: FraudAlert[] = [];
    let riskScore = 0;

    // Check 1: Unusually large donation
    if (donation.amount > this.LARGE_DONATION_THRESHOLD) {
      riskScore += 20;
      alerts.push({
        id: `alert-${Date.now()}-1`,
        incidentId,
        donationId: donation.id,
        riskScore: 20,
        riskLevel: 'medium',
        type: 'unusually_large',
        description: `Large donation of $${donation.amount} (threshold: $${this.LARGE_DONATION_THRESHOLD})`,
        evidence: [`Donation amount: $${donation.amount}`, `Threshold: $${this.LARGE_DONATION_THRESHOLD}`],
        flaggedAt: Date.now(),
        resolved: false
      });
    }

    // Check 2: Duplicate donations from same donor
    const recentDonations = allDonations.filter(d =>
      d.donorName === donation.donorName &&
      d.id !== donation.id &&
      (donation.pledgeTimestamp - d.pledgeTimestamp) < this.DUPLICATE_CHECK_DAYS * 24 * 60 * 60 * 1000
    );

    if (recentDonations.length > 0) {
      riskScore += 15;
      alerts.push({
        id: `alert-${Date.now()}-2`,
        incidentId,
        donationId: donation.id,
        riskScore: 15,
        riskLevel: 'medium',
        type: 'duplicate_donation',
        description: `${recentDonations.length} similar donation(s) from same donor in past 30 days`,
        evidence: recentDonations.map(d => `Donation ${d.id}: $${d.amount} at ${new Date(d.pledgeTimestamp).toISOString()}`),
        flaggedAt: Date.now(),
        resolved: false
      });
    }

    // Check 3: Rapid donation sequence (potential bot/automation)
    const rapidDonations = allDonations.filter(d =>
      d.id !== donation.id &&
      d.incidentId === incidentId &&
      Math.abs(d.pledgeTimestamp - donation.pledgeTimestamp) < this.RAPID_SEQUENCE_MINUTES * 60 * 1000
    );

    if (rapidDonations.length >= 3) {
      riskScore += 25;
      alerts.push({
        id: `alert-${Date.now()}-3`,
        incidentId,
        donationId: donation.id,
        riskScore: 25,
        riskLevel: 'high',
        type: 'rapid_sequence',
        description: `${rapidDonations.length + 1} donations within ${this.RAPID_SEQUENCE_MINUTES} minutes (possible bot activity)`,
        evidence: [
          `Total rapid donations: ${rapidDonations.length + 1}`,
          `Time window: ${this.RAPID_SEQUENCE_MINUTES} minutes`,
          'Pattern suggests automated donation activity'
        ],
        flaggedAt: Date.now(),
        resolved: false
      });
    }

    // Check 4: Donor blacklist
    if (this.blacklist.has(donation.donorName)) {
      riskScore += 50;
      alerts.push({
        id: `alert-${Date.now()}-4`,
        incidentId,
        donationId: donation.id,
        riskScore: 50,
        riskLevel: 'critical',
        type: 'duplicate_donation',
        description: `Donor "${donation.donorName}" is on fraud blacklist`,
        evidence: [`Donor: ${donation.donorName}`, 'Status: Blacklisted'],
        flaggedAt: Date.now(),
        resolved: false
      });
    }

    // Check 5: Item category mismatch (e.g., donating "furniture" for medical incident)
    const medicalIncidentCategories = ['medical', 'health', 'emergency'];
    const validMedicalItems = ['PPE', 'Medical Supplies', 'Medication', 'Equipment', 'Oxygen', 'Ambulance'];
    
    // (Would be more sophisticated with actual incident type)
    
    // Store donation history
    if (!this.donationHistory.has(donation.donorName)) {
      this.donationHistory.set(donation.donorName, []);
    }
    this.donationHistory.get(donation.donorName)!.push(donation);

    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);

    // Determine overall risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';

    if (riskScore > 0 && alerts.length > 0) {
      alerts[alerts.length - 1].riskScore = riskScore;
      alerts[alerts.length - 1].riskLevel = riskLevel;
    }

    // Store alert
    if (!this.alerts.has(incidentId)) {
      this.alerts.set(incidentId, []);
    }
    if (alerts.length > 0) {
      this.alerts.get(incidentId)!.push(...alerts);
    }

    return { riskScore, alerts };
  }

  /**
   * Validate receipt authenticity
   */
  validateReceipt(
    donationId: string,
    vendor: string,
    amount: number,
    actualAmount: number,
    location?: string
  ): ReceiptValidation {
    const issues: string[] = [];
    let riskScore = 0;
    let vendorVerified = false;
    let amountVerified = false;

    // Check vendor
    const knownVendor = this.knownVendors.get(vendor.toLowerCase());
    if (knownVendor) {
      vendorVerified = knownVendor.verified;
      if (!knownVendor.verified) {
        riskScore += 20;
        issues.push(`Vendor "${vendor}" is not verified`);
      }
      if (location && !knownVendor.locations.includes(location)) {
        riskScore += 15;
        issues.push(`Vendor location "${location}" not in known locations: ${knownVendor.locations.join(', ')}`);
      }
    } else {
      riskScore += 30;
      issues.push(`Vendor "${vendor}" not in database`);
    }

    // Check amount matches receipt
    if (Math.abs(amount - actualAmount) > amount * 0.05) { // 5% tolerance
      amountVerified = false;
      riskScore += 25;
      issues.push(`Amount mismatch: Pledge $${amount} vs Receipt $${actualAmount}`);
    } else {
      amountVerified = true;
    }

    return {
      receiptId: `receipt-${donationId}`,
      isValid: issues.length === 0,
      riskScore,
      issues,
      vendorVerified,
      amountVerified
    };
  }

  /**
   * Check if donation is missing receipt
   */
  checkMissingReceipt(
    donation: StepDonation,
    currentTimestamp: number = Date.now()
  ): { isMissing: boolean; daysSincePledge: number } {
    const daysSincePledge = (currentTimestamp - donation.pledgeTimestamp) / (24 * 60 * 60 * 1000);
    const isMissing = donation.receipts.length === 0 && daysSincePledge > this.MISSING_RECEIPT_DAYS;

    if (isMissing) {
      const alert: FraudAlert = {
        id: `alert-${Date.now()}`,
        incidentId: donation.incidentId,
        donationId: donation.id,
        riskScore: 30,
        riskLevel: 'medium',
        type: 'missing_receipt',
        description: `No receipt provided ${daysSincePledge.toFixed(1)} days after pledge`,
        evidence: [
          `Pledge date: ${new Date(donation.pledgeTimestamp).toISOString()}`,
          `Days without receipt: ${daysSincePledge.toFixed(1)}`,
          `Threshold: ${this.MISSING_RECEIPT_DAYS} days`
        ],
        flaggedAt: Date.now(),
        resolved: false
      };

      if (!this.alerts.has(donation.incidentId)) {
        this.alerts.set(donation.incidentId, []);
      }
      this.alerts.get(donation.incidentId)!.push(alert);
    }

    return { isMissing, daysSincePledge };
  }

  /**
   * Get fraud alerts for incident
   */
  getFraudAlerts(incidentId: string, unresolvedOnly = true): FraudAlert[] {
    const alerts = this.alerts.get(incidentId) || [];
    if (unresolvedOnly) {
      return alerts.filter(a => !a.resolved);
    }
    return alerts;
  }

  /**
   * Resolve fraud alert
   */
  resolveFraudAlert(incidentId: string, alertId: string, notes?: string): boolean {
    const alerts = this.alerts.get(incidentId);
    if (!alerts) return false;

    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();
    if (notes) alert.notes = notes;

    return true;
  }

  /**
   * Add donor to blacklist
   */
  blacklistDonor(donorName: string, reason?: string): void {
    this.blacklist.add(donorName);
    console.log(`[Fraud Detection] Blacklisted donor: ${donorName}${reason ? ` (${reason})` : ''}`);
  }

  /**
   * Remove donor from blacklist
   */
  whitelistDonor(donorName: string): boolean {
    return this.blacklist.delete(donorName);
  }

  /**
   * Get donor risk profile
   */
  getDonorRiskProfile(donorName: string): DonationRiskProfile {
    if (this.riskProfiles.has(donorName)) {
      return this.riskProfiles.get(donorName)!;
    }

    const history = this.donationHistory.get(donorName) || [];
    const flags: string[] = [];
    let riskScore = 0;

    // Analyze history
    if (history.length > 5) {
      flags.push('High frequency donor');
    }
    if (history.some(d => d.status === 'Refunded')) {
      flags.push('Has refunded donations');
      riskScore += 10;
    }
    if (history.some(d => d.receipts.length === 0)) {
      flags.push('Missing receipts on some donations');
      riskScore += 5;
    }

    const profile: DonationRiskProfile = {
      donationId: `profile-${donorName}`,
      donorName,
      riskScore,
      flags,
      isBlacklisted: this.blacklist.has(donorName),
      donationHistory: history.map(d => ({
        incidentId: d.incidentId,
        amount: d.amount,
        timestamp: d.pledgeTimestamp
      }))
    };

    this.riskProfiles.set(donorName, profile);
    return profile;
  }

  /**
   * Get fraud detection summary
   */
  getFraudSummary(incidentId: string): {
    totalAlerts: number;
    unresolvedAlerts: number;
    criticalAlerts: number;
    averageRiskScore: number;
    recentAlerts: FraudAlert[];
  } {
    const alerts = this.getFraudAlerts(incidentId, false);
    const unresolved = alerts.filter(a => !a.resolved);
    const critical = unresolved.filter(a => a.riskLevel === 'critical');
    const avgRisk = unresolved.length > 0
      ? unresolved.reduce((sum, a) => sum + a.riskScore, 0) / unresolved.length
      : 0;

    return {
      totalAlerts: alerts.length,
      unresolvedAlerts: unresolved.length,
      criticalAlerts: critical.length,
      averageRiskScore: Math.round(avgRisk),
      recentAlerts: unresolved.slice(0, 5)
    };
  }

  /**
   * Batch analyze donations
   */
  analyzeMultipleDonations(
    incidentId: string,
    donations: StepDonation[]
  ): Array<{ donation: StepDonation; riskScore: number; riskLevel: 'low' | 'medium' | 'high' | 'critical' }> {
    return donations.map(d => {
      const { riskScore, alerts } = this.analyzeDonation(incidentId, d, donations);
      const riskLevel = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
      return { donation: d, riskScore, riskLevel };
    });
  }
}

export const fraudDetectionService = new FraudDetectionService();
