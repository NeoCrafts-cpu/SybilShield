// ============================================================================
// SybilShield Relayer - Configuration
// ============================================================================
// Loads and validates environment variables with type safety
// All config values are validated at startup to fail fast on misconfiguration
// ============================================================================

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// ============================================================================
// Environment Schema Definition
// ============================================================================

const envSchema = z.object({
  // Server
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Aleo Blockchain
  ALEO_RPC_URL: z.string().url().default('https://api.explorer.provable.com/v1'),
  ISSUER_PRIVATE_KEY: z.string().optional().default(''),
  ISSUER_ADDRESS: z.string().optional(),

  // Proof of Humanity
  POH_API_URL: z.string().url().optional().default('https://api.poh.dev/v1'),
  POH_API_KEY: z.string().optional().default(''),

  // Worldcoin
  WORLDCOIN_API_URL: z.string().url().optional().default('https://developer.worldcoin.org/api/v1'),
  WORLDCOIN_API_KEY: z.string().optional().default(''),
  WORLDCOIN_APP_ID: z.string().optional().default(''),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('10').transform(Number),

  // Security
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().optional().default('dev-secret-change-in-production'),

  // Demo Mode
  DEMO_MODE: z.string().default('true').transform((v) => v === 'true'),
});

// ============================================================================
// Parse and Validate Environment
// ============================================================================

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors
        .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      
      console.error('❌ Environment validation failed:\n' + formattedErrors);
      process.exit(1);
    }
    throw error;
  }
};

const env = parseEnv();

// ============================================================================
// Configuration Object
// ============================================================================

export const config = {
  // Server Configuration
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
    logLevel: env.LOG_LEVEL,
  },

  // Aleo Blockchain Configuration
  aleo: {
    rpcUrl: env.ALEO_RPC_URL,
    issuerPrivateKey: env.ISSUER_PRIVATE_KEY,
    issuerAddress: env.ISSUER_ADDRESS ?? '',
    programId: 'sybilshield_aio_v2.aleo',
    deployTxId: 'at10376kkr45n7k6pat7jt2g9knsy7wv4uyvs59glz0j2239snxaqyqjred3d',
  },

  // Proof of Humanity Configuration
  poh: {
    apiUrl: env.POH_API_URL,
    apiKey: env.POH_API_KEY,
  },

  // Worldcoin Configuration
  worldcoin: {
    apiUrl: env.WORLDCOIN_API_URL,
    apiKey: env.WORLDCOIN_API_KEY,
    appId: env.WORLDCOIN_APP_ID,
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Security Configuration
  security: {
    corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
    jwtSecret: env.JWT_SECRET,
  },

  // Demo Mode (for testing without real verification providers)
  demoMode: env.DEMO_MODE,

  // Badge Configuration
  badge: {
    // Default validity period: 1 year (in seconds, approximating blocks)
    defaultValiditySeconds: 31536000,
    // Minimum validity period: 1 day
    minValiditySeconds: 86400,
    // Maximum validity period: 2 years
    maxValiditySeconds: 63072000,
  },
} as const;

// ============================================================================
// Type Export
// ============================================================================

export type Config = typeof config;

// ============================================================================
// Validation Helper
// ============================================================================

export const validateConfig = (): boolean => {
  const errors: string[] = [];

  // Check critical configuration in production
  if (config.server.isProduction) {
    if (config.demoMode) {
      errors.push('DEMO_MODE should be false in production');
    }
    
    if (config.security.jwtSecret === 'dev-secret-change-in-production') {
      errors.push('JWT_SECRET must be changed in production');
    }

    if (!config.poh.apiKey && !config.worldcoin.apiKey) {
      errors.push('At least one verification provider API key is required in production');
    }
  }

  if (errors.length > 0) {
    console.error('⚠️ Configuration warnings:\n' + errors.map((e) => `  - ${e}`).join('\n'));
    return false;
  }

  return true;
};

export default config;
