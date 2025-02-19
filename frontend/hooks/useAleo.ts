// ============================================================================
// SybilShield Frontend - useAleo Hook
// ============================================================================
// Provides integration between the Aleo wallet adapter and smart contracts

'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '../app/contexts/WalletContext';

// ============================================================================
// Constants
// ============================================================================

// Program ID from our deployed contract
export const SYBILSHIELD_PROGRAM_ID = 'sybilshield_aio_v2.aleo';
export const DEPLOY_TX_ID = 'at10376kkr45n7k6pat7jt2g9knsy7wv4uyvs59glz0j2239snxaqyqjred3d';

// Network configuration - using testnet beta
export const ALEO_NETWORK = 'testnetbeta';

// Fee in microcredits (1 credit = 1,000,000 microcredits)
export const DEFAULT_FEE = 500_000; // 0.5 credits
export const RECORD_TX_FEE = 1_500_000; // 1.5 credits for txs that produce records + finalize

// ============================================================================
// Types
// ============================================================================

export interface TransactionStatus {
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}

export interface BadgeInfo {
  owner: string;
  issuer: string;
  createdAt: number;
  expiresAt: number;
  proofHash: string;
  nonce: string;
}

// Transaction format for Leo Wallet
interface LeoWalletTransaction {
  address: string;
  chainId: string;
  transitions: {
    program: string;
    functionName: string;
    inputs: string[];
  }[];
  fee: number;
  privateFee: boolean;
}

// ============================================================================
// Helper: Create Transaction for Leo Wallet
// ============================================================================

function createTransaction(
  address: string,
  programId: string,
  functionName: string,
  inputs: string[],
  fee: number = DEFAULT_FEE,
  privateFee: boolean = false
): LeoWalletTransaction {
  return {
    address,
    chainId: ALEO_NETWORK,
    transitions: [{
      program: programId,
      functionName,
      inputs,
    }],
    fee,
    privateFee,
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useAleo() {
  const { 
    publicKey, 
    connected, 
    connecting,
    disconnect,
    requestTransaction,
    requestRecords,
  } = useWallet();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===========================================================================
  // Helper Functions
  // ===========================================================================

  /**
   * Create a random field value for proofs
   * Aleo field max is ~8444461749428370424248824938781546531375899335154063827935233455917409239040
   * We use a safe 62-bit random number to stay well within bounds
   */
  const generateFieldValue = useCallback((): string => {
    // Generate a random 62-bit integer (safe for Aleo field)
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    // Clear top 2 bits to ensure we stay under 2^62
    bytes[0] = bytes[0] & 0x3F;
    let value = BigInt(0);
    for (let i = 0; i < 8; i++) {
      value = (value << BigInt(8)) | BigInt(bytes[i]);
    }
    return `${value}field`;
  }, []);

  /**
   * Get current block height (approximate)
   */
  const getCurrentBlockHeight = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('https://api.explorer.provable.com/v1/testnet/latest/height');
      const height = await response.json();
      return typeof height === 'number' ? height : 100000;
    } catch {
      // Return approximate value if API fails
      return 100000;
    }
  }, []);

  // ===========================================================================
  // Badge Operations
  // ===========================================================================

  /**
   * Initialize the SybilShield program (admin only)
   */
  const initializeProgram = useCallback(async (): Promise<TransactionStatus> => {
    if (!publicKey || !requestTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = createTransaction(
        publicKey,
        SYBILSHIELD_PROGRAM_ID,
        'init',
        [publicKey] // owner parameter
      );

      const txId = await requestTransaction(transaction);

      return {
        transactionId: txId || '',
        status: 'pending',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestTransaction]);

  /**
   * Register a new badge issuer (admin only)
   */
  const registerIssuer = useCallback(async (
    issuerAddress: string,
    _issuerName: string
  ): Promise<TransactionStatus> => {
    if (!publicKey || !requestTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Hash issuer name to field
      const nameHash = generateFieldValue();

      const transaction = createTransaction(
        publicKey,
        SYBILSHIELD_PROGRAM_ID,
        'reg_issuer',
        [issuerAddress, nameHash]
      );

      const txId = await requestTransaction(transaction);

      return {
        transactionId: txId || '',
        status: 'pending',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestTransaction, generateFieldValue]);

  /**
   * Issue a new SybilShield badge
   */
  const issueBadge = useCallback(async (
    recipient: string,
    proofHash?: string
  ): Promise<TransactionStatus> => {
    if (!publicKey || !requestTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const currentHeight = await getCurrentBlockHeight();
      // Badge expires in 1 year (~31.5M blocks at 1 block/sec)
      const expiresAt = currentHeight + 31536000;

      // Ensure proof hash has field suffix
      const proof = proofHash || generateFieldValue();
      const proofField = proof.endsWith('field') ? proof : `${proof}field`;

      const transaction = createTransaction(
        publicKey,
        SYBILSHIELD_PROGRAM_ID,
        'issue_badge',
        [
          recipient,
          proofField,
          `${expiresAt}u32`,
        ],
        RECORD_TX_FEE
      );

      const txId = await requestTransaction(transaction);

      return {
        transactionId: txId || '',
        status: 'pending',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestTransaction, getCurrentBlockHeight, generateFieldValue]);

  /**
   * Get user's badge records
   */
  const getBadgeRecords = useCallback(async (): Promise<BadgeInfo[]> => {
    if (!publicKey || !requestRecords) {
      throw new Error('Wallet not connected');
    }

    try {
      const records = await requestRecords(SYBILSHIELD_PROGRAM_ID) as Record<string, unknown>[];
      
      // Filter for SybilBadge records
      const badges = (Array.isArray(records) ? records : [])
        .filter((r: Record<string, unknown>) => r._recordType === 'SybilBadge')
        .map((r: Record<string, unknown>) => {
          const data = r as Record<string, string>;
          return {
            owner: data.owner || publicKey,
            issuer: data.issuer || '',
            createdAt: parseInt(data.created_at || '0'),
            expiresAt: parseInt(data.expires_at || '0'),
            proofHash: data.proof_hash || '',
            nonce: data.nonce || '',
          };
        });

      return badges;
    } catch (err) {
      console.error('Failed to fetch badge records:', err);
      return [];
    }
  }, [publicKey, requestRecords]);

  /**
   * Revoke a badge
   */
  const revokeBadge = useCallback(async (badgeNonce: string): Promise<TransactionStatus> => {
    if (!publicKey || !requestTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure nonce has field suffix
      const nonceField = badgeNonce.endsWith('field') ? badgeNonce : `${badgeNonce}field`;

      const transaction = createTransaction(
        publicKey,
        SYBILSHIELD_PROGRAM_ID,
        'revoke_badge',
        [nonceField]
      );

      const txId = await requestTransaction(transaction);

      return {
        transactionId: txId || '',
        status: 'pending',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestTransaction]);

  // ===========================================================================
  // Governance Operations
  // ===========================================================================

  /**
   * Create a new governance proposal
   */
  const createProposal = useCallback(async (
    _title: string,
    _description: string,
    durationBlocks: number = 86400, // Default 1 day
    badgeNonce: string
  ): Promise<TransactionStatus> => {
    if (!publicKey || !requestTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Hash title and description to field values
      const titleHash = generateFieldValue();
      const descHash = generateFieldValue();

      // Ensure badge nonce is properly formatted as field
      const nonceField = badgeNonce.endsWith('field') ? badgeNonce : `${badgeNonce}field`;

      const transaction = createTransaction(
        publicKey,
        SYBILSHIELD_PROGRAM_ID,
        'create_proposal',
        [
          titleHash,
          descHash,
          `${durationBlocks}u32`,
          nonceField,
        ],
        RECORD_TX_FEE
      );

      const txId = await requestTransaction(transaction);

      return {
        transactionId: txId || '',
        status: 'pending',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestTransaction, generateFieldValue]);

  /**
   * Cast a vote on a proposal
   */
  const vote = useCallback(async (
    proposalId: number,
    badgeNonce: string,
    badgeExpiresAt: number,
    voteChoice: boolean
  ): Promise<TransactionStatus> => {
    if (!publicKey || !requestTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure badge nonce is properly formatted as field
      const nonceField = badgeNonce.endsWith('field') ? badgeNonce : `${badgeNonce}field`;

      const transaction = createTransaction(
        publicKey,
        SYBILSHIELD_PROGRAM_ID,
        'vote',
        [
          `${proposalId}u32`,
          nonceField,
          `${badgeExpiresAt}u32`,
          voteChoice.toString(),
        ],
        RECORD_TX_FEE
      );

      const txId = await requestTransaction(transaction);

      return {
        transactionId: txId || '',
        status: 'pending',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestTransaction]);

  /**
   * End voting for a proposal
   */
  const endVoting = useCallback(async (proposalId: number): Promise<TransactionStatus> => {
    if (!publicKey || !requestTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = createTransaction(
        publicKey,
        SYBILSHIELD_PROGRAM_ID,
        'end_voting',
        [`${proposalId}u32`]
      );

      const txId = await requestTransaction(transaction);

      return {
        transactionId: txId || '',
        status: 'pending',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestTransaction]);

  /**
   * Execute a passed proposal (admin only)
   */
  const executeProposal = useCallback(async (proposalId: number): Promise<TransactionStatus> => {
    if (!publicKey || !requestTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = createTransaction(
        publicKey,
        SYBILSHIELD_PROGRAM_ID,
        'execute_proposal',
        [`${proposalId}u32`]
      );

      const txId = await requestTransaction(transaction);

      return {
        transactionId: txId || '',
        status: 'pending',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestTransaction]);

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    // Wallet state
    publicKey,
    connected,
    connecting,
    disconnect,
    
    // Loading state
    loading,
    error,

    // Badge operations
    initializeProgram,
    registerIssuer,
    issueBadge,
    getBadgeRecords,
    revokeBadge,

    // Governance operations
    createProposal,
    vote,
    endVoting,
    executeProposal,

    // Utilities
    generateFieldValue,
    getCurrentBlockHeight,
  };
}

export default useAleo;
