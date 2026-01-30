// ============================================================================
// SybilShield Frontend - Blockchain Service
// ============================================================================

/**
 * This service handles interactions with the Aleo blockchain.
 * For client-side wallet interactions, use the useAleo hook.
 * This service provides server-side and read-only operations.
 */

// ============================================================================
// Types
// ============================================================================

interface TransactionResult {
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight?: number;
}

// Badge record structure (exported for potential future use)
export interface BadgeRecord {
  owner: string;
  issuer: string;
  proofHash: string;
  createdAt: number;
  expiresAt: number;
  nonce: string;
}

// Vote record structure (exported for potential future use)
export interface VoteRecord {
  voter: string;
  proposalId: number;
  voteChoice: boolean;
  badgeNonce: string;
  timestamp: number;
}

// Proposal structure
export interface ProposalRecord {
  id: number;
  title: string;
  description: string;
  proposer: string;
  createdAt: number;
  endsAt: number;
  votesYes: number;
  votesNo: number;
  executed: boolean;
  passed: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const PROGRAM_ID = 'sybilshield_aio_v2.aleo';
export const DEPLOY_TX_ID = 'at10376kkr45n7k6pat7jt2g9knsy7wv4uyvs59glz0j2239snxaqyqjred3d';

export const API_ENDPOINTS = {
  TESTNET: 'https://api.explorer.provable.com/v1/testnet',
  MAINNET: 'https://api.explorer.provable.com/v1/mainnet',
};

// ============================================================================
// Blockchain Service
// ============================================================================

class BlockchainService {
  public readonly network: string;
  private readonly apiEndpoint: string;

  constructor() {
    this.network = process.env.NEXT_PUBLIC_ALEO_NETWORK || 'testnet';
    this.apiEndpoint = this.network === 'mainnet' 
      ? API_ENDPOINTS.MAINNET 
      : API_ENDPOINTS.TESTNET;
  }

  // ===========================================================================
  // Read Operations (No wallet required)
  // ===========================================================================

  /**
   * Get current block height
   */
  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(`${this.apiEndpoint}/latest/height`);
      const height = await response.json();
      return typeof height === 'number' ? height : 0;
    } catch (err) {
      console.error('[Blockchain] Failed to get block height:', err);
      return 0;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      const response = await fetch(`${this.apiEndpoint}/transaction/${transactionId}`);
      if (response.ok) {
        return 'confirmed';
      }
      return 'pending';
    } catch {
      return 'pending';
    }
  }

  /**
   * Get program mappings (public state)
   */
  async getMapping(mappingName: string, key: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.apiEndpoint}/program/${PROGRAM_ID}/mapping/${mappingName}/${key}`
      );
      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch (err) {
      console.error(`[Blockchain] Failed to get mapping ${mappingName}:`, err);
      return null;
    }
  }

  /**
   * Check if program is initialized
   */
  async isProgramInitialized(): Promise<boolean> {
    const result = await this.getMapping('inited', '0u8');
    return result === 'true';
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    const result = await this.getMapping('bdg_count', '0u8');
    if (result) {
      return parseInt(result.replace('u32', ''), 10);
    }
    return 0;
  }

  /**
   * Get proposal count
   */
  async getProposalCount(): Promise<number> {
    const result = await this.getMapping('prop_cnt', '0u8');
    if (result) {
      return parseInt(result.replace('u32', ''), 10);
    }
    return 0;
  }

  /**
   * Check if an issuer is registered
   */
  async isIssuerRegistered(issuerAddress: string): Promise<boolean> {
    const result = await this.getMapping('iss_reg', issuerAddress);
    return result === 'true';
  }

  // ===========================================================================
  // Demo Mode Operations
  // ===========================================================================

  /**
   * Issue a new SybilShield badge
   * @param owner - The address of the badge owner
   * @param proofHash - Hash of the verification proof
   */
  async issueBadge(owner: string, proofHash: string): Promise<TransactionResult> {
    console.log(`[Blockchain] Issuing badge for ${owner} with proof hash ${proofHash}`);
    
    // In production, this would:
    // 1. Use the wallet adapter to sign the transaction
    // 2. Call the sybilshield_aio_v2.aleo/issue_badge transition
    // 3. Wait for transaction confirmation
    
    // Demo mode: simulate transaction
    await this.simulateDelay(2000);
    
    return {
      transactionId: `at1${this.generateRandomHash(58)}`,
      status: 'confirmed',
      blockHeight: Math.floor(Math.random() * 1000000),
    };
  }

  /**
   * Verify a badge is valid
   * @param owner - The badge owner's address
   */
  async verifyBadge(owner: string): Promise<boolean> {
    console.log(`[Blockchain] Verifying badge for ${owner}`);
    
    // In production, this would query the blockchain state
    await this.simulateDelay(500);
    
    return true; // Demo: always return true
  }

  /**
   * Renew an existing badge
   * @param owner - The badge owner's address
   */
  async renewBadge(owner: string): Promise<TransactionResult> {
    console.log(`[Blockchain] Renewing badge for ${owner}`);
    
    await this.simulateDelay(2000);
    
    return {
      transactionId: `at1${this.generateRandomHash(58)}`,
      status: 'confirmed',
      blockHeight: Math.floor(Math.random() * 1000000),
    };
  }

  // ===========================================================================
  // Governance Operations
  // ===========================================================================

  /**
   * Create a new proposal
   * @param proposer - The address of the proposer
   * @param title - Proposal title
   * @param description - Proposal description
   * @param durationBlocks - How long voting is open (in blocks)
   */
  async createProposal(
    _proposer: string,
    title: string,
    _description: string,
    _durationBlocks: number
  ): Promise<TransactionResult> {
    console.log(`[Blockchain] Creating proposal: ${title}`);
    
    // In production, this would call sybilshield_aio_v2.aleo/create_proposal
    await this.simulateDelay(2000);
    
    return {
      transactionId: `at1${this.generateRandomHash(58)}`,
      status: 'confirmed',
      blockHeight: Math.floor(Math.random() * 1000000),
    };
  }

  /**
   * Cast a vote on a proposal
   * @param voter - The voter's address
   * @param proposalId - The proposal ID
   * @param voteChoice - true for yes, false for no
   * @param badgeNonce - The voter's badge nonce for privacy
   */
  async vote(
    _voter: string,
    proposalId: number,
    voteChoice: boolean,
    _badgeNonce: string
  ): Promise<TransactionResult> {
    console.log(`[Blockchain] Voting ${voteChoice ? 'Yes' : 'No'} on proposal ${proposalId}`);
    
    // In production, this would:
    // 1. Generate a ZK proof that the voter has a valid badge
    // 2. Call sybilshield_aio_v2.aleo/vote with the proof
    // 3. The on-chain logic verifies the proof and records the vote
    
    await this.simulateDelay(3000);
    
    return {
      transactionId: `at1${this.generateRandomHash(58)}`,
      status: 'confirmed',
      blockHeight: Math.floor(Math.random() * 1000000),
    };
  }

  /**
   * Get proposal details
   * @param proposalId - The proposal ID
   */
  async getProposal(proposalId: number): Promise<{
    id: number;
    votesYes: number;
    votesNo: number;
    status: string;
  } | null> {
    console.log(`[Blockchain] Getting proposal ${proposalId}`);
    
    await this.simulateDelay(500);
    
    // Demo: return mock data
    return {
      id: proposalId,
      votesYes: Math.floor(Math.random() * 100),
      votesNo: Math.floor(Math.random() * 50),
      status: 'active',
    };
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRandomHash(length: number): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    return Array.from(
      { length }, 
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const blockchain = new BlockchainService();
export default blockchain;
