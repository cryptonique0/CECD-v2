import { User } from "../types";

export type TrustSignalType =
  | "MissionCompletion"
  | "PeerReview"
  | "ZkSkillProof"
  | "OnChainAttestation";

export interface TrustComponent {
  label: string;
  value: number;
  decayFactor: number;
  weight: number;
  type: TrustSignalType;
  lastUpdated: number;
  proofRef?: string;
}

export interface TrustProfile {
  score: number;
  components: TrustComponent[];
  lastUpdated: number;
}

const DEFAULT_HALF_LIFE_HOURS = 72; // trust signals halve every 3 days by default

function hoursSince(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60);
}

function applyDecay(value: number, hoursSince: number, halfLifeHours: number): number {
  return value * Math.pow(0.5, hoursSince / halfLifeHours);
}

export const trustService = {
  buildProfile(user: User, signals: TrustComponent[] = []): TrustProfile {
    const now = Date.now();
    
    // Apply time decay to all components
    const decayedComponents = signals.map(comp => {
      const hours = hoursSince(comp.lastUpdated);
      const decayedValue = applyDecay(comp.value, hours, comp.decayFactor || DEFAULT_HALF_LIFE_HOURS);
      return { ...comp, value: decayedValue };
    });

    // Weighted sum
    const totalWeight = decayedComponents.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore = decayedComponents.reduce((sum, c) => sum + (c.value * c.weight), 0);
    const finalScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : user.trustScore || 80;

    return {
      score: Math.min(100, Math.max(0, finalScore)),
      components: decayedComponents,
      lastUpdated: now
    };
  },

  addMissionAttestation(userId: string, incidentId: string, performance: number): TrustComponent {
    return {
      label: `Mission ${incidentId}`,
      value: performance,
      decayFactor: DEFAULT_HALF_LIFE_HOURS,
      weight: 3,
      type: "MissionCompletion",
      lastUpdated: Date.now(),
      proofRef: `on-chain-tx-${Math.random().toString(16).slice(2, 10)}`
    };
  },

  addPeerReview(fromUserId: string, toUserId: string, rating: number, comment?: string): TrustComponent {
    return {
      label: `Peer review from ${fromUserId}`,
      value: rating,
      decayFactor: DEFAULT_HALF_LIFE_HOURS * 1.5,
      weight: 2,
      type: "PeerReview",
      lastUpdated: Date.now()
    };
  },

  addZkSkillProof(userId: string, skill: string, proofHash: string): TrustComponent {
    return {
      label: `ZK Skill: ${skill}`,
      value: 95,
      decayFactor: DEFAULT_HALF_LIFE_HOURS * 10, // skill proofs decay very slowly
      weight: 4,
      type: "ZkSkillProof",
      lastUpdated: Date.now(),
      proofRef: proofHash
    };
  },

  addOnChainAttestation(userId: string, attestationType: string, proofHash: string): TrustComponent {
    return {
      label: `ID: ${attestationType}`,
      value: 100,
      decayFactor: DEFAULT_HALF_LIFE_HOURS * 20, // ID proofs decay extremely slowly
      weight: 5,
      type: "OnChainAttestation",
      lastUpdated: Date.now(),
      proofRef: proofHash
    };
  }
};
