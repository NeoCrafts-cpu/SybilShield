// ============================================================================
// SybilShield Relayer - Health Check Routes
// ============================================================================
// Endpoint for service health monitoring
// ============================================================================

import { Router, Request, Response } from 'express';
import axios from 'axios';

import { asyncHandler } from '../middleware/errorHandler.js';
import config from '../config.js';
import { logger } from '../utils/logger.js';
import type { HealthResponse, SuccessResponse } from '../types.js';

// ============================================================================
// Router Setup
// ============================================================================

export const healthRouter: Router = Router();

// ============================================================================
// GET /health
// ============================================================================

healthRouter.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const startTime = Date.now();
    
    // Check Aleo RPC connectivity
    let aleoStatus: 'connected' | 'disconnected' = 'disconnected';
    try {
      const response = await axios.get(`${config.aleo.rpcUrl}/testnet/latest/height`, {
        timeout: 5000,
      });
      if (response.status === 200) {
        aleoStatus = 'connected';
      }
    } catch (error) {
      logger.debug('Aleo RPC health check failed:', error);
    }

    // Check PoH API (if configured)
    let pohStatus: 'connected' | 'disconnected' | 'not_configured' = 'not_configured';
    if (config.poh.apiKey) {
      try {
        // In demo mode, just mark as connected
        pohStatus = config.demoMode ? 'connected' : 'disconnected';
        // TODO: Add actual PoH API health check
      } catch {
        pohStatus = 'disconnected';
      }
    }

    // Check Worldcoin API (if configured)
    let worldcoinStatus: 'connected' | 'disconnected' | 'not_configured' = 'not_configured';
    if (config.worldcoin.apiKey) {
      try {
        worldcoinStatus = config.demoMode ? 'connected' : 'disconnected';
        // TODO: Add actual Worldcoin API health check
      } catch {
        worldcoinStatus = 'disconnected';
      }
    }

    // Determine overall status
    let status: 'ok' | 'degraded' | 'error' = 'ok';
    
    if (aleoStatus === 'disconnected') {
      status = 'degraded';
    }
    
    if (aleoStatus === 'disconnected' && 
        pohStatus === 'disconnected' && 
        worldcoinStatus === 'disconnected') {
      status = 'error';
    }

    // In demo mode, always report ok
    if (config.demoMode) {
      status = 'ok';
      aleoStatus = 'connected';
      pohStatus = 'connected';
      worldcoinStatus = 'connected';
    }

    const healthData: HealthResponse = {
      status,
      timestamp: Date.now(),
      version: '1.0.0',
      services: {
        aleo: aleoStatus,
        poh: pohStatus,
        worldcoin: worldcoinStatus,
      },
    };

    const response: SuccessResponse<HealthResponse & { responseTime: number; demoMode: boolean }> = {
      success: true,
      data: {
        ...healthData,
        responseTime: Date.now() - startTime,
        demoMode: config.demoMode,
      },
    };

    // Return appropriate status code
    const statusCode = status === 'ok' ? 200 : status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(response);
  })
);

// ============================================================================
// GET /health/live - Kubernetes liveness probe
// ============================================================================

healthRouter.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// ============================================================================
// GET /health/ready - Kubernetes readiness probe
// ============================================================================

healthRouter.get('/health/ready', (_req: Request, res: Response) => {
  // Check if essential services are ready
  // For now, always ready
  res.status(200).json({ status: 'ready' });
});

export default healthRouter;
