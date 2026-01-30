// ============================================================================
// SybilShield Relayer - Authentication Middleware
// ============================================================================
// Verifies wallet signatures for protected endpoints
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import { verifySignature } from '../utils/crypto.js';
import type { ErrorResponse } from '../types.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Signature Verification Middleware
// ============================================================================

/**
 * Middleware to verify Aleo wallet signatures
 * Requires headers:
 * - X-Wallet-Address: The Aleo address of the signer
 * - X-Signature: The signature of the request body
 */
export const requireSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    const signature = req.headers['x-signature'];

    // Check for required headers
    if (!walletAddress || typeof walletAddress !== 'string') {
      const response: ErrorResponse = {
        success: false,
        error: 'Missing X-Wallet-Address header',
        code: 'UNAUTHORIZED',
      };
      res.status(401).json(response);
      return;
    }

    if (!signature || typeof signature !== 'string') {
      const response: ErrorResponse = {
        success: false,
        error: 'Missing X-Signature header',
        code: 'UNAUTHORIZED',
      };
      res.status(401).json(response);
      return;
    }

    // Validate Aleo address format
    if (!isValidAleoAddress(walletAddress)) {
      const response: ErrorResponse = {
        success: false,
        error: 'Invalid Aleo address format',
        code: 'INVALID_ADDRESS',
      };
      res.status(400).json(response);
      return;
    }

    // Create message to verify (stringified body + timestamp)
    const timestamp = req.headers['x-timestamp'];
    const messageToVerify = JSON.stringify(req.body) + (timestamp ?? '');

    // Verify signature
    const isValid = await verifySignature(
      walletAddress,
      messageToVerify,
      signature
    );

    if (!isValid) {
      logger.warn(`Invalid signature from ${walletAddress}`);
      const response: ErrorResponse = {
        success: false,
        error: 'Invalid signature',
        code: 'SIGNATURE_MISMATCH',
      };
      res.status(401).json(response);
      return;
    }

    // Add verified data to request
    req.walletAddress = walletAddress;
    req.verified = true;

    logger.debug(`Verified signature from ${walletAddress}`);
    next();
  } catch (error) {
    logger.error('Signature verification error:', error);
    const response: ErrorResponse = {
      success: false,
      error: 'Signature verification failed',
      code: 'UNAUTHORIZED',
    };
    res.status(401).json(response);
  }
};

// ============================================================================
// Optional Signature Verification
// ============================================================================

/**
 * Optional signature verification - adds wallet info if present, but doesn't require it
 */
export const optionalSignature = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    const signature = req.headers['x-signature'];

    if (walletAddress && signature && 
        typeof walletAddress === 'string' && 
        typeof signature === 'string') {
      
      if (isValidAleoAddress(walletAddress)) {
        const timestamp = req.headers['x-timestamp'];
        const messageToVerify = JSON.stringify(req.body) + (timestamp ?? '');

        const isValid = await verifySignature(
          walletAddress,
          messageToVerify,
          signature
        );

        if (isValid) {
          req.walletAddress = walletAddress;
          req.verified = true;
        }
      }
    }

    next();
  } catch {
    // Ignore errors in optional verification
    next();
  }
};

// ============================================================================
// Address Validation
// ============================================================================

/**
 * Check if a string is a valid Aleo address
 * Aleo addresses start with 'aleo1' and are 63 characters long
 */
export const isValidAleoAddress = (address: string): boolean => {
  // Aleo address format: aleo1 + 58 bech32 characters = 63 total
  const aleoAddressRegex = /^aleo1[a-z0-9]{58}$/;
  return aleoAddressRegex.test(address);
};

// ============================================================================
// Demo Mode Bypass
// ============================================================================

import config from '../config.js';

/**
 * In demo mode, allow requests without signature verification
 */
export const demoModeBypass = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (config.demoMode) {
    // In demo mode, use the address from body if provided
    const bodyAddress = (req.body as Record<string, unknown>)?.address;
    if (typeof bodyAddress === 'string' && isValidAleoAddress(bodyAddress)) {
      req.walletAddress = bodyAddress;
      req.verified = true;
    }
    next();
    return;
  }

  // In production, require signature
  requireSignature(req, res, next);
};

export default requireSignature;
