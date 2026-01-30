// ============================================================================
// SybilShield Relayer - Worldcoin Integration
// ============================================================================
// Verifies users via Worldcoin World ID protocol
// https://worldcoin.org/world-id
// ============================================================================

import axios from 'axios';
import config from '../config.js';
import { logger } from './logger.js';

// ============================================================================
// Types
// ============================================================================

export interface WorldcoinVerificationResult {
  verified: boolean;
  nullifierHash: string;
  merkleRoot: string;
  credentialType: 'orb' | 'phone';
  action: string;
}

interface WorldcoinVerifyRequest {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string;
  action: string;
  signal?: string;
}

interface WorldcoinVerifyResponse {
  success: boolean;
  action: string;
  nullifier_hash: string;
  created_at: string;
}

// ============================================================================
// Worldcoin Verification
// ============================================================================

/**
 * Verify a Worldcoin World ID proof
 * @param idToken - The Worldcoin ID token/proof
 * @param signal - The signal (usually user's address) that was signed
 */
export const verifyWorldcoin = async (
  idToken: string,
  signal: string
): Promise<WorldcoinVerificationResult> => {
  // In demo mode, return mock data
  if (config.demoMode) {
    return mockWorldcoinVerification(idToken, signal);
  }

  try {
    // Parse the ID token (contains proof data)
    const proofData = parseIdToken(idToken);
    
    // Verify with Worldcoin Developer Portal
    const result = await verifyWithWorldcoinApi(proofData, signal);
    
    return result;
  } catch (error) {
    logger.error('Worldcoin verification error:', error);
    throw error;
  }
};

/**
 * Parse Worldcoin ID token to extract proof data
 */
const parseIdToken = (idToken: string): WorldcoinVerifyRequest => {
  try {
    // ID token can be JSON or a JWT-like structure
    if (idToken.startsWith('{')) {
      const parsed = JSON.parse(idToken) as WorldcoinVerifyRequest;
      return parsed;
    }
    
    // Handle JWT format
    const parts = idToken.split('.');
    if (parts.length === 3 && parts[1]) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString()) as WorldcoinVerifyRequest;
      return payload;
    }
    
    throw new Error('Invalid ID token format');
  } catch (error) {
    logger.error('Failed to parse Worldcoin ID token:', error);
    throw new Error('Invalid Worldcoin ID token format');
  }
};

/**
 * Verify proof with Worldcoin Developer Portal API
 */
const verifyWithWorldcoinApi = async (
  proofData: WorldcoinVerifyRequest,
  signal: string
): Promise<WorldcoinVerificationResult> => {
  const verifyUrl = `${config.worldcoin.apiUrl}/verify/${config.worldcoin.appId}`;
  
  const requestBody = {
    merkle_root: proofData.merkle_root,
    nullifier_hash: proofData.nullifier_hash,
    proof: proofData.proof,
    verification_level: proofData.verification_level ?? 'orb',
    action: proofData.action ?? 'sybilshield_verify',
    signal,
  };

  try {
    const response = await axios.post<WorldcoinVerifyResponse>(
      verifyUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.worldcoin.apiKey}`,
        },
        timeout: 10000,
      }
    );

    if (response.data.success) {
      return {
        verified: true,
        nullifierHash: response.data.nullifier_hash,
        merkleRoot: proofData.merkle_root,
        credentialType: proofData.verification_level === 'orb' ? 'orb' : 'phone',
        action: response.data.action,
      };
    }

    return {
      verified: false,
      nullifierHash: '',
      merkleRoot: '',
      credentialType: 'phone',
      action: '',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error('Worldcoin API error:', error.response?.data);
      
      // Handle specific error codes
      if (error.response?.status === 400) {
        throw new Error('Invalid Worldcoin proof');
      }
      if (error.response?.status === 401) {
        throw new Error('Worldcoin API authentication failed');
      }
    }
    
    throw new Error('Failed to verify with Worldcoin');
  }
};

// ============================================================================
// Mock Implementation for Demo Mode
// ============================================================================

const mockWorldcoinVerification = (
  idToken: string,
  signal: string
): WorldcoinVerificationResult => {
  logger.info(`[DEMO] Mock Worldcoin verification for signal: ${signal}`);
  
  // Generate mock nullifier hash
  const mockNullifierHash = `0x${Buffer.from(signal + idToken).toString('hex').slice(0, 64)}`;
  
  // Simulate successful verification
  return {
    verified: true,
    nullifierHash: mockNullifierHash,
    merkleRoot: '0x' + '1'.repeat(64),
    credentialType: 'orb',
    action: 'sybilshield_verify',
  };
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate Worldcoin nullifier hash format
 */
export const isValidNullifierHash = (hash: string): boolean => {
  // Nullifier hash should be a 256-bit hex string (64 chars + 0x prefix)
  const pattern = /^0x[a-fA-F0-9]{64}$/;
  return pattern.test(hash);
};

/**
 * Check if a credential type is valid
 */
export const isValidCredentialType = (type: string): type is 'orb' | 'phone' => {
  return type === 'orb' || type === 'phone';
};

export default {
  verifyWorldcoin,
  isValidNullifierHash,
  isValidCredentialType,
};
