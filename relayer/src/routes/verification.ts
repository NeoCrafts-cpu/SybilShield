// ============================================================================
// SybilShield Relayer - Verification Routes
// ============================================================================
// Endpoints for verifying user uniqueness via Proof of Humanity or Worldcoin
// ============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { createStrictRateLimiter } from '../middleware/rateLimit.js';
import { isValidAleoAddress } from '../middleware/auth.js';
import { verifyPoH, type PoHVerificationResult } from '../utils/pohIntegration.js';
import { verifyWorldcoin, type WorldcoinVerificationResult } from '../utils/worldcoinIntegration.js';
import { generateProofHash } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';
import type { 
  VerificationResponse, 
  VerificationRecord,
  SuccessResponse,
} from '../types.js';

// ============================================================================
// In-Memory Verification Store
// ============================================================================

// In production, replace with a proper database
const verificationStore = new Map<string, VerificationRecord>();

// ============================================================================
// Validation Schemas
// ============================================================================

const pohVerificationSchema = z.object({
  poh_profile_url: z.string().url('Invalid Proof of Humanity profile URL'),
  address: z.string().refine(isValidAleoAddress, 'Invalid Aleo address'),
});

const worldcoinVerificationSchema = z.object({
  worldcoin_token: z.string().min(1, 'Worldcoin token is required'),
  address: z.string().refine(isValidAleoAddress, 'Invalid Aleo address'),
  signal: z.string().optional(),
});

const livenessVerificationSchema = z.object({
  proof_hash: z.string().min(16, 'Invalid liveness proof hash'),
  address: z.string().refine(isValidAleoAddress, 'Invalid Aleo address'),
  timestamp: z.number().optional(),
});

// ============================================================================
// Router Setup
// ============================================================================

export const verificationRouter: Router = Router();

// Apply stricter rate limiting to verification endpoints
verificationRouter.use(createStrictRateLimiter());

// ============================================================================
// POST /verify/proof-of-humanity
// ============================================================================

verificationRouter.post(
  '/proof-of-humanity',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received PoH verification request');

    // Validate request body
    const validation = pohVerificationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validation.error.errors }
      );
    }

    const { poh_profile_url, address } = validation.data;

    // Check for existing verification for this address
    const existingVerification = Array.from(verificationStore.values()).find(
      (v) => v.address === address && v.status === 'verified' && v.expiresAt > new Date()
    );

    if (existingVerification) {
      const response: SuccessResponse<VerificationResponse> = {
        success: true,
        data: {
          verification_id: existingVerification.id,
          status: 'verified',
          proof_hash: existingVerification.proofHash,
          expires_at: Math.floor(existingVerification.expiresAt.getTime() / 1000),
          provider: 'proof_of_humanity',
          message: 'Already verified',
        },
      };
      res.json(response);
      return;
    }

    // Verify with Proof of Humanity
    let pohResult: PoHVerificationResult;
    
    try {
      pohResult = await verifyPoH(poh_profile_url);
    } catch (error) {
      logger.error('PoH verification failed:', error);
      throw new ValidationError('Failed to verify Proof of Humanity profile');
    }

    // Create verification record
    const verificationId = uuidv4();
    const expiresAt = new Date(Date.now() + config.badge.defaultValiditySeconds * 1000);
    
    // Generate proof hash from verification data
    const proofHash = generateProofHash({
      provider: 'proof_of_humanity',
      address,
      verificationData: pohResult.submissionTime.toString(),
      timestamp: Date.now(),
    });

    const verificationRecord: VerificationRecord = {
      id: verificationId,
      address,
      provider: 'proof_of_humanity',
      status: pohResult.registered ? 'verified' : 'rejected',
      proofHash,
      createdAt: new Date(),
      expiresAt,
      providerData: { pohResult },
    };

    // Store verification
    verificationStore.set(verificationId, verificationRecord);

    logger.info(`PoH verification ${verificationRecord.status} for ${address}`);

    const response: SuccessResponse<VerificationResponse> = {
      success: true,
      data: {
        verification_id: verificationId,
        status: verificationRecord.status,
        proof_hash: proofHash,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        provider: 'proof_of_humanity',
        message: pohResult.registered 
          ? 'Successfully verified via Proof of Humanity'
          : 'Proof of Humanity verification failed - not registered',
      },
    };

    res.status(pohResult.registered ? 200 : 400).json(response);
  })
);

// ============================================================================
// POST /verify/worldcoin
// ============================================================================

verificationRouter.post(
  '/worldcoin',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received Worldcoin verification request');

    // Validate request body
    const validation = worldcoinVerificationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validation.error.errors }
      );
    }

    const { worldcoin_token, address, signal } = validation.data;

    // Check for existing verification
    const existingVerification = Array.from(verificationStore.values()).find(
      (v) => v.address === address && v.status === 'verified' && v.expiresAt > new Date()
    );

    if (existingVerification) {
      const response: SuccessResponse<VerificationResponse> = {
        success: true,
        data: {
          verification_id: existingVerification.id,
          status: 'verified',
          proof_hash: existingVerification.proofHash,
          expires_at: Math.floor(existingVerification.expiresAt.getTime() / 1000),
          provider: 'worldcoin',
          message: 'Already verified',
        },
      };
      res.json(response);
      return;
    }

    // Verify with Worldcoin
    let worldcoinResult: WorldcoinVerificationResult;
    
    try {
      worldcoinResult = await verifyWorldcoin(worldcoin_token, signal ?? address);
    } catch (error) {
      logger.error('Worldcoin verification failed:', error);
      throw new ValidationError('Failed to verify Worldcoin proof');
    }

    // Create verification record
    const verificationId = uuidv4();
    const expiresAt = new Date(Date.now() + config.badge.defaultValiditySeconds * 1000);
    
    // Generate proof hash
    const proofHash = generateProofHash({
      provider: 'worldcoin',
      address,
      verificationData: worldcoinResult.nullifierHash,
      timestamp: Date.now(),
    });

    const verificationRecord: VerificationRecord = {
      id: verificationId,
      address,
      provider: 'worldcoin',
      status: worldcoinResult.verified ? 'verified' : 'rejected',
      proofHash,
      createdAt: new Date(),
      expiresAt,
      providerData: { worldcoinResult },
    };

    verificationStore.set(verificationId, verificationRecord);

    logger.info(`Worldcoin verification ${verificationRecord.status} for ${address}`);

    const response: SuccessResponse<VerificationResponse> = {
      success: true,
      data: {
        verification_id: verificationId,
        status: verificationRecord.status,
        proof_hash: proofHash,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        provider: 'worldcoin',
        message: worldcoinResult.verified
          ? 'Successfully verified via Worldcoin'
          : 'Worldcoin verification failed',
      },
    };

    res.status(worldcoinResult.verified ? 200 : 400).json(response);
  })
);

// ============================================================================
// POST /verify/liveness
// ============================================================================

verificationRouter.post(
  '/liveness',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received liveness verification request');

    // Validate request body
    const validation = livenessVerificationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid request body',
        { errors: validation.error.errors }
      );
    }

    const { proof_hash, address } = validation.data;

    // Check for existing verification for this address
    const existingVerification = Array.from(verificationStore.values()).find(
      (v) => v.address === address && v.status === 'verified' && v.expiresAt > new Date()
    );

    if (existingVerification) {
      const response: SuccessResponse<VerificationResponse> = {
        success: true,
        data: {
          verification_id: existingVerification.id,
          status: 'verified',
          proof_hash: existingVerification.proofHash,
          expires_at: Math.floor(existingVerification.expiresAt.getTime() / 1000),
          provider: 'liveness',
          message: 'Already verified',
        },
      };
      res.json(response);
      return;
    }

    // Validate the liveness proof hash
    // In a real implementation, this would validate the proof cryptographically
    // For now, we accept valid-looking hashes as the liveness check was done client-side
    const isValidProof = proof_hash.length >= 16 && /^[a-f0-9]+$/.test(proof_hash);

    if (!isValidProof) {
      throw new ValidationError('Invalid liveness proof');
    }

    // Create verification record
    const verificationId = uuidv4();
    const expiresAt = new Date(Date.now() + config.badge.defaultValiditySeconds * 1000);
    
    // Generate proof hash from verification data
    const serverProofHash = generateProofHash({
      provider: 'liveness',
      address,
      verificationData: proof_hash,
      timestamp: Date.now(),
    });

    const verificationRecord: VerificationRecord = {
      id: verificationId,
      address,
      provider: 'liveness',
      status: 'verified',
      proofHash: serverProofHash,
      createdAt: new Date(),
      expiresAt,
      providerData: { clientProofHash: proof_hash },
    };

    // Store verification
    verificationStore.set(verificationId, verificationRecord);

    logger.info(`Liveness verification successful for ${address}`);

    const response: SuccessResponse<VerificationResponse> = {
      success: true,
      data: {
        verification_id: verificationId,
        status: 'verified',
        proof_hash: serverProofHash,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        provider: 'liveness',
        message: 'Successfully verified via liveness check',
      },
    };

    res.status(200).json(response);
  })
);

// ============================================================================
// GET /verify/status/:verification_id
// ============================================================================

verificationRouter.get(
  '/status/:verification_id',
  asyncHandler(async (req: Request, res: Response) => {
    const { verification_id } = req.params;

    if (!verification_id) {
      throw new ValidationError('Verification ID is required');
    }

    const verification = verificationStore.get(verification_id);

    if (!verification) {
      throw new NotFoundError('Verification');
    }

    // Check if expired
    if (verification.expiresAt < new Date()) {
      verification.status = 'expired';
      verificationStore.set(verification_id, verification);
    }

    const response: SuccessResponse<{
      verification_id: string;
      status: string;
      expires_at: number;
      provider: string;
      message: string;
    }> = {
      success: true,
      data: {
        verification_id: verification.id,
        status: verification.status,
        expires_at: Math.floor(verification.expiresAt.getTime() / 1000),
        provider: verification.provider,
        message: `Verification status: ${verification.status}`,
      },
    };

    res.json(response);
  })
);

// ============================================================================
// Helper: Get Verification by ID
// ============================================================================

export const getVerificationById = (id: string): VerificationRecord | undefined => {
  return verificationStore.get(id);
};

export default verificationRouter;
