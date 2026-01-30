// ============================================================================
// SybilShield Relayer - Error Handler Middleware
// ============================================================================
// Global error handling for the Express application
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import type { ErrorResponse } from '../types.js';
import { logger } from '../utils/logger.js';
import config from '../config.js';

// ============================================================================
// Custom Error Classes
// ============================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60) {
    super('Rate limit exceeded', 429, 'RATE_LIMITED', { retryAfter });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service error: ${service}`,
      502,
      `${service.toUpperCase()}_ERROR`,
      originalError ? { originalMessage: originalError.message } : undefined
    );
  }
}

// ============================================================================
// Error Handler Middleware
// ============================================================================

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  // Handle known AppError types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof SyntaxError && 'body' in err) {
    // Handle JSON parse errors
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  } else if (err.name === 'ValidationError') {
    // Handle Zod validation errors
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  }

  // Log the error
  const logData = {
    path: req.path,
    method: req.method,
    statusCode,
    code,
    message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  if (statusCode >= 500) {
    logger.error('Server error:', logData);
  } else {
    logger.warn('Client error:', logData);
  }

  // Build error response
  const response: ErrorResponse = {
    success: false,
    error: message,
    code,
  };

  // Include details in development mode or if explicitly set
  if (details || config.server.isDevelopment) {
    response.details = {
      ...details,
      ...(config.server.isDevelopment && err.stack 
        ? { stack: err.stack.split('\n') } 
        : {}),
    };
  }

  res.status(statusCode).json(response);
};

// ============================================================================
// Async Handler Wrapper
// ============================================================================

/**
 * Wraps async route handlers to catch errors and pass them to error handler
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
