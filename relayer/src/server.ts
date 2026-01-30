// ============================================================================
// SybilShield Relayer - Express Server
// ============================================================================
// Main Express application setup with middleware, routes, and error handling
// ============================================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import config from './config.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { verificationRouter } from './routes/verification.js';
import { badgeRouter } from './routes/badge.js';
import { healthRouter } from './routes/health.js';
import { logger } from './utils/logger.js';
import type { ErrorResponse } from './types.js';

// ============================================================================
// Create Express Application
// ============================================================================

export const createApp = (): Express => {
  const app = express();

  // ========================================================================
  // Security Middleware
  // ========================================================================
  
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", config.aleo.rpcUrl],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      if (config.security.corsOrigins.includes(origin)) {
        callback(null, true);
      } else if (config.server.isDevelopment) {
        // Allow all origins in development
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address', 'X-Signature'],
  }));

  // ========================================================================
  // Body Parsing
  // ========================================================================
  
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ========================================================================
  // Logging
  // ========================================================================
  
  // Morgan for HTTP request logging
  const morganFormat = config.server.isProduction ? 'combined' : 'dev';
  app.use(morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
    skip: (req: Request) => {
      // Skip logging for health checks in production
      return config.server.isProduction && req.path === '/health';
    },
  }));

  // ========================================================================
  // Rate Limiting
  // ========================================================================
  
  // Apply rate limiting to all routes
  app.use(createRateLimiter());

  // ========================================================================
  // Request Utilities
  // ========================================================================
  
  // Add request timestamp
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.requestTime = Date.now();
    next();
  });

  // ========================================================================
  // API Routes
  // ========================================================================
  
  // Health check (no prefix)
  app.use('/', healthRouter);

  // API v1 routes
  const apiV1 = express.Router();
  
  // Verification endpoints
  apiV1.use('/verify', verificationRouter);
  
  // Badge endpoints
  apiV1.use('/badge', badgeRouter);

  // Mount API routes
  app.use('/api/v1', apiV1);
  
  // Also mount without version for backwards compatibility
  app.use('/verify', verificationRouter);
  app.use('/badge', badgeRouter);

  // ========================================================================
  // 404 Handler
  // ========================================================================
  
  app.use((_req: Request, res: Response) => {
    const response: ErrorResponse = {
      success: false,
      error: 'Not Found',
      code: 'NOT_FOUND',
    };
    res.status(404).json(response);
  });

  // ========================================================================
  // Error Handler
  // ========================================================================
  
  app.use(errorHandler);

  return app;
};

// ============================================================================
// Type Extensions
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      requestTime?: number;
      walletAddress?: string;
      verified?: boolean;
    }
  }
}

export default createApp;
