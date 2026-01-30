# SybilShield Relayer

Off-chain verification and badge issuance relayer for the SybilShield project.

## Overview

The relayer bridges identity verification providers (Proof of Humanity, Worldcoin) with the Aleo blockchain. It:

1. Accepts verification requests from users
2. Verifies uniqueness via external providers
3. Generates cryptographic proofs for badge issuance
4. Returns Leo program inputs for on-chain badge minting

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start development server
pnpm dev

# Run tests
pnpm test
```

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

### Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verify/proof-of-humanity` | Verify via PoH |
| POST | `/verify/worldcoin` | Verify via Worldcoin |
| GET | `/verify/status/:id` | Check verification status |

### Badge

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/badge/request-issuance` | Request badge minting |
| GET | `/badge/status/:address` | Check badge status |
| POST | `/badge/renew` | Renew expired badge |

## Request/Response Examples

### Verify via Proof of Humanity

```bash
curl -X POST http://localhost:5000/verify/proof-of-humanity \
  -H "Content-Type: application/json" \
  -d '{
    "poh_profile_url": "https://app.proofofhumanity.id/profile/0x...",
    "address": "aleo1..."
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "verification_id": "uuid-here",
    "status": "verified",
    "proof_hash": "abc123field",
    "expires_at": 1735689600,
    "provider": "proof_of_humanity",
    "message": "Successfully verified"
  }
}
```

### Request Badge Issuance

```bash
curl -X POST http://localhost:5000/badge/request-issuance \
  -H "Content-Type: application/json" \
  -d '{
    "verification_id": "uuid-here",
    "address": "aleo1..."
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "badge_ready": true,
    "leo_input": {
      "recipient": "aleo1...",
      "issuer": "aleo1...",
      "proof_hash": "abc123field",
      "expires_at": 1735689600
    },
    "message": "Badge ready for on-chain issuance"
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | Environment (development/production/test) |
| `ISSUER_PRIVATE_KEY` | Yes | Aleo private key for signing |
| `ALEO_RPC_URL` | No | Aleo RPC endpoint |
| `POH_API_KEY` | No | Proof of Humanity API key |
| `WORLDCOIN_API_KEY` | No | Worldcoin API key |
| `DEMO_MODE` | No | Enable mock verification (default: true) |

## Rate Limiting

- Default: 10 requests per minute per IP
- Badge issuance: 5 requests per hour per IP
- Strict endpoints: 3 requests per minute

## Development

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build for production
pnpm build

# Run production build
pnpm start
```

## Architecture

```
src/
├── index.ts           # Entry point
├── server.ts          # Express app setup
├── config.ts          # Environment configuration
├── types.ts           # TypeScript interfaces
├── middleware/
│   ├── auth.ts        # Signature verification
│   ├── rateLimit.ts   # Rate limiting
│   └── errorHandler.ts
├── routes/
│   ├── verification.ts
│   ├── badge.ts
│   └── health.ts
└── utils/
    ├── crypto.ts
    ├── pohIntegration.ts
    ├── worldcoinIntegration.ts
    └── logger.ts
```

## License

MIT
