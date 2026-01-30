// ============================================================================
// SybilShield Relayer - Aleo Integration
// ============================================================================
// Utilities for interacting with the Aleo blockchain
// Handles badge issuance transactions via the deployed sybilshield_aio_v2.aleo contract
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../config.js';
import { logger } from './logger.js';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

export interface BadgeIssuanceResult {
  success: boolean;
  transactionId?: string;
  badgeNonce?: string;
  error?: string;
}

export interface ContractCallResult {
  success: boolean;
  output?: string;
  transactionId?: string;
  error?: string;
}

// ============================================================================
// Aleo CLI Wrapper
// ============================================================================

/**
 * Execute an Aleo CLI command
 */
async function executeAleoCli(command: string): Promise<ContractCallResult> {
  try {
    logger.info(`[Aleo] Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minute timeout for transactions
      env: {
        ...process.env,
        ALEO_PRIVATE_KEY: config.aleo.issuerPrivateKey,
      },
    });

    if (stderr && !stderr.includes('warning')) {
      logger.warn(`[Aleo] stderr: ${stderr}`);
    }

    logger.info(`[Aleo] Output: ${stdout}`);

    // Extract transaction ID from output
    const txMatch = stdout.match(/at1[a-z0-9]{58}/);
    const transactionId = txMatch ? txMatch[0] : undefined;

    return {
      success: true,
      output: stdout,
      transactionId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[Aleo] CLI Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// Badge Operations
// ============================================================================

/**
 * Issue a new SybilBadge on the Aleo blockchain
 * Calls the issue_badge transition on sybilshield_aio_v2.aleo
 * 
 * @param recipientAddress - Aleo address to receive the badge
 * @param proofHash - Hash of the verification proof
 * @param expiresAtBlock - Block height when badge expires
 */
export async function issueBadgeOnChain(
  recipientAddress: string,
  proofHash: string,
  expiresAtBlock: number
): Promise<BadgeIssuanceResult> {
  logger.info(`[Aleo] Issuing badge to ${recipientAddress}`);

  // Convert proof hash to field format
  const proofField = stringToField(proofHash);
  
  // Build the snarkos execute command
  const command = `snarkos developer execute ${config.aleo.programId} issue_badge "${recipientAddress}" ${proofField}field ${expiresAtBlock}u32 --private-key ${config.aleo.issuerPrivateKey} --query ${config.aleo.rpcUrl} --broadcast ${config.aleo.rpcUrl}/testnet/transaction/broadcast --priority-fee 10000`;

  const result = await executeAleoCli(command);

  if (result.success && result.transactionId) {
    // Extract badge nonce from output if available
    const nonceMatch = result.output?.match(/nonce:\s*(\d+field)/);
    const badgeNonce = nonceMatch ? nonceMatch[1] : undefined;

    return {
      success: true,
      transactionId: result.transactionId,
      badgeNonce,
    };
  }

  return {
    success: false,
    error: result.error || 'Failed to issue badge on chain',
  };
}

/**
 * Check if a badge exists on chain
 * Queries the badge_registry mapping
 */
export async function checkBadgeOnChain(badgeNonce: string): Promise<boolean> {
  try {
    const command = `snarkos developer query ${config.aleo.programId} bdg_reg ${badgeNonce} --query ${config.aleo.rpcUrl}`;
    const result = await executeAleoCli(command);
    
    return result.success && (result.output?.includes('BadgeData') ?? false);
  } catch {
    return false;
  }
}

/**
 * Initialize the contract (one-time setup)
 * Must be called by deployer to set admin
 */
export async function initializeContract(adminAddress: string): Promise<ContractCallResult> {
  logger.info(`[Aleo] Initializing contract with admin: ${adminAddress}`);

  const command = `snarkos developer execute ${config.aleo.programId} init "${adminAddress}" --private-key ${config.aleo.issuerPrivateKey} --query ${config.aleo.rpcUrl} --broadcast ${config.aleo.rpcUrl}/testnet/transaction/broadcast --priority-fee 10000`;

  return executeAleoCli(command);
}

/**
 * Register an issuer (admin only)
 */
export async function registerIssuer(
  issuerAddress: string,
  issuerName: string
): Promise<ContractCallResult> {
  logger.info(`[Aleo] Registering issuer: ${issuerAddress}`);

  const nameField = stringToField(issuerName);
  const command = `snarkos developer execute ${config.aleo.programId} reg_issuer "${issuerAddress}" ${nameField}field --private-key ${config.aleo.issuerPrivateKey} --query ${config.aleo.rpcUrl} --broadcast ${config.aleo.rpcUrl}/testnet/transaction/broadcast --priority-fee 10000`;

  return executeAleoCli(command);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a string to a field element (simplified hash)
 * In production, use proper cryptographic hashing
 */
function stringToField(input: string): string {
  // Simple hash: convert first 31 bytes to bigint (field max is ~253 bits)
  let hash = BigInt(0);
  const bytes = Buffer.from(input, 'utf8');
  
  for (let i = 0; i < Math.min(bytes.length, 31); i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      hash = hash * BigInt(256) + BigInt(byte);
    }
  }
  
  return hash.toString();
}

/**
 * Get current block height from Aleo network
 */
export async function getCurrentBlockHeight(): Promise<number> {
  try {
    const response = await fetch(`${config.aleo.rpcUrl}/testnet/latest/height`);
    const height = await response.json() as number | string;
    return typeof height === 'number' ? height : parseInt(String(height), 10);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Aleo] Failed to get block height:', errorMessage);
    // Return a fallback value
    return 1000000;
  }
}

/**
 * Calculate expiry block height (1 year from now)
 * Assumes ~1 block per second on Aleo
 */
export async function calculateExpiryBlock(daysFromNow: number = 365): Promise<number> {
  const currentHeight = await getCurrentBlockHeight();
  const blocksPerDay = 86400; // ~1 block/second
  return currentHeight + (blocksPerDay * daysFromNow);
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check Aleo network connectivity
 */
export async function checkAleoHealth(): Promise<{
  connected: boolean;
  blockHeight?: number;
  programDeployed?: boolean;
}> {
  try {
    const height = await getCurrentBlockHeight();
    
    // Check if program is deployed
    const programCheck = await fetch(`${config.aleo.rpcUrl}/testnet/program/${config.aleo.programId}`);
    const programDeployed = programCheck.ok;

    return {
      connected: true,
      blockHeight: height,
      programDeployed,
    };
  } catch {
    return {
      connected: false,
    };
  }
}

export default {
  issueBadgeOnChain,
  checkBadgeOnChain,
  initializeContract,
  registerIssuer,
  getCurrentBlockHeight,
  calculateExpiryBlock,
  checkAleoHealth,
};
