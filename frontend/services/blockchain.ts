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
        const raw = await response.text();
        // Strip surrounding quotes from API response
        return raw.replace(/^"|"$/g, '').trim();
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
  // Parse Helpers for Aleo Struct Responses
  // ===========================================================================

  /**
   * Parse an Aleo struct response into key-value pairs
   * Aleo returns: { id: 1u32, title: 12345field, ... }
   */
  private parseAleoStruct(raw: string): Record<string, string> {
    const result: Record<string, string> = {};
    const inner = raw.replace(/^\s*\{/, '').replace(/\}\s*$/, '');
    const lines = inner.split(/,\s*\n|\n|,(?=\s*\w+\s*:)/);
    for (const line of lines) {
      const trimmed = line.trim().replace(/,$/, '');
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      if (key) result[key] = value;
    }
    return result;
  }

  /**
   * Extract a numeric value from Aleo typed string (e.g., "123u32" → 123)
   */
  private parseAleoNumber(value: string): number {
    if (!value) return 0;
    const num = parseInt(value.replace(/u\d+$|i\d+$|field$/i, ''), 10);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse Aleo boolean value
   */
  private parseAleoBool(value: string): boolean {
    return value?.trim() === 'true';
  }

  // ===========================================================================
  // Real On-Chain Read Operations
  // ===========================================================================

  /**
   * Get proposal details from on-chain props mapping
   */
  async getProposal(proposalId: number): Promise<ProposalRecord | null> {
    try {
      const raw = await this.getMapping('props', `${proposalId}u32`);
      if (!raw || raw === 'null') return null;

      const fields = this.parseAleoStruct(raw);
      
      return {
        id: this.parseAleoNumber(fields['id'] || `${proposalId}`),
        title: fields['title'] || '',
        description: fields['desc'] || '',
        proposer: (fields['proposer'] || '').replace(/"/g, ''),
        createdAt: this.parseAleoNumber(fields['created'] || '0'),
        endsAt: this.parseAleoNumber(fields['ends'] || '0'),
        votesYes: this.parseAleoNumber(fields['yes'] || '0'),
        votesNo: this.parseAleoNumber(fields['no'] || '0'),
        executed: this.parseAleoBool(fields['exec'] || 'false'),
        passed: this.parseAleoBool(fields['pass'] || 'false'),
      };
    } catch (err) {
      console.error(`[Blockchain] Failed to get proposal ${proposalId}:`, err);
      return null;
    }
  }

  /**
   * Check if a proposal is currently active
   */
  async isProposalActive(proposalId: number): Promise<boolean> {
    try {
      const result = await this.getMapping('prop_active', `${proposalId}u32`);
      return result === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Check if a badge nonce is registered on-chain
   */
  async isBadgeRegistered(badgeNonce: string): Promise<boolean> {
    try {
      const nonceKey = badgeNonce.endsWith('field') ? badgeNonce : `${badgeNonce}field`;
      const result = await this.getMapping('bdg_reg', nonceKey);
      return result !== null && result !== 'null';
    } catch {
      return false;
    }
  }

  /**
   * Check if a badge has been revoked
   */
  async isBadgeRevoked(badgeNonce: string): Promise<boolean> {
    try {
      const nonceKey = badgeNonce.endsWith('field') ? badgeNonce : `${badgeNonce}field`;
      const result = await this.getMapping('bdg_revoked', nonceKey);
      return result === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Get vote tally for a proposal
   * The contract stores: yes_count * 1000000 + no_count in vote_tally mapping as a field
   */
  async getVoteTally(proposalId: number): Promise<{ yes: number; no: number }> {
    try {
      const raw = await this.getMapping('vote_tally', `${proposalId}u32`);
      if (!raw || raw === 'null') return { yes: 0, no: 0 };

      // vote_tally stores field values: "12345field"
      const tallyStr = raw.replace(/field$/i, '');
      const tally = parseInt(tallyStr, 10);
      if (isNaN(tally)) return { yes: 0, no: 0 };

      return {
        yes: Math.floor(tally / 1000000),
        no: tally % 1000000,
      };
    } catch {
      return { yes: 0, no: 0 };
    }
  }

  /**
   * Get all proposals by iterating from 1 to prop_cnt
   */
  async getAllProposals(): Promise<ProposalRecord[]> {
    const count = await this.getProposalCount();
    const proposals: ProposalRecord[] = [];

    for (let i = 1; i <= count; i++) {
      try {
        const proposal = await this.getProposal(i);
        if (proposal) proposals.push(proposal);
      } catch (e) {
        console.warn(`[Blockchain] Skipping proposal ${i}:`, e);
      }
    }

    return proposals;
  }

  /**
   * Check if the program is deployed on the network
   */
  async isProgramDeployed(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/program/${PROGRAM_ID}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if a vote nullifier exists (i.e., user already voted on this proposal)
   */
  async hasVoteNullifier(nullifierField: string): Promise<boolean> {
    try {
      const key = nullifierField.endsWith('field') ? nullifierField : `${nullifierField}field`;
      const result = await this.getMapping('vote_null', key);
      return result === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Check if a proof hash has already been used
   */
  async isProofUsed(proofHashField: string): Promise<boolean> {
    try {
      const key = proofHashField.endsWith('field') ? proofHashField : `${proofHashField}field`;
      const result = await this.getMapping('proof_used', key);
      return result === 'true';
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const blockchain = new BlockchainService();
export default blockchain;
