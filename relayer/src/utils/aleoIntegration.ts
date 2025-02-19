// ============================================================================
// SybilShield Relayer - Aleo Integration
// ============================================================================
// Utilities for interacting with the Aleo blockchain
// Handles badge issuance transactions via the deployed sybilshield_aio_v2.aleo contract
// Supports snarkos CLI execution with HTTP API fallback for read operations
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../config.js';
import { logger } from './logger.js';

const execAsync = promisify(exec);

// Cache snarkos availability check
let snarkosAvailable: boolean | null = null;

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
// Snarkos Availability Check
// ============================================================================

async function isSnarkosAvailable(): Promise<boolean> {
  if (snarkosAvailable !== null) return snarkosAvailable;
  try {
    await execAsync('snarkos --version', { timeout: 5000 });
    snarkosAvailable = true;
    logger.info('[Aleo] snarkos CLI is available');
  } catch {
    snarkosAvailable = false;
    logger.warn('[Aleo] snarkos CLI not found. On-chain transactions require snarkos.');
  }
  return snarkosAvailable;
}

// ============================================================================
// Aleo CLI Wrapper
// ============================================================================

/**
 * Execute an Aleo CLI command
 */
async function executeAleoCli(command: string): Promise<ContractCallResult> {
  const available = await isSnarkosAvailable();
  if (!available) {
    return {
      success: false,
      error: 'snarkos CLI is not installed. Install with: curl -sSf https://install.provable.com/aleo | sh',
    };
  }

  try {
    // Sanitize log output - don't log private keys
    const sanitizedCmd = command.replace(/--private-key\s+\S+/, '--private-key [REDACTED]');
    logger.info(`[Aleo] Executing: ${sanitizedCmd}`);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 180000, // 3 minute timeout for transactions
      env: {
        ...process.env,
        ALEO_PRIVATE_KEY: config.aleo.issuerPrivateKey,
      },
    });

    if (stderr && !stderr.includes('warning')) {
      logger.warn(`[Aleo] stderr: ${stderr}`);
    }

    logger.info(`[Aleo] Output: ${stdout.slice(0, 500)}`);

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
// HTTP API Helpers
// ============================================================================

/**
 * Get the base REST API URL for Aleo network queries
 */
function getApiBaseUrl(): string {
  const rpcUrl = config.aleo.rpcUrl;
  // Ensure URL ends with /v1 format for the explorer API
  if (rpcUrl.includes('/v1')) {
    return `${rpcUrl}/testnet`;
  }
  return `${rpcUrl.replace(/\/+$/, '')}/testnet`;
}

/**
 * Query a mapping value via HTTP API
 */
async function queryMapping(mappingName: string, key: string): Promise<string | null> {
  try {
    const url = `${getApiBaseUrl()}/program/${config.aleo.programId}/mapping/${mappingName}/${key}`;
    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      return text.replace(/^"|"$/g, '').trim();
    }
    return null;
  } catch (err) {
    logger.error(`[Aleo] HTTP mapping query failed for ${mappingName}/${key}:`, err);
    return null;
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
  
  const apiBase = getApiBaseUrl();
  const broadcastUrl = `${apiBase}/transaction/broadcast`;
  
  // Build the snarkos execute command
  const command = `snarkos developer execute ${config.aleo.programId} issue_badge "${recipientAddress}" ${proofField}field ${expiresAtBlock}u32 --private-key ${config.aleo.issuerPrivateKey} --query ${config.aleo.rpcUrl} --broadcast ${broadcastUrl} --priority-fee 10000`;

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
 * Check if a badge exists on chain via HTTP API
 * Queries the bdg_reg mapping
 */
export async function checkBadgeOnChain(badgeNonce: string): Promise<boolean> {
  try {
    const nonceKey = badgeNonce.endsWith('field') ? badgeNonce : `${badgeNonce}field`;
    const result = await queryMapping('bdg_reg', nonceKey);
    return result !== null && result !== 'null';
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

  const apiBase = getApiBaseUrl();
  const broadcastUrl = `${apiBase}/transaction/broadcast`;
  const command = `snarkos developer execute ${config.aleo.programId} init "${adminAddress}" --private-key ${config.aleo.issuerPrivateKey} --query ${config.aleo.rpcUrl} --broadcast ${broadcastUrl} --priority-fee 10000`;

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
  const apiBase = getApiBaseUrl();
  const broadcastUrl = `${apiBase}/transaction/broadcast`;
  const command = `snarkos developer execute ${config.aleo.programId} reg_issuer "${issuerAddress}" ${nameField}field --private-key ${config.aleo.issuerPrivateKey} --query ${config.aleo.rpcUrl} --broadcast ${broadcastUrl} --priority-fee 10000`;

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
 * Get current block height from Aleo network via HTTP API
 */
export async function getCurrentBlockHeight(): Promise<number> {
  try {
    const url = `${getApiBaseUrl()}/latest/height`;
    const response = await fetch(url);
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
  snarkosAvailable?: boolean;
}> {
  try {
    const height = await getCurrentBlockHeight();
    
    // Check if program is deployed via HTTP
    const programCheck = await fetch(`${getApiBaseUrl()}/program/${config.aleo.programId}`);
    const programDeployed = programCheck.ok;
    
    // Check snarkos availability
    const cliAvailable = await isSnarkosAvailable();

    return {
      connected: true,
      blockHeight: height,
      programDeployed,
      snarkosAvailable: cliAvailable,
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
