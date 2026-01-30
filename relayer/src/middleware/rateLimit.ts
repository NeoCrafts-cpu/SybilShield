// ============================================================================
// SybilShield Relayer - Rate Limiting Middleware
// ============================================================================
// Implements rate limiting to prevent abuse
// Default: 10 requests per minute per IP
// ============================================================================

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import config from '../config.js';
import type { ErrorResponse } from '../types.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Rate Limiter Configuration
// ============================================================================

export const createRateLimiter = () => {
  return rateLimit({
    // Window duration in milliseconds
    windowMs: config.rateLimit.windowMs,
    
    // Maximum requests per window per IP
    max: config.rateLimit.maxRequests,
    
    // Return rate limit headers
    standardHeaders: true,
    legacyHeaders: false,
    
    // Skip rate limiting for certain requests
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      if (req.path === '/health') {
        return true;
      }
      
      // Skip in test environment
      if (config.server.isTest) {
        return true;
      }
      
      return false;
    },
    
    // Key generator (use IP address)
    keyGenerator: (req: Request) => {
      // Use X-Forwarded-For header if behind proxy
      const forwardedFor = req.headers['x-forwarded-for'];
      if (typeof forwardedFor === 'string') {
        return forwardedFor.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
      }
      return req.ip ?? 'unknown';
    },
    
    // Handler for rate limited requests
    handler: (req: Request, res: Response) => {
      const ip = req.ip ?? 'unknown';
      logger.warn(`Rate limit exceeded for IP: ${ip}, path: ${req.path}`);
      
      const response: ErrorResponse = {
        success: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
        details: {
          retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
        },
      };
      
      res.status(429).json(response);
    },
  });
};

// ============================================================================
// Stricter Rate Limiter for Sensitive Endpoints
// ============================================================================

export const createStrictRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // Only 3 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    
    skip: (_req: Request) => config.server.isTest,
    
    keyGenerator: (req: Request) => {
      // Combine IP with wallet address for stricter limiting
      const ip = req.ip ?? 'unknown';
      const walletAddress = req.headers['x-wallet-address'] ?? '';
      return `${ip}:${walletAddress}`;
    },
    
    handler: (_req: Request, res: Response) => {
      const response: ErrorResponse = {
        success: false,
        error: 'Rate limit exceeded for this operation. Please wait before trying again.',
        code: 'RATE_LIMITED',
        details: {
          retryAfter: 60,
        },
      };
      
      res.status(429).json(response);
    },
  });
};

// ============================================================================
// Badge Issuance Rate Limiter (Very Strict)
// ============================================================================

export const createBadgeRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Only 5 badge requests per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    
    skip: () => config.server.isTest || config.demoMode,
    
    keyGenerator: (req: Request) => {
      const ip = req.ip ?? 'unknown';
      return `badge:${ip}`;
    },
    
    handler: (_req: Request, res: Response) => {
      const response: ErrorResponse = {
        success: false,
        error: 'Too many badge issuance requests. Please try again in an hour.',
        code: 'RATE_LIMITED',
        details: {
          retryAfter: 3600,
        },
      };
      
      res.status(429).json(response);
    },
  });
};

export default createRateLimiter;
