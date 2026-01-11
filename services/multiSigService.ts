import { auditTrailService } from "./auditTrailService";

export interface MultiSigProposal {
  id: string;
  incidentId?: string;
  type: 'fund_release' | 'evacuation' | 'lockdown' | 'transaction';
  amount?: string;
  currency?: string;
  description: string;
  proposedBy: string;
  proposedAt: number;
  signatures: number;
  required: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Executed';
  signers: Array<{ actor: string; signedAt: number; signature: string }>;
  executedAt?: number;
  executionHash?: string;
  criticalAction?: boolean;
}

const proposals: MultiSigProposal[] = [
  {
    id: 'PROP-001',
    type: 'fund_release',
    amount: '0.85',
    currency: 'ETH',
    description: 'London Flood Relief Operation',
    proposedBy: 'dispatcher-1',
    proposedAt: Date.now() - 3600000,
    signatures: 1,
    required: 3,
    status: 'Pending',
    signers: [
      {
        actor: 'dispatcher-1',
        signedAt: Date.now() - 3600000,
        signature: 'sig_dispatcher1_001',
      },
    ],
    criticalAction: true,
  },
  {
    id: 'PROP-002',
    type: 'transaction',
    amount: '25000',
    currency: 'USDC',
    description: 'Global Medical Cache Restock',
    proposedBy: 'analyst-1',
    proposedAt: Date.now() - 7200000,
    signatures: 3,
    required: 3,
    status: 'Approved',
    signers: [
      {
        actor: 'analyst-1',
        signedAt: Date.now() - 7200000,
        signature: 'sig_analyst1_002',
      },
      {
        actor: 'dispatcher-2',
        signedAt: Date.now() - 5400000,
        signature: 'sig_dispatcher2_002',
      },
      {
        actor: 'owner-1',
        signedAt: Date.now() - 3600000,
        signature: 'sig_owner1_002',
      },
    ],
    criticalAction: false,
  },
];

export const multiSigService = {
  proposals,

  proposeCriticalAction(
    incidentId: string,
    actionType: 'fund_release' | 'evacuation' | 'lockdown',
    proposedBy: string,
    description: string,
    amount?: string,
    currency?: string
  ): MultiSigProposal {
    const proposal: MultiSigProposal = {
      id: `PROP-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(3, '0')}`,
      incidentId,
      type: actionType,
      amount,
      currency,
      description,
      proposedBy,
      proposedAt: Date.now(),
      signatures: 1,
      required: 3,
      status: 'Pending',
      signers: [
        {
          actor: proposedBy,
          signedAt: Date.now(),
          signature: `sig_${proposedBy}_${Date.now()}`,
        },
      ],
      criticalAction: true,
    };

    proposals.push(proposal);

    if (incidentId) {
      auditTrailService.recordCriticalAction(
        incidentId,
        actionType,
        proposedBy,
        `Proposed: ${description}`
      );
    }

    return proposal;
  },

  proposeTransaction(data: {
    description: string;
    proposedBy: string;
    amount?: string;
    currency?: string;
  }): MultiSigProposal {
    const proposal: MultiSigProposal = {
      id: `PROP-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(3, '0')}`,
      type: 'transaction',
      description: data.description,
      proposedBy: data.proposedBy,
      proposedAt: Date.now(),
      amount: data.amount,
      currency: data.currency,
      signatures: 1,
      required: 3,
      status: 'Pending',
      signers: [
        {
          actor: data.proposedBy,
          signedAt: Date.now(),
          signature: `sig_${data.proposedBy}_${Date.now()}`,
        },
      ],
      criticalAction: false,
    };

    proposals.push(proposal);
    return proposal;
  },

  signTransaction(id: string, signer: string): MultiSigProposal | null {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return null;

    if (proposal.signers.some(s => s.actor === signer)) {
      throw new Error(`${signer} has already signed this proposal`);
    }

    if (proposal.status !== 'Pending') {
      throw new Error(`Proposal ${id} is no longer pending (status: ${proposal.status})`);
    }

    proposal.signers.push({
      actor: signer,
      signedAt: Date.now(),
      signature: `sig_${signer}_${Date.now()}`,
    });

    proposal.signatures++;

    if (proposal.signatures >= proposal.required) {
      proposal.status = 'Approved';
      proposal.executedAt = Date.now();
      proposal.executionHash = `0x${Math.random().toString(16).slice(2)}`;

      if (proposal.incidentId && proposal.criticalAction) {
        auditTrailService.recordCriticalAction(
          proposal.incidentId,
          proposal.type as 'fund_release' | 'evacuation' | 'lockdown',
          signer,
          `Approved and executed: ${proposal.description}`
        );
      }
    }

    return proposal;
  },

  getProposals(): MultiSigProposal[] {
    return proposals;
  },

  getIncidentProposals(incidentId: string): MultiSigProposal[] {
    return proposals.filter(p => p.incidentId === incidentId);
  },

  getPendingProposals(): MultiSigProposal[] {
    return proposals.filter(p => p.status === 'Pending');
  },

  getCriticalProposals(): MultiSigProposal[] {
    return proposals.filter(p => p.criticalAction);
  },

  getProposalDetails(id: string): MultiSigProposal | null {
    return proposals.find(p => p.id === id) || null;
  },

  rejectProposal(id: string, rejectedBy: string, reason: string): boolean {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return false;

    proposal.status = 'Rejected';

    if (proposal.incidentId && proposal.criticalAction) {
      auditTrailService.recordEvent(
        proposal.incidentId,
        rejectedBy,
        'CRITICAL_ACTION_REJECTED',
        `${id}: ${reason}`
      );
    }

    return true;
  },
};
