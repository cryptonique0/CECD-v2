import { baseBlockchainService } from './blockchain/baseService';
import { ipfsService } from './blockchain/ipfsService';
import { walletAuthService } from './blockchain/walletAuthService';
import { Incident } from '../types';

/**
 * Integrated blockchain service that combines all blockchain features
 */
class BlockchainIntegrationService {
  private merkleTreeCache: Map<string, string> = new Map();

  /**
   * Initialize blockchain connection and authenticate user
   */
  async initialize(): Promise<string> {
    // Connect wallet
    const address = await baseBlockchainService.connectWallet();
    
    // Authenticate user
    await walletAuthService.signInWithWallet();
    
    return address;
  }

  /**
   * Register incident on-chain with evidence
   */
  async registerIncidentOnChain(
    incident: Incident,
    evidenceFiles?: File[]
  ): Promise<{
    txHash: string;
    merkleRoot: string;
    evidenceCIDs: string[];
  }> {
    const user = walletAuthService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // 1. Upload evidence to IPFS if provided
    const evidenceCIDs: string[] = [];
    if (evidenceFiles && evidenceFiles.length > 0) {
      const uploads = await ipfsService.uploadMultiple(evidenceFiles, {
        incidentId: incident.id,
        evidenceType: 'photo',
        uploadedBy: user.address,
        timestamp: Date.now(),
        hash: '',
      });
      evidenceCIDs.push(...uploads.map(u => u.cid));
    }

    // 2. Create incident data package
    const incidentData = {
      id: incident.id,
      title: incident.title,
      category: incident.category,
      severity: incident.severity,
      location: incident.location,
      reportedBy: user.address,
      timestamp: incident.timestamp,
      evidenceCIDs,
    };

    // 3. Compute Merkle root
    const merkleRoot = this.computeMerkleRoot(incidentData);

    // 4. Register on Base blockchain
    const result = await baseBlockchainService.registerIncidentMerkleRoot(
      incident.id,
      merkleRoot
    );

    // Cache merkle root
    this.merkleTreeCache.set(incident.id, merkleRoot);

    return {
      txHash: result.txHash,
      merkleRoot: result.merkleRoot,
      evidenceCIDs,
    };
  }

  /**
   * Upload evidence to IPFS and link to incident
   */
  async uploadEvidence(
    incidentId: string,
    file: File,
    evidenceType: 'photo' | 'video' | 'document' | 'audio' | 'other',
    location?: { lat: number; lng: number },
    description?: string
  ): Promise<string> {
    const user = walletAuthService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const result = await ipfsService.uploadEvidence(file, {
      incidentId,
      evidenceType,
      uploadedBy: user.address,
      timestamp: Date.now(),
      location,
      description,
      hash: '',
    });

    return result.cid;
  }

  /**
   * Retrieve evidence from IPFS
   */
  async retrieveEvidence(cid: string): Promise<Blob> {
    return await ipfsService.retrieveFile(cid);
  }

  /**
   * Process donation via smart contract
   */
  async processDonation(incidentId: string, amountInEth: string): Promise<string> {
    const user = walletAuthService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const result = await baseBlockchainService.processDonation(incidentId, amountInEth);
    return result.txHash;
  }

  /**
   * Get incident donation balance
   */
  async getIncidentBalance(incidentId: string): Promise<string> {
    return await baseBlockchainService.getIncidentBalance(incidentId);
  }

  /**
   * Submit multi-sig proposal for fund disbursement
   */
  async submitDisbursementProposal(
    incidentId: string,
    recipient: string,
    amountInEth: string,
    reason: string
  ): Promise<{ proposalId: string; txHash: string }> {
    const user = walletAuthService.getCurrentUser();
    if (!user || !['admin', 'commander'].includes(user.role)) {
      throw new Error('Only admins and commanders can submit disbursement proposals');
    }

    // Encode disbursement call
    const donationContractAddress = '0x0000000000000000000000000000000000000000'; // TODO: Update
    const calldata = this.encodeDisbursementCall(incidentId, recipient, amountInEth);

    const result = await baseBlockchainService.submitMultiSigProposal(
      `disbursement-${incidentId}-${Date.now()}`,
      [donationContractAddress],
      [calldata]
    );

    return {
      proposalId: result.proposalId,
      txHash: result.txHash,
    };
  }

  /**
   * Approve multi-sig proposal
   */
  async approveProposal(proposalId: number): Promise<string> {
    const user = walletAuthService.getCurrentUser();
    if (!user || !['admin', 'commander'].includes(user.role)) {
      throw new Error('Only admins and commanders can approve proposals');
    }

    return await baseBlockchainService.approveProposal(proposalId);
  }

  /**
   * Execute approved proposal
   */
  async executeProposal(proposalId: number): Promise<string> {
    return await baseBlockchainService.executeProposal(proposalId);
  }

  /**
   * Verify incident data integrity
   */
  async verifyIncidentIntegrity(incidentId: string, incidentData: any): Promise<boolean> {
    const computedRoot = this.computeMerkleRoot(incidentData);
    return await baseBlockchainService.verifyIncidentData(incidentId, computedRoot);
  }

  /**
   * Get transaction explorer URL
   */
  async getTransactionUrl(txHash: string): Promise<string> {
    const details = await baseBlockchainService.getTransactionDetails(txHash);
    return details.explorerUrl;
  }

  /**
   * Compute Merkle root from incident data
   */
  private computeMerkleRoot(data: any): string {
    // Simple hash-based implementation
    // In production, use a proper Merkle tree library
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return jsonString; // This would be hashed in production
  }

  /**
   * Encode disbursement function call
   */
  private encodeDisbursementCall(incidentId: string, recipient: string, amountInEth: string): string {
    // This would use ethers.js ABI encoding in production
    return '0x'; // Placeholder
  }

  /**
   * Get current user info
   */
  getCurrentUser() {
    return walletAuthService.getCurrentUser();
  }

  /**
   * Check user permissions
   */
  hasPermission(permission: string): boolean {
    return walletAuthService.hasPermission(permission);
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return baseBlockchainService.getNetworkInfo();
  }

  /**
   * Listen to on-chain events
   */
  listenToEvents(callback: (event: any) => void) {
    baseBlockchainService.listenToIncidentEvents(callback);
  }

  /**
   * Disconnect and sign out
   */
  disconnect() {
    baseBlockchainService.disconnect();
    walletAuthService.signOut();
  }
}

// Export singleton
export const blockchainIntegration = new BlockchainIntegrationService();
