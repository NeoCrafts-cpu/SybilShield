// ============================================================================
// SybilShield Relayer - Logger Utility
// ============================================================================
// Provides consistent logging across the application using Winston
// ============================================================================

import winston from 'winston';
import config from '../config.js';

// ============================================================================
// Log Format
// ============================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length 
      ? JSON.stringify(meta, null, 2) 
      : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length 
      ? '\n' + JSON.stringify(meta, null, 2) 
      : '';
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

// ============================================================================
// Logger Instance
// ============================================================================

export const logger = winston.createLogger({
  level: config.server.logLevel,
  format: logFormat,
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// ============================================================================
// Add File Transport in Production
// ============================================================================

if (config.server.isProduction) {
  // Error logs
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined logs
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

// ============================================================================
// HTTP Request Logging Level
// ============================================================================

// Add http level for Morgan integration
logger.add(
  new winston.transports.Console({
    level: 'http',
    format: winston.format.combine(
      winston.format.colorize({ colors: { http: 'magenta' } }),
      winston.format.printf(({ message }) => message as string)
    ),
  })
);

// ============================================================================
// Export Default
// ============================================================================

export default logger;
