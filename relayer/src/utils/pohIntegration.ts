// ============================================================================
// SybilShield Relayer - Proof of Humanity Integration
// ============================================================================
// Verifies users via Proof of Humanity protocol
// https://proofofhumanity.id/
// ============================================================================

import axios from 'axios';
import config from '../config.js';
import { logger } from './logger.js';

// ============================================================================
// Types
// ============================================================================

export interface PoHVerificationResult {
  registered: boolean;
  submissionTime: number;
  status: 'None' | 'Vouching' | 'PendingRegistration' | 'Registered';
  address: string | null;
  name: string | null;
}

interface PoHSubgraphResponse {
  data: {
    submission: {
      registered: boolean;
      submissionTime: string;
      status: string;
      name: string | null;
    } | null;
  };
}

// ============================================================================
// Proof of Humanity Verification
// ============================================================================

/**
 * Verify a Proof of Humanity profile
 * @param profileUrl - The PoH profile URL (e.g., https://app.proofofhumanity.id/profile/0x...)
 */
export const verifyPoH = async (profileUrl: string): Promise<PoHVerificationResult> => {
  // In demo mode, return mock data
  if (config.demoMode) {
    return mockPoHVerification(profileUrl);
  }

  try {
    // Extract address from profile URL
    const address = extractAddressFromUrl(profileUrl);
    
    if (!address) {
      throw new Error('Could not extract address from PoH profile URL');
    }

    // Query PoH subgraph
    const result = await queryPoHSubgraph(address);
    
    return result;
  } catch (error) {
    logger.error('PoH verification error:', error);
    throw error;
  }
};

/**
 * Extract Ethereum address from PoH profile URL
 */
const extractAddressFromUrl = (url: string): string | null => {
  // Handle different URL formats
  // https://app.proofofhumanity.id/profile/0x...
  // https://app.poh.dev/profile/0x...
  
  const patterns = [
    /profile\/(0x[a-fA-F0-9]{40})/i,
    /address=(0x[a-fA-F0-9]{40})/i,
    /(0x[a-fA-F0-9]{40})/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1].toLowerCase();
    }
  }

  return null;
};

/**
 * Query the Proof of Humanity subgraph
 */
const queryPoHSubgraph = async (address: string): Promise<PoHVerificationResult> => {
  const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/kleros/proof-of-humanity-mainnet';
  
  const query = `
    query GetSubmission($id: ID!) {
      submission(id: $id) {
        registered
        submissionTime
        status
        name
      }
    }
  `;

  try {
    const response = await axios.post<PoHSubgraphResponse>(
      subgraphUrl,
      {
        query,
        variables: { id: address.toLowerCase() },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const submission = response.data.data.submission;

    if (!submission) {
      return {
        registered: false,
        submissionTime: 0,
        status: 'None',
        address,
        name: null,
      };
    }

    return {
      registered: submission.registered,
      submissionTime: parseInt(submission.submissionTime, 10),
      status: submission.status as PoHVerificationResult['status'],
      address,
      name: submission.name,
    };
  } catch (error) {
    logger.error('PoH subgraph query failed:', error);
    throw new Error('Failed to query Proof of Humanity');
  }
};

// ============================================================================
// Mock Implementation for Demo Mode
// ============================================================================

const mockPoHVerification = (profileUrl: string): PoHVerificationResult => {
  logger.info(`[DEMO] Mock PoH verification for: ${profileUrl}`);
  
  // Extract address for mock data
  const address = extractAddressFromUrl(profileUrl) ?? '0x0000000000000000000000000000000000000000';
  
  // Simulate successful verification
  return {
    registered: true,
    submissionTime: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    status: 'Registered',
    address,
    name: 'Demo User',
  };
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a PoH profile URL is valid
 */
export const isValidPoHProfileUrl = (url: string): boolean => {
  const validHosts = [
    'app.proofofhumanity.id',
    'proofofhumanity.id',
    'app.poh.dev',
    'poh.dev',
  ];

  try {
    const parsedUrl = new URL(url);
    return validHosts.includes(parsedUrl.host);
  } catch {
    return false;
  }
};

export default {
  verifyPoH,
  isValidPoHProfileUrl,
};
