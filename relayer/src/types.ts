// ============================================================================
// SybilShield Relayer - TypeScript Types and Interfaces
// ============================================================================
// Central type definitions for the entire relayer application
// All types are exported for use throughout the codebase
// ============================================================================

// ============================================================================
// Verification Types
// ============================================================================

/**
 * Supported verification providers
 */
export type VerificationProvider = 'proof_of_humanity' | 'worldcoin' | 'liveness' | 'brightid';

/**
 * Verification status enum
 */
export type VerificationStatus = 
  | 'pending'      // Verification in progress
  | 'verified'     // Successfully verified
  | 'rejected'     // Verification failed
  | 'expired';     // Verification expired

/**
 * Request body for Proof of Humanity verification
 */
export interface PoHVerificationRequest {
  poh_profile_url: string;
  address: string;
}

/**
 * Request body for Worldcoin verification
 */
export interface WorldcoinVerificationRequest {
  worldcoin_token: string;
  address: string;
  signal?: string;
}

/**
 * Unified verification request (internal)
 */
export interface VerificationRequest {
  provider: VerificationProvider;
  address: string;
  providerData: Record<string, unknown>;
}

/**
 * Verification response returned to clients
 */
export interface VerificationResponse {
  verification_id: string;
  status: VerificationStatus;
  proof_hash: string;
  expires_at: number;
  provider: VerificationProvider;
  message: string;
}

/**
 * Internal verification record (stored in memory/database)
 */
export interface VerificationRecord {
  id: string;
  address: string;
  provider: VerificationProvider;
  status: VerificationStatus;
  proofHash: string;
  createdAt: Date;
  expiresAt: Date;
  providerData: Record<string, unknown>;
}

// ============================================================================
// Badge Types
// ============================================================================

/**
 * Badge status enum
 */
export type BadgeStatus = 
  | 'none'        // No badge exists
  | 'pending'     // Badge issuance in progress
  | 'active'      // Badge is valid and active
  | 'expired'     // Badge has expired
  | 'revoked'     // Badge was revoked
  | 'failed';     // Badge issuance failed

/**
 * Request body for badge issuance
 */
export interface BadgeIssuanceRequest {
  verification_id: string;
  address: string;
  signature: string;
}

/**
 * Leo program input for badge issuance
 */
export interface LeoBadgeInput {
  recipient: string;  // Aleo address
  issuer: string;     // Issuer Aleo address
  proof_hash: string; // Field representation
  expires_at: number; // Block height
}

/**
 * Badge issuance response
 */
export interface BadgeIssuanceResponse {
  badge_ready: boolean;
  badge_id?: string;
  transaction_id?: string;
  expires_at?: number;
  message: string;
}

/**
 * Badge status response
 */
export interface BadgeStatusResponse {
  has_badge: boolean;
  badge_status: BadgeStatus;
  expires_at?: number;
  issuer?: string;
  created_at?: number;
  message: string;
}

/**
 * Internal badge record
 */
export interface BadgeRecord {
  id: string;
  address: string;
  issuer: string;
  proofHash: string;
  createdAt: Date;
  expiresAt: Date;
  status: BadgeStatus;
  transactionId?: string;
  nonce: string;
}

// ============================================================================
// Proposal and Voting Types
// ============================================================================

/**
 * Proposal status enum
 */
export type ProposalStatus = 
  | 'active'     // Voting is ongoing
  | 'passed'     // Proposal passed (yes > no)
  | 'rejected'   // Proposal rejected (no >= yes)
  | 'executed'   // Proposal was executed
  | 'cancelled'; // Proposal was cancelled

/**
 * Proposal data (off-chain metadata)
 */
export interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;  // Hashed for privacy
  createdAt: number;
  endsAt: number;
  votesYes: number;
  votesNo: number;
  status: ProposalStatus;
}

/**
 * Vote submission request
 */
export interface VoteRequest {
  proposal_id: number;
  badge_nonce: string;
  vote_choice: boolean;  // true = yes, false = no
  signature: string;
}

/**
 * Vote response
 */
export interface VoteResponse {
  success: boolean;
  vote_recorded: boolean;
  message: string;
  transaction_id?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * Standard success response wrapper
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * API response union type
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: number;
  version: string;
  services: {
    aleo: 'connected' | 'disconnected';
    poh: 'connected' | 'disconnected' | 'not_configured';
    worldcoin: 'connected' | 'disconnected' | 'not_configured';
  };
}

// ============================================================================
// Request Extensions
// ============================================================================

/**
 * Extended Express Request with authentication data
 */
export interface AuthenticatedRequest {
  walletAddress?: string;
  signature?: string;
  verified?: boolean;
}

// ============================================================================
// Crypto Types
// ============================================================================

/**
 * Signature verification result
 */
export interface SignatureVerification {
  valid: boolean;
  address: string;
  message: string;
}

/**
 * Hash result with algorithm info
 */
export interface HashResult {
  hash: string;
  algorithm: 'BHP256' | 'SHA256' | 'POSEIDON';
  input: string;
}

// ============================================================================
// Provider Response Types
// ============================================================================

/**
 * Proof of Humanity API response
 */
export interface PoHApiResponse {
  registered: boolean;
  submissionTime?: number;
  name?: string;
  photo?: string;
  video?: string;
  status: 'None' | 'Vouching' | 'PendingRegistration' | 'Registered';
}

/**
 * Worldcoin API response
 */
export interface WorldcoinApiResponse {
  success: boolean;
  action: string;
  nullifier_hash: string;
  created_at: string;
}

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCodes = {
  // Validation Errors (400)
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INVALID_VERIFICATION_ID: 'INVALID_VERIFICATION_ID',
  INVALID_REQUEST_BODY: 'INVALID_REQUEST_BODY',
  
  // Authentication Errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  
  // Not Found Errors (404)
  VERIFICATION_NOT_FOUND: 'VERIFICATION_NOT_FOUND',
  BADGE_NOT_FOUND: 'BADGE_NOT_FOUND',
  PROPOSAL_NOT_FOUND: 'PROPOSAL_NOT_FOUND',
  
  // Conflict Errors (409)
  ALREADY_VERIFIED: 'ALREADY_VERIFIED',
  BADGE_ALREADY_EXISTS: 'BADGE_ALREADY_EXISTS',
  ALREADY_VOTED: 'ALREADY_VOTED',
  
  // Rate Limit Errors (429)
  RATE_LIMITED: 'RATE_LIMITED',
  
  // External Service Errors (502)
  POH_API_ERROR: 'POH_API_ERROR',
  WORLDCOIN_API_ERROR: 'WORLDCOIN_API_ERROR',
  ALEO_RPC_ERROR: 'ALEO_RPC_ERROR',
  
  // Internal Errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CRYPTO_ERROR: 'CRYPTO_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
