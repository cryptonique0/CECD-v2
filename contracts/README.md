/**
 * Smart Contracts for CECD Platform
 * Deploy these to Base network using Hardhat/Foundry
 */

// ============================================
// 1. Incident Registry Contract
// ============================================
/**
 * SPDX-License-Identifier: MIT
 * pragma solidity ^0.8.20;
 * 
 * contract IncidentRegistry {
 *     struct Incident {
 *         bytes32 merkleRoot;
 *         uint256 timestamp;
 *         uint256 blockNumber;
 *         bool exists;
 *     }
 *     
 *     mapping(string => Incident) public incidents;
 *     address public admin;
 *     
 *     event IncidentRegistered(string indexed incidentId, bytes32 merkleRoot, uint256 timestamp);
 *     event IncidentUpdated(string indexed incidentId, bytes32 newMerkleRoot, uint256 timestamp);
 *     
 *     modifier onlyAdmin() {
 *         require(msg.sender == admin, "Only admin");
 *         _;
 *     }
 *     
 *     constructor() {
 *         admin = msg.sender;
 *     }
 *     
 *     function registerIncident(string calldata incidentId, bytes32 merkleRoot) external onlyAdmin returns (uint256) {
 *         require(!incidents[incidentId].exists, "Incident already registered");
 *         
 *         incidents[incidentId] = Incident({
 *             merkleRoot: merkleRoot,
 *             timestamp: block.timestamp,
 *             blockNumber: block.number,
 *             exists: true
 *         });
 *         
 *         emit IncidentRegistered(incidentId, merkleRoot, block.timestamp);
 *         return block.number;
 *     }
 *     
 *     function updateIncidentRoot(string calldata incidentId, bytes32 newMerkleRoot) external onlyAdmin {
 *         require(incidents[incidentId].exists, "Incident not found");
 *         
 *         incidents[incidentId].merkleRoot = newMerkleRoot;
 *         incidents[incidentId].timestamp = block.timestamp;
 *         
 *         emit IncidentUpdated(incidentId, newMerkleRoot, block.timestamp);
 *     }
 *     
 *     function getIncidentRoot(string calldata incidentId) external view returns (bytes32, uint256, uint256) {
 *         require(incidents[incidentId].exists, "Incident not found");
 *         Incident memory incident = incidents[incidentId];
 *         return (incident.merkleRoot, incident.timestamp, incident.blockNumber);
 *     }
 * }
 */

// ============================================
// 2. Multi-Sig Governance Contract
// ============================================
/**
 * SPDX-License-Identifier: MIT
 * pragma solidity ^0.8.20;
 * 
 * contract MultiSigGovernance {
 *     struct Proposal {
 *         bytes32 proposalHash;
 *         address[] targets;
 *         bytes[] calldatas;
 *         uint256 approvals;
 *         uint256 timestamp;
 *         bool executed;
 *         mapping(address => bool) hasApproved;
 *     }
 *     
 *     mapping(uint256 => Proposal) public proposals;
 *     uint256 public proposalCount;
 *     
 *     address[] public approvers;
 *     uint256 public requiredApprovals;
 *     
 *     event ProposalSubmitted(uint256 indexed proposalId, bytes32 proposalHash);
 *     event ProposalApproved(uint256 indexed proposalId, address approver, uint256 totalApprovals);
 *     event ProposalExecuted(uint256 indexed proposalId);
 *     
 *     modifier onlyApprover() {
 *         bool isApprover = false;
 *         for (uint i = 0; i < approvers.length; i++) {
 *             if (approvers[i] == msg.sender) {
 *                 isApprover = true;
 *                 break;
 *             }
 *         }
 *         require(isApprover, "Not an approver");
 *         _;
 *     }
 *     
 *     constructor(address[] memory _approvers, uint256 _requiredApprovals) {
 *         require(_approvers.length >= _requiredApprovals, "Invalid threshold");
 *         approvers = _approvers;
 *         requiredApprovals = _requiredApprovals;
 *     }
 *     
 *     function submitProposal(bytes32 proposalHash, address[] calldata targets, bytes[] calldata calldatas) 
 *         external 
 *         onlyApprover 
 *         returns (uint256) 
 *     {
 *         require(targets.length == calldatas.length, "Length mismatch");
 *         
 *         uint256 proposalId = proposalCount++;
 *         Proposal storage proposal = proposals[proposalId];
 *         proposal.proposalHash = proposalHash;
 *         proposal.targets = targets;
 *         proposal.calldatas = calldatas;
 *         proposal.timestamp = block.timestamp;
 *         
 *         emit ProposalSubmitted(proposalId, proposalHash);
 *         return proposalId;
 *     }
 *     
 *     function approveProposal(uint256 proposalId) external onlyApprover {
 *         Proposal storage proposal = proposals[proposalId];
 *         require(!proposal.executed, "Already executed");
 *         require(!proposal.hasApproved[msg.sender], "Already approved");
 *         
 *         proposal.hasApproved[msg.sender] = true;
 *         proposal.approvals++;
 *         
 *         emit ProposalApproved(proposalId, msg.sender, proposal.approvals);
 *     }
 *     
 *     function executeProposal(uint256 proposalId) external onlyApprover {
 *         Proposal storage proposal = proposals[proposalId];
 *         require(!proposal.executed, "Already executed");
 *         require(proposal.approvals >= requiredApprovals, "Not enough approvals");
 *         
 *         proposal.executed = true;
 *         
 *         for (uint i = 0; i < proposal.targets.length; i++) {
 *             (bool success,) = proposal.targets[i].call(proposal.calldatas[i]);
 *             require(success, "Execution failed");
 *         }
 *         
 *         emit ProposalExecuted(proposalId);
 *     }
 *     
 *     function getProposalStatus(uint256 proposalId) external view returns (uint8, uint256, uint256) {
 *         Proposal storage proposal = proposals[proposalId];
 *         uint8 status = proposal.executed ? 2 : (proposal.approvals >= requiredApprovals ? 1 : 0);
 *         return (status, proposal.approvals, requiredApprovals);
 *     }
 * }
 */

// ============================================
// 3. Donation Management Contract
// ============================================
/**
 * SPDX-License-Identifier: MIT
 * pragma solidity ^0.8.20;
 * 
 * contract DonationManager {
 *     struct IncidentFund {
 *         uint256 balance;
 *         uint256 totalReceived;
 *         uint256 totalDisbursed;
 *         bool frozen;
 *     }
 *     
 *     mapping(string => IncidentFund) public incidentFunds;
 *     mapping(string => mapping(address => uint256)) public donorContributions;
 *     
 *     address public multiSig;
 *     
 *     event DonationReceived(string indexed incidentId, address indexed donor, uint256 amount, uint256 newBalance);
 *     event FundsDisbursed(string indexed incidentId, address indexed recipient, uint256 amount, uint256 remainingBalance);
 *     event FundsFrozen(string indexed incidentId);
 *     event FundsUnfrozen(string indexed incidentId);
 *     
 *     modifier onlyMultiSig() {
 *         require(msg.sender == multiSig, "Only multi-sig");
 *         _;
 *     }
 *     
 *     constructor(address _multiSig) {
 *         multiSig = _multiSig;
 *     }
 *     
 *     function donate(string calldata incidentId) external payable {
 *         require(msg.value > 0, "Must send ETH");
 *         require(!incidentFunds[incidentId].frozen, "Funds frozen");
 *         
 *         IncidentFund storage fund = incidentFunds[incidentId];
 *         fund.balance += msg.value;
 *         fund.totalReceived += msg.value;
 *         
 *         donorContributions[incidentId][msg.sender] += msg.value;
 *         
 *         emit DonationReceived(incidentId, msg.sender, msg.value, fund.balance);
 *     }
 *     
 *     function disburse(string calldata incidentId, address payable recipient, uint256 amount) external onlyMultiSig {
 *         IncidentFund storage fund = incidentFunds[incidentId];
 *         require(fund.balance >= amount, "Insufficient balance");
 *         require(!fund.frozen, "Funds frozen");
 *         
 *         fund.balance -= amount;
 *         fund.totalDisbursed += amount;
 *         
 *         recipient.transfer(amount);
 *         
 *         emit FundsDisbursed(incidentId, recipient, amount, fund.balance);
 *     }
 *     
 *     function freezeFunds(string calldata incidentId) external onlyMultiSig {
 *         incidentFunds[incidentId].frozen = true;
 *         emit FundsFrozen(incidentId);
 *     }
 *     
 *     function unfreezeFunds(string calldata incidentId) external onlyMultiSig {
 *         incidentFunds[incidentId].frozen = false;
 *         emit FundsUnfrozen(incidentId);
 *     }
 *     
 *     function getIncidentBalance(string calldata incidentId) external view returns (uint256) {
 *         return incidentFunds[incidentId].balance;
 *     }
 *     
 *     function getIncidentStats(string calldata incidentId) external view returns (uint256, uint256, uint256, bool) {
 *         IncidentFund memory fund = incidentFunds[incidentId];
 *         return (fund.balance, fund.totalReceived, fund.totalDisbursed, fund.frozen);
 *     }
 *     
 *     function getDonorContribution(string calldata incidentId, address donor) external view returns (uint256) {
 *         return donorContributions[incidentId][donor];
 *     }
 * }
 */

export const contracts = {
  IncidentRegistry: {
    name: 'IncidentRegistry',
    description: 'On-chain incident data anchoring with Merkle roots',
  },
  MultiSigGovernance: {
    name: 'MultiSigGovernance',
    description: 'Multi-signature approval for critical actions',
  },
  DonationManager: {
    name: 'DonationManager',
    description: 'Transparent donation tracking and disbursement',
  },
};

export const deploymentInstructions = `
# Deploy CECD Smart Contracts to Base Network

## Prerequisites
- Node.js 18+
- Hardhat or Foundry
- Base Sepolia testnet ETH (from faucet)

## Using Hardhat

1. Initialize Hardhat project:
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

2. Create hardhat.config.js:
   require('@nomicfoundation/hardhat-toolbox');
   
   module.exports = {
     solidity: "0.8.20",
     networks: {
       baseSepolia: {
         url: "https://sepolia.base.org",
         accounts: [process.env.PRIVATE_KEY],
         chainId: 84532
       },
       base: {
         url: "https://mainnet.base.org",
         accounts: [process.env.PRIVATE_KEY],
         chainId: 8453
       }
     }
   };

3. Create contracts in contracts/ folder

4. Deploy:
   npx hardhat run scripts/deploy.js --network baseSepolia

5. Verify on Basescan:
   npx hardhat verify --network baseSepolia CONTRACT_ADDRESS

## Update Service Configuration

After deployment, update these addresses in:
- services/blockchain/baseService.ts
  - INCIDENT_REGISTRY_ADDRESS
  - MULTISIG_ADDRESS
  - DONATION_ADDRESS
`;
