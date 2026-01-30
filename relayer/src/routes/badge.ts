// ============================================================================
// SybilShield Relayer - Badge Routes
// ============================================================================
// Endpoints for badge issuance and status checking
// ============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { asyncHandler, ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import { createBadgeRateLimiter } from '../middleware/rateLimit.js';
import { demoModeBypass, isValidAleoAddress } from '../middleware/auth.js';
import { getVerificationById } from './verification.js';
import { generateNonce } from '../utils/crypto.js';
import { issueBadgeOnChain, calculateExpiryBlock } from '../utils/aleoIntegration.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';
import type { 
  BadgeIssuanceResponse,
  BadgeStatusResponse,
  BadgeRecord,
  SuccessResponse,
} from '../types.js';

// ============================================================================
// In-Memory Badge Store
// ============================================================================

// In production, replace with a proper database
const badgeStore = new Map<string, BadgeRecord>();

// ============================================================================
// Validation Schemas
// ============================================================================

const badgeIssuanceSchema = z.object({
  verification_id: z.string().uuid('Invalid verification ID format'),
  address: z.string().refine(isValidAleoAddress, 'Invalid Aleo address'),
  signature: z.string().optional(), // Optional in demo mode
});

// ============================================================================
// Router Setup
// ============================================================================

export const badgeRouter: Router = Router();

// ============================================================================
// POST /badge/request-issuance
// ============================================================================

badgeRouter.post(
  '/request-issuance',
  createBadgeRateLimiter(),
  demoModeBypass,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received badge issuance request');

    // Validate request body
    const validation = badgeIssuanceSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validation.error.errors }
      );
    }

    const { verification_id, address } = validation.data;

    // Check for existing badge for this address
    const existingBadge = Array.from(badgeStore.values()).find(
      (b) => b.address === address && b.status === 'active'
    );

    if (existingBadge) {
      throw new ConflictError('Badge already exists for this address');
    }

    // Get verification record
    const verification = getVerificationById(verification_id);

    if (!verification) {
      throw new NotFoundError('Verification');
    }

    // Validate verification
    if (verification.status !== 'verified') {
      throw new ValidationError(
        `Cannot issue badge: verification status is "${verification.status}"`
      );
    }

    if (verification.address !== address) {
      throw new ValidationError(
        'Address mismatch: verification was for a different address'
      );
    }

    if (verification.expiresAt < new Date()) {
      throw new ValidationError('Verification has expired');
    }

    // Generate badge data
    const badgeId = uuidv4();
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + config.badge.defaultValiditySeconds * 1000);
    
    // Get expiry block height from Aleo network
    const expiresAtBlockHeight = await calculateExpiryBlock(365);

    // Create badge record
    const badgeRecord: BadgeRecord = {
      id: badgeId,
      address,
      issuer: config.aleo.issuerAddress,
      proofHash: verification.proofHash,
      createdAt: new Date(),
      expiresAt,
      status: 'pending',
      nonce,
    };

    // Store badge as pending
    badgeStore.set(badgeId, badgeRecord);
    badgeStore.set(`addr:${address}`, badgeRecord);

    logger.info(`Badge record created for ${address}, ID: ${badgeId}`);

    // Issue badge on-chain (if not in demo mode)
    let transactionId: string | undefined;
    
    if (!config.demoMode) {
      logger.info(`[Badge] Issuing on-chain badge for ${address}`);
      
      const issueResult = await issueBadgeOnChain(
        address,
        verification.proofHash,
        expiresAtBlockHeight
      );

      if (!issueResult.success) {
        // Update badge status to failed
        badgeRecord.status = 'failed';
        badgeStore.set(badgeId, badgeRecord);
        badgeStore.set(`addr:${address}`, badgeRecord);
        
        throw new Error(`On-chain badge issuance failed: ${issueResult.error}`);
      }

      transactionId = issueResult.transactionId;
      badgeRecord.status = 'active';
      badgeStore.set(badgeId, badgeRecord);
      badgeStore.set(`addr:${address}`, badgeRecord);
      
      logger.info(`[Badge] On-chain badge issued. TX: ${transactionId}`);
    } else {
      // Demo mode: mark as active without on-chain transaction
      badgeRecord.status = 'active';
      badgeStore.set(badgeId, badgeRecord);
      badgeStore.set(`addr:${address}`, badgeRecord);
      transactionId = `demo_tx_${badgeId}`;
    }

    const response: SuccessResponse<BadgeIssuanceResponse> = {
      success: true,
      data: {
        badge_ready: true,
        badge_id: badgeId,
        transaction_id: transactionId,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        message: config.demoMode 
          ? 'Badge issued (Demo Mode)' 
          : `Badge issued on-chain. Transaction: ${transactionId}`,
      },
    };

    res.status(201).json(response);
  })
);

// ============================================================================
// GET /badge/status/:address
// ============================================================================

badgeRouter.get(
  '/status/:address',
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;

    if (!address || !isValidAleoAddress(address)) {
      throw new ValidationError('Invalid Aleo address');
    }

    // Look up badge by address
    const badge = badgeStore.get(`addr:${address}`);

    if (!badge) {
      const response: SuccessResponse<BadgeStatusResponse> = {
        success: true,
        data: {
          has_badge: false,
          badge_status: 'none',
          message: 'No badge found for this address',
        },
      };
      res.json(response);
      return;
    }

    // Check if badge has expired
    let status = badge.status;
    if (badge.expiresAt < new Date() && status === 'active') {
      status = 'expired';
      badge.status = 'expired';
      badgeStore.set(`addr:${address}`, badge);
    }

    const response: SuccessResponse<BadgeStatusResponse> = {
      success: true,
      data: {
        has_badge: true,
        badge_status: status,
        expires_at: Math.floor(badge.expiresAt.getTime() / 1000),
        issuer: badge.issuer,
        created_at: Math.floor(badge.createdAt.getTime() / 1000),
        message: `Badge is ${status}`,
      },
    };

    res.json(response);
  })
);

// ============================================================================
// POST /badge/renew (Future Implementation)
// ============================================================================

badgeRouter.post(
  '/renew',
  createBadgeRateLimiter(),
  demoModeBypass,
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.body as { address?: string };

    if (!address || !isValidAleoAddress(address)) {
      throw new ValidationError('Invalid Aleo address');
    }

    // Get existing badge
    const badge = badgeStore.get(`addr:${address}`);

    if (!badge) {
      throw new NotFoundError('Badge');
    }

    if (badge.status === 'revoked') {
      throw new ValidationError('Cannot renew a revoked badge');
    }

    // Update badge expiry
    const newExpiresAt = new Date(Date.now() + config.badge.defaultValiditySeconds * 1000);
    
    badge.expiresAt = newExpiresAt;
    badge.status = 'active';
    
    badgeStore.set(`addr:${address}`, badge);
    badgeStore.set(badge.id, badge);

    logger.info(`Badge renewed for ${address}`);

    const response: SuccessResponse<{
      renewed: boolean;
      new_expires_at: number;
      message: string;
    }> = {
      success: true,
      data: {
        renewed: true,
        new_expires_at: Math.floor(newExpiresAt.getTime() / 1000),
        message: 'Badge successfully renewed',
      },
    };

    res.json(response);
  })
);

// ============================================================================
// Helper: Get Badge by Address
// ============================================================================

export const getBadgeByAddress = (address: string): BadgeRecord | undefined => {
  return badgeStore.get(`addr:${address}`);
};

export default badgeRouter;
