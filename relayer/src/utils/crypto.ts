// ============================================================================
// SybilShield Relayer - Cryptographic Utilities
// ============================================================================
// Provides cryptographic functions for signature verification and hashing
// ============================================================================

import { createHash, randomBytes } from 'crypto';
import { logger } from './logger.js';

// ============================================================================
// Types
// ============================================================================

interface ProofHashInput {
  provider: string;
  address: string;
  verificationData: string;
  timestamp: number;
}

// ============================================================================
// Signature Verification
// ============================================================================

/**
 * Verify an Aleo wallet signature
 * In production, this would use the Aleo SDK for proper verification
 * For demo purposes, we use a simplified verification
 */
export const verifySignature = async (
  address: string,
  _message: string,
  signature: string
): Promise<boolean> => {
  try {
    // TODO: Implement actual Aleo signature verification using @aleohq/sdk
    // For now, use a demo verification that checks signature format
    
    // Demo mode: Accept any properly formatted signature
    if (signature.length >= 64) {
      logger.debug(`Verified signature for ${address} (demo mode)`);
      return true;
    }
    
    // In production, use Aleo SDK:
    // import { Account } from '@aleohq/sdk';
    // const isValid = Account.verify(address, message, signature);
    // return isValid;
    
    return false;
  } catch (error) {
    logger.error('Signature verification failed:', error);
    return false;
  }
};

// ============================================================================
// Hash Functions
// ============================================================================

/**
 * Generate a proof hash for badge issuance
 * Simulates BHP256 hashing used in Leo contracts
 */
export const generateProofHash = (input: ProofHashInput): string => {
  const data = [
    input.provider,
    input.address,
    input.verificationData,
    input.timestamp.toString(),
  ].join('|');
  
  // Use SHA-256 as a stand-in for BHP256
  // In production, use actual BHP256 or Poseidon hash
  const hash = createHash('sha256').update(data).digest('hex');
  
  // Convert to field-compatible format (prepend with digit to ensure valid field)
  return `${hash}field`;
};

/**
 * Generate a BHP256-compatible hash
 */
export const bhp256Hash = (input: string): string => {
  // SHA-256 as stand-in for BHP256
  // In production, use the actual BHP256 implementation from Aleo SDK
  const hash = createHash('sha256').update(input).digest('hex');
  return hash;
};

/**
 * Hash an address for privacy
 */
export const hashAddress = (address: string): string => {
  return bhp256Hash(address);
};

// ============================================================================
// Nonce Generation
// ============================================================================

/**
 * Generate a unique nonce for badge identification
 */
export const generateNonce = (): string => {
  const bytes = randomBytes(32);
  const hex = bytes.toString('hex');
  // Format as Aleo field
  return `${hex}field`;
};

/**
 * Generate a random field element
 */
export const generateRandomField = (): string => {
  const bytes = randomBytes(31); // 31 bytes to stay within field bounds
  const hex = bytes.toString('hex');
  return hex;
};

// ============================================================================
// Address Utilities
// ============================================================================

/**
 * Convert an Ethereum address to a compatible format (if needed)
 */
export const normalizeAddress = (address: string): string => {
  // Aleo addresses start with 'aleo1'
  if (address.startsWith('aleo1')) {
    return address.toLowerCase();
  }
  
  throw new Error('Invalid Aleo address format');
};

/**
 * Create a nullifier from proposal ID and voter data
 * Used for preventing double-voting while maintaining privacy
 */
export const createVoteNullifier = (
  proposalId: number,
  voterAddress: string,
  badgeNonce: string
): string => {
  const input = `${proposalId}|${voterAddress}|${badgeNonce}`;
  const hash = bhp256Hash(input);
  return `${hash}field`;
};

// ============================================================================
// Message Signing (for creating signatures)
// ============================================================================

/**
 * Create a message for signing (standardized format)
 */
export const createSignableMessage = (
  action: string,
  data: Record<string, unknown>,
  timestamp: number
): string => {
  return JSON.stringify({
    action,
    data,
    timestamp,
    domain: 'sybilshield_aio_v2.aleo',
  });
};

// ============================================================================
// Encoding Utilities
// ============================================================================

/**
 * Encode a string to a field element
 */
export const stringToField = (str: string): string => {
  const hash = bhp256Hash(str);
  return `${hash}field`;
};

/**
 * Convert a number to a u32 representation
 */
export const toU32 = (num: number): string => {
  if (num < 0 || num > 4294967295) {
    throw new Error('Number out of u32 range');
  }
  return `${num}u32`;
};

export default {
  verifySignature,
  generateProofHash,
  bhp256Hash,
  hashAddress,
  generateNonce,
  generateRandomField,
  normalizeAddress,
  createVoteNullifier,
  createSignableMessage,
  stringToField,
  toU32,
};
