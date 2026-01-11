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