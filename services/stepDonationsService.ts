/**
 * Step Donations Service
 * Directed micro-grants per incident step (e.g., fuel, PPE) with receipts and milestone-based disbursement
 */

import { baseVaultService } from './baseVaultService';
import { auditTrailService } from './auditTrailService';

export type Currency = 'ETH' | 'USDC';

export interface ImpactReceipt {
  id: string;
  message: string;
  proofLink?: string;
  photoUrl?: string;
  createdAt: number;
}

export interface StepDonation {
  id: string;
  incidentId: string;
  stepId: string;
  donorName: string;
  amount: number;
  currency: Currency;
  itemCategory: string; // e.g., Fuel, PPE, Water
  status: 'Pledged' | 'Disbursed' | 'Refunded';
  pledgeTimestamp: number;
  disburseTxHash?: string;
  disburseTimestamp?: number;
  receipts: ImpactReceipt[];
}

const store = new Map<string, StepDonation[]>(); // key: `${incidentId}:${stepId}`

function key(incidentId: string, stepId: string) {
  return `${incidentId}:${stepId}`;
}

export const stepDonationsService = {
  pledgeDonation(
    incidentId: string,
    stepId: string,
    donorName: string,
    amount: number,
    currency: Currency,
    itemCategory: string
  ): StepDonation {
    const donation: StepDonation = {
      id: `sd_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      incidentId,
      stepId,
      donorName,
      amount,
      currency,
      itemCategory,
      status: 'Pledged',
      pledgeTimestamp: Date.now(),
      receipts: [],
    };

    const k = key(incidentId, stepId);
    if (!store.has(k)) store.set(k, []);
    store.get(k)!.push(donation);

    auditTrailService.recordEvent(
      incidentId,
      donorName,
      'STEP_DONATION_PLEDGED',
      `${itemCategory}: ${amount} ${currency} for step ${stepId}`
    );

    return donation;
  },

  listStepDonations(incidentId: string, stepId: string): StepDonation[] {
    return store.get(key(incidentId, stepId)) || [];
  },

  addReceipt(
    incidentId: string,
    stepId: string,
    donationId: string,
    message: string,
    proofLink?: string,
    photoUrl?: string
  ): ImpactReceipt | null {
    const donations = store.get(key(incidentId, stepId)) || [];
    const donation = donations.find(d => d.id === donationId);
    if (!donation) return null;

    const receipt: ImpactReceipt = {
      id: `rc_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      message,
      proofLink,
      photoUrl,
      createdAt: Date.now(),
    };

    donation.receipts.push(receipt);

    auditTrailService.recordEvent(
      incidentId,
      'system',
      'STEP_DONATION_RECEIPT',
      `${donationId}: ${message}`
    );

    return receipt;
  },

  async verifyMilestoneAndDisburse(
    incidentId: string,
    stepId: string,
    verifierName: string,
    recipientWallet: string = '0xResponder'
  ): Promise<{ disbursed: number; currencyBreakdown: Record<Currency, number> }> {
    const donations = store.get(key(incidentId, stepId)) || [];
    const pledged = donations.filter(d => d.status === 'Pledged');

    const totals: Record<Currency, number> = { ETH: 0, USDC: 0 };

    for (const d of pledged) {
      totals[d.currency] += d.amount;
      const result = await baseVaultService.initiateBaseDonation(
        incidentId,
        String(d.amount),
        d.currency,
        recipientWallet
      );
      d.status = 'Disbursed';
      d.disburseTimestamp = Date.now();
      d.disburseTxHash = result.txHash;
      this.addReceipt(
        incidentId,
        stepId,
        d.id,
        `Disbursed after milestone verification: tx ${result.txHash.slice(0, 10)}...`,
      );
    }

    auditTrailService.recordEvent(
      incidentId,
      verifierName,
      'STEP_DONATIONS_DISBURSED',
      `Step ${stepId}: ETH ${totals.ETH}, USDC ${totals.USDC}`
    );

    return { disbursed: pledged.length, currencyBreakdown: totals };
  },

  getTotals(incidentId: string, stepId: string): { ETH: number; USDC: number } {
    const donations = store.get(key(incidentId, stepId)) || [];
    return donations.reduce(
      (acc, d) => {
        acc[d.currency] += d.amount;
        return acc;
      },
      { ETH: 0, USDC: 0 }
    );
  },
};
