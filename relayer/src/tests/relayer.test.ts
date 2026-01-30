// ============================================================================
// SybilShield Relayer - Jest Tests
// ============================================================================
// Comprehensive test suite for all relayer endpoints
// Run with: pnpm test
// ============================================================================

import request from 'supertest';
import { createApp } from '../server.js';
import type { Express } from 'express';

// ============================================================================
// Test Setup
// ============================================================================

let app: Express;

beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DEMO_MODE = 'true';
  process.env.ISSUER_PRIVATE_KEY = 'APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH';
  
  app = createApp();
});

// ============================================================================
// Test Data
// ============================================================================

const validAleoAddress = 'aleo1az8p9vlllyqwtj0c2g9svkd0e5v0p3zzdflwwrpa7kpe8xrfxgfqqpru7m';
const invalidAleoAddress = 'invalid_address';
const validPoHUrl = 'https://app.proofofhumanity.id/profile/0x1234567890123456789012345678901234567890';

// ============================================================================
// Health Check Tests
// ============================================================================

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.services).toBeDefined();
      expect(response.body.data.services.aleo).toBeDefined();
    });

    it('should include response time', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.data.responseTime).toBeDefined();
      expect(typeof response.body.data.responseTime).toBe('number');
    });

    it('should indicate demo mode status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.data.demoMode).toBe(true);
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 for liveness probe', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 for readiness probe', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
    });
  });
});

// ============================================================================
// Verification Endpoint Tests
// ============================================================================

describe('Verification Endpoints', () => {
  describe('POST /verify/proof-of-humanity', () => {
    it('should accept valid PoH verification request', async () => {
      const response = await request(app)
        .post('/verify/proof-of-humanity')
        .send({
          poh_profile_url: validPoHUrl,
          address: validAleoAddress,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verification_id).toBeDefined();
      expect(response.body.data.status).toBe('verified');
      expect(response.body.data.proof_hash).toBeDefined();
      expect(response.body.data.provider).toBe('proof_of_humanity');
    });

    it('should reject invalid Aleo address', async () => {
      const response = await request(app)
        .post('/verify/proof-of-humanity')
        .send({
          poh_profile_url: validPoHUrl,
          address: invalidAleoAddress,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid PoH URL', async () => {
      const response = await request(app)
        .post('/verify/proof-of-humanity')
        .send({
          poh_profile_url: 'not-a-url',
          address: validAleoAddress,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/verify/proof-of-humanity')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return existing verification for same address', async () => {
      // First request
      await request(app)
        .post('/verify/proof-of-humanity')
        .send({
          poh_profile_url: validPoHUrl,
          address: validAleoAddress,
        });

      // Second request should return existing
      const response = await request(app)
        .post('/verify/proof-of-humanity')
        .send({
          poh_profile_url: validPoHUrl,
          address: validAleoAddress,
        })
        .expect(200);

      expect(response.body.data.message).toContain('Already verified');
    });
  });

  describe('POST /verify/worldcoin', () => {
    it('should accept valid Worldcoin verification request', async () => {
      const response = await request(app)
        .post('/verify/worldcoin')
        .send({
          worldcoin_token: 'valid_token_12345678901234567890123456789012345678901234567890',
          address: 'aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verification_id).toBeDefined();
      expect(response.body.data.status).toBe('verified');
      expect(response.body.data.provider).toBe('worldcoin');
    });

    it('should reject empty Worldcoin token', async () => {
      const response = await request(app)
        .post('/verify/worldcoin')
        .send({
          worldcoin_token: '',
          address: validAleoAddress,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid address format', async () => {
      const response = await request(app)
        .post('/verify/worldcoin')
        .send({
          worldcoin_token: 'valid_token',
          address: '0x1234', // Ethereum format, not Aleo
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /verify/status/:verification_id', () => {
    it('should return verification status for valid ID', async () => {
      // First, create a verification
      const createResponse = await request(app)
        .post('/verify/proof-of-humanity')
        .send({
          poh_profile_url: validPoHUrl,
          address: 'aleo1uxl69laseuv3876ksh8k0nd7tvpgjt6ccrgccedpjk9qwyfensxst9ftg5',
        });

      const verificationId = createResponse.body.data.verification_id;

      // Then check status
      const response = await request(app)
        .get(`/verify/status/${verificationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verification_id).toBe(verificationId);
      expect(response.body.data.status).toBeDefined();
    });

    it('should return 404 for non-existent verification ID', async () => {
      const response = await request(app)
        .get('/verify/status/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });
});

// ============================================================================
// Badge Endpoint Tests
// ============================================================================

describe('Badge Endpoints', () => {
  let verificationId: string;

  beforeAll(async () => {
    // Create a verification for badge tests
    const response = await request(app)
      .post('/verify/proof-of-humanity')
      .send({
        poh_profile_url: validPoHUrl,
        address: 'aleo1y9mnptjc23wxhvzz96lgjaa6t5c63fj8ree3l6n0zzwsvjkj0cgqf8emit',
      });

    verificationId = response.body.data.verification_id;
  });

  describe('POST /badge/request-issuance', () => {
    it('should issue badge for valid verification', async () => {
      const response = await request(app)
        .post('/badge/request-issuance')
        .send({
          verification_id: verificationId,
          address: 'aleo1y9mnptjc23wxhvzz96lgjaa6t5c63fj8ree3l6n0zzwsvjkj0cgqf8emit',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.badge_ready).toBe(true);
      expect(response.body.data.leo_input).toBeDefined();
      expect(response.body.data.leo_input.recipient).toBeDefined();
      expect(response.body.data.leo_input.proof_hash).toBeDefined();
    });

    it('should reject invalid verification ID format', async () => {
      const response = await request(app)
        .post('/badge/request-issuance')
        .send({
          verification_id: 'not-a-uuid',
          address: validAleoAddress,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject non-existent verification ID', async () => {
      const response = await request(app)
        .post('/badge/request-issuance')
        .send({
          verification_id: '00000000-0000-0000-0000-000000000000',
          address: validAleoAddress,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should reject mismatched address', async () => {
      const response = await request(app)
        .post('/badge/request-issuance')
        .send({
          verification_id: verificationId,
          address: validAleoAddress, // Different from verification
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate badge for same address', async () => {
      // First badge already created in first test
      const response = await request(app)
        .post('/badge/request-issuance')
        .send({
          verification_id: verificationId,
          address: 'aleo1y9mnptjc23wxhvzz96lgjaa6t5c63fj8ree3l6n0zzwsvjkj0cgqf8emit',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('CONFLICT');
    });
  });

  describe('GET /badge/status/:address', () => {
    it('should return badge status for address with badge', async () => {
      const response = await request(app)
        .get('/badge/status/aleo1y9mnptjc23wxhvzz96lgjaa6t5c63fj8ree3l6n0zzwsvjkj0cgqf8emit')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.has_badge).toBe(true);
      expect(response.body.data.badge_status).toBe('active');
      expect(response.body.data.expires_at).toBeDefined();
    });

    it('should return no badge for address without badge', async () => {
      const response = await request(app)
        .get('/badge/status/aleo1wyvu96dvv0auq9e4qme54kjuhzglyfcf576h0g3nrrmrmr0505pqd6wnry')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.has_badge).toBe(false);
      expect(response.body.data.badge_status).toBe('none');
    });

    it('should reject invalid address format', async () => {
      const response = await request(app)
        .get('/badge/status/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Error Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown/route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('should handle invalid JSON body', async () => {
    const response = await request(app)
      .post('/verify/proof-of-humanity')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should include CORS headers', async () => {
    const response = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:3000')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });
});

// ============================================================================
// API Versioning Tests
// ============================================================================

describe('API Versioning', () => {
  it('should respond on /api/v1 prefix', async () => {
    const response = await request(app)
      .post('/api/v1/verify/proof-of-humanity')
      .send({
        poh_profile_url: validPoHUrl,
        address: 'aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should also work without /api/v1 prefix', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});

// ============================================================================
// Security Tests
// ============================================================================

describe('Security', () => {
  it('should include security headers', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });

  it('should reject oversized request bodies', async () => {
    const largeBody = { data: 'x'.repeat(100000) };
    
    await request(app)
      .post('/verify/proof-of-humanity')
      .send(largeBody)
      .expect(413);
  });
});
