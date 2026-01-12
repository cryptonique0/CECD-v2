import { ethers } from 'ethers';

// Base network configuration
const BASE_MAINNET = {
  chainId: 8453,
  name: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
};

const BASE_SEPOLIA = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
};

interface IncidentMerkleRoot {
  incidentId: string;
  merkleRoot: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

interface MultiSigApproval {
  proposalId: string;
  approvers: string[];
  threshold: number;
  executed: boolean;
  txHash: string;
}

interface DonationDisbursement {
  incidentId: string;
  recipient: string;
  amount: string;
  currency: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

class BaseBlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;
  private network: typeof BASE_MAINNET | typeof BASE_SEPOLIA;
  private incidentRegistryContract: ethers.Contract | null = null;
  private multiSigContract: ethers.Contract | null = null;
  private donationContract: ethers.Contract | null = null;

  // Contract addresses (deploy these to Base network)
  private readonly INCIDENT_REGISTRY_ADDRESS = '0x0000000000000000000000000000000000000000'; // TODO: Deploy contract
  private readonly MULTISIG_ADDRESS = '0x0000000000000000000000000000000000000000'; // TODO: Deploy contract
  private readonly DONATION_ADDRESS = '0x0000000000000000000000000000000000000000'; // TODO: Deploy contract

  constructor(useTestnet: boolean = true) {
    this.network = useTestnet ? BASE_SEPOLIA : BASE_MAINNET;
    this.provider = new ethers.JsonRpcProvider(this.network.rpcUrl);
  }

  /**
   * Connect wallet and initialize signer
   */
  async connectWallet(): Promise<string> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('MetaMask or compatible wallet not found');
    }

    const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    
    // Request account access
    await browserProvider.send('eth_requestAccounts', []);
    
    // Switch to Base network if needed
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${this.network.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Network not added, add it
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${this.network.chainId.toString(16)}`,
              chainName: this.network.name,
              rpcUrls: [this.network.rpcUrl],
              blockExplorerUrls: [this.network.blockExplorer],
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
            },
          ],
        });
      } else {
        throw switchError;
      }
    }

    this.signer = await browserProvider.getSigner();
    const address = await this.signer.getAddress();

    // Initialize contracts with signer
    this.initializeContracts();

    return address;
  }

  /**
   * Initialize contract instances
   */
  private initializeContracts() {
    if (!this.signer) return;

    // Incident Registry Contract ABI
    const incidentRegistryABI = [
      'function registerIncident(string calldata incidentId, bytes32 merkleRoot) external returns (uint256)',
      'function getIncidentRoot(string calldata incidentId) external view returns (bytes32, uint256, uint256)',
      'function updateIncidentRoot(string calldata incidentId, bytes32 newMerkleRoot) external',
      'event IncidentRegistered(string indexed incidentId, bytes32 merkleRoot, uint256 timestamp)',
    ];

    // MultiSig Contract ABI
    const multiSigABI = [
      'function submitProposal(bytes32 proposalId, address[] calldata targets, bytes[] calldata calldatas) external returns (uint256)',
      'function approveProposal(uint256 proposalId) external',
      'function executeProposal(uint256 proposalId) external',
      'function getProposalStatus(uint256 proposalId) external view returns (uint8, uint256, uint256)',
      'event ProposalSubmitted(uint256 indexed proposalId, bytes32 proposalHash)',
      'event ProposalApproved(uint256 indexed proposalId, address approver)',
      'event ProposalExecuted(uint256 indexed proposalId)',
    ];

    // Donation Contract ABI
    const donationABI = [
      'function donate(string calldata incidentId) external payable',
      'function disburse(string calldata incidentId, address recipient, uint256 amount) external',
      'function getIncidentBalance(string calldata incidentId) external view returns (uint256)',
      'event DonationReceived(string indexed incidentId, address donor, uint256 amount)',
      'event FundsDisbursed(string indexed incidentId, address recipient, uint256 amount)',
    ];

    this.incidentRegistryContract = new ethers.Contract(
      this.INCIDENT_REGISTRY_ADDRESS,
      incidentRegistryABI,
      this.signer
    );

    this.multiSigContract = new ethers.Contract(
      this.MULTISIG_ADDRESS,
      multiSigABI,
      this.signer
    );

    this.donationContract = new ethers.Contract(
      this.DONATION_ADDRESS,
      donationABI,
      this.signer
    );
  }

  /**
   * Register incident Merkle root on-chain
   */
  async registerIncidentMerkleRoot(incidentId: string, merkleRoot: string): Promise<IncidentMerkleRoot> {
    if (!this.incidentRegistryContract || !this.signer) {
      throw new Error('Wallet not connected');
    }

    // Convert merkle root to bytes32
    const rootBytes32 = ethers.keccak256(ethers.toUtf8Bytes(merkleRoot));

    // Submit transaction
    const tx = await this.incidentRegistryContract.registerIncident(incidentId, rootBytes32);
    const receipt = await tx.wait();

    return {
      incidentId,
      merkleRoot: rootBytes32,
      timestamp: Date.now(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  /**
   * Verify incident data against on-chain Merkle root
   */
  async verifyIncidentData(incidentId: string, dataHash: string): Promise<boolean> {
    if (!this.incidentRegistryContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const [merkleRoot, timestamp, blockNumber] = await this.incidentRegistryContract.getIncidentRoot(incidentId);
      
      // In production, you'd verify the data against the Merkle tree
      // This is a simplified verification
      const computedRoot = ethers.keccak256(ethers.toUtf8Bytes(dataHash));
      return computedRoot === merkleRoot;
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }

  /**
   * Submit multi-sig proposal for critical actions
   */
  async submitMultiSigProposal(
    proposalId: string,
    targets: string[],
    calldatas: string[]
  ): Promise<MultiSigApproval> {
    if (!this.multiSigContract || !this.signer) {
      throw new Error('Wallet not connected');
    }

    const proposalHash = ethers.keccak256(ethers.toUtf8Bytes(proposalId));
    const tx = await this.multiSigContract.submitProposal(proposalHash, targets, calldatas);
    const receipt = await tx.wait();

    return {
      proposalId,
      approvers: [await this.signer.getAddress()],
      threshold: 3, // TODO: Get from contract
      executed: false,
      txHash: receipt.hash,
    };
  }

  /**
   * Approve multi-sig proposal
   */
  async approveProposal(proposalNumericId: number): Promise<string> {
    if (!this.multiSigContract) {
      throw new Error('Wallet not connected');
    }

    const tx = await this.multiSigContract.approveProposal(proposalNumericId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Execute approved multi-sig proposal
   */
  async executeProposal(proposalNumericId: number): Promise<string> {
    if (!this.multiSigContract) {
      throw new Error('Wallet not connected');
    }

    const tx = await this.multiSigContract.executeProposal(proposalNumericId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Process donation on-chain
   */
  async processDonation(incidentId: string, amountInEth: string): Promise<DonationDisbursement> {
    if (!this.donationContract || !this.signer) {
      throw new Error('Wallet not connected');
    }

    const amount = ethers.parseEther(amountInEth);
    const tx = await this.donationContract.donate(incidentId, { value: amount });
    const receipt = await tx.wait();

    return {
      incidentId,
      recipient: await this.signer.getAddress(),
      amount: amountInEth,
      currency: 'ETH',
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
    };
  }

  /**
   * Disburse funds to recipient (requires multi-sig approval)
   */
  async disburseFunds(incidentId: string, recipient: string, amountInEth: string): Promise<DonationDisbursement> {
    if (!this.donationContract || !this.signer) {
      throw new Error('Wallet not connected');
    }

    const amount = ethers.parseEther(amountInEth);
    const tx = await this.donationContract.disburse(incidentId, recipient, amount);
    const receipt = await tx.wait();

    return {
      incidentId,
      recipient,
      amount: amountInEth,
      currency: 'ETH',
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
    };
  }

  /**
   * Get incident donation balance
   */
  async getIncidentBalance(incidentId: string): Promise<string> {
    if (!this.donationContract) {
      throw new Error('Contract not initialized');
    }

    const balance = await this.donationContract.getIncidentBalance(incidentId);
    return ethers.formatEther(balance);
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(txHash: string) {
    const tx = await this.provider.getTransaction(txHash);
    const receipt = await this.provider.getTransactionReceipt(txHash);
    
    return {
      transaction: tx,
      receipt,
      explorerUrl: `${this.network.blockExplorer}/tx/${txHash}`,
    };
  }

  /**
   * Listen to contract events
   */
  listenToIncidentEvents(callback: (event: any) => void) {
    if (!this.incidentRegistryContract) return;

    this.incidentRegistryContract.on('IncidentRegistered', (incidentId, merkleRoot, timestamp, event) => {
      callback({
        type: 'IncidentRegistered',
        incidentId,
        merkleRoot,
        timestamp: Number(timestamp),
        txHash: event.log.transactionHash,
      });
    });
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.signer = null;
    this.incidentRegistryContract = null;
    this.multiSigContract = null;
    this.donationContract = null;
  }

  /**
   * Get current wallet address
   */
  async getCurrentAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return this.network;
  }
}

// Export singleton instance
export const baseBlockchainService = new BaseBlockchainService(true); // Use testnet by default
export type { IncidentMerkleRoot, MultiSigApproval, DonationDisbursement };
