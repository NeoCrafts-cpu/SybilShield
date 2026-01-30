# SybilShield Architecture

## Overview

SybilShield is designed as a three-layer architecture that separates concerns between user interface, verification services, and blockchain operations.

## System Layers

### 1. Frontend Layer (Next.js 14)

The frontend provides a modern, privacy-focused user interface for interacting with SybilShield.

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing page
│   ├── providers.tsx       # Context providers (wallet, theme)
│   ├── badge/
│   │   └── page.tsx        # Badge verification flow
│   ├── vote/
│   │   └── page.tsx        # Governance voting
│   └── components/
│       ├── Navigation.tsx
│       ├── WalletButton.tsx
│       ├── BadgeCard.tsx
│       ├── ProposalCard.tsx
│       └── VerificationForm.tsx
├── hooks/
│   ├── useBadge.ts
│   ├── useVerification.ts
│   └── useProposals.ts
├── services/
│   ├── api.ts              # Relayer API client
│   └── blockchain.ts       # Aleo SDK wrapper
└── types/
    └── index.ts
```

**Key Responsibilities:**
- Wallet connection management
- User-friendly verification flow
- Proposal browsing and voting
- Transaction status tracking

### 2. Relayer Layer (Express.js)

The relayer acts as a bridge between off-chain identity verification services and on-chain badge issuance.

```
relayer/
├── src/
│   ├── server.ts           # Express app setup
│   ├── index.ts            # Entry point
│   ├── config.ts           # Environment configuration
│   ├── types.ts            # TypeScript interfaces
│   ├── routes/
│   │   ├── verification.ts # PoH/Worldcoin verification
│   │   ├── badge.ts        # Badge management
│   │   └── health.ts       # Health checks
│   ├── middleware/
│   │   ├── auth.ts         # Wallet signature verification
│   │   ├── rateLimit.ts    # Rate limiting
│   │   └── errorHandler.ts # Error handling
│   └── utils/
│       ├── crypto.ts       # Cryptographic utilities
│       ├── pohIntegration.ts
│       └── worldcoinIntegration.ts
```

**Key Responsibilities:**
- Integrate with identity verification providers
- Generate zero-knowledge proofs of verification
- Submit badge issuance transactions
- Maintain verification status

### 3. Smart Contract Layer (Leo)

Two main programs handle badge management and governance voting.

```
contracts/
├── src/
│   ├── main.leo                # Entry point
│   ├── sybilshield_core.leo   # Badge management
│   └── gov_vote.leo           # Governance voting
├── tests/
│   ├── test_sybilshield_core.leo
│   └── test_gov_vote.leo
└── Leo.toml
```

**sybilshield_core.aleo:**
- `issue_badge` - Mint new badge for verified user
- `verify_badge` - Check badge validity
- `revoke_badge` - Revoke compromised badge
- `renew_badge` - Extend badge validity

**gov_vote.aleo:**
- `create_proposal` - Submit new proposal
- `vote` - Cast private vote
- `end_voting` - Finalize voting period
- `execute_proposal` - Execute passed proposal

## Data Flow

### Badge Issuance Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Frontend │────▶│ Relayer  │────▶│ Aleo     │
│          │     │          │     │          │     │ Network  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │ 1. Connect     │                │                │
     │    Wallet      │                │                │
     │◀───────────────│                │                │
     │                │                │                │
     │ 2. Select      │                │                │
     │    Provider    │                │                │
     │───────────────▶│                │                │
     │                │ 3. Verify      │                │
     │                │    Identity    │                │
     │                │───────────────▶│                │
     │                │                │ 4. Check       │
     │                │                │    Provider    │
     │                │                │───────────────▶│ (PoH/WC)
     │                │                │◀───────────────│
     │                │                │                │
     │                │                │ 5. Generate    │
     │                │                │    ZK Proof    │
     │                │                │                │
     │                │                │ 6. Submit      │
     │                │                │    Badge TX    │
     │                │                │───────────────▶│
     │                │                │◀───────────────│
     │                │ 7. Confirm     │                │
     │                │◀───────────────│                │
     │ 8. Badge       │                │                │
     │    Ready!      │                │                │
     │◀───────────────│                │                │
```

### Voting Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Frontend │────▶│ Aleo     │
│          │     │          │     │ Network  │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     │ 1. Select      │                │
     │    Proposal    │                │
     │───────────────▶│                │
     │                │ 2. Fetch       │
     │                │    Details     │
     │                │───────────────▶│
     │                │◀───────────────│
     │ 3. Cast Vote   │                │
     │───────────────▶│                │
     │                │ 4. Generate    │
     │                │    ZK Proof    │
     │                │    (badge +    │
     │                │     vote)      │
     │                │───────────────▶│
     │                │                │
     │                │ 5. Verify      │
     │                │    & Record    │
     │                │                │
     │                │◀───────────────│
     │ 6. Vote        │                │
     │    Confirmed!  │                │
     │◀───────────────│                │
```

## State Management

### On-Chain State

**Badge Records (Private)**
```leo
record Badge {
    owner: address,          // Badge owner
    issuer: address,         // Issuing authority
    proof_hash: field,       // Hash of verification proof
    created_at: u64,         // Block height at creation
    expires_at: u64,         // Expiration block height
    nonce: field,            // Unique identifier for voting
}
```

**Proposal State (Public)**
```leo
struct Proposal {
    id: u64,
    proposer: address,
    content_hash: field,
    start_block: u64,
    end_block: u64,
    votes_yes: u64,
    votes_no: u64,
    status: u8,
}
```

**Vote Commitment (Public, but Privacy-Preserving)**
```leo
// Only stores commitment, not actual vote or voter
mapping vote_commitments: field => bool;
```

### Off-Chain State

The relayer maintains temporary state during verification:

```typescript
interface VerificationSession {
  id: string;
  address: string;
  provider: 'poh' | 'worldcoin';
  status: 'pending' | 'verified' | 'rejected';
  proof_hash: string;
  expires_at: number;
}
```

## Security Considerations

### Smart Contract Security

1. **Access Control**: Only authorized issuers can mint badges
2. **Uniqueness**: Hash-based tracking prevents duplicate badges
3. **Expiration**: Badges have enforced validity periods
4. **Revocation**: Emergency revocation for compromised badges

### Relayer Security

1. **Rate Limiting**: Prevents abuse of verification endpoints
2. **Signature Verification**: Authenticates wallet ownership
3. **Input Validation**: Zod schema validation for all inputs
4. **Error Handling**: Secure error responses

### Privacy Guarantees

1. **Unlinkability**: Badge cannot be linked to identity proof
2. **Vote Privacy**: Vote choice encrypted with ZK proofs
3. **Anonymity Set**: All badge holders form anonymity set
4. **No Tracking**: No persistent user tracking

## Scalability

### Current Limitations

- Single relayer instance
- Sequential badge issuance
- In-memory verification sessions

### Future Improvements

- Distributed relayer cluster
- Batch badge issuance
- Redis-backed session storage
- Layer 2 vote aggregation

## Integration Points

### For DAOs

```typescript
// Check if user has valid badge
const hasBadge = await sybilshield.verifyBadge(userAddress);

// Create proposal
await sybilshield.createProposal({
  title: "...",
  description: "...",
  duration: 7 * 24 * 60 * 60 // 7 days
});

// Get vote results
const results = await sybilshield.getProposalResults(proposalId);
```

### For Identity Providers

New identity providers can be integrated by implementing:

```typescript
interface IdentityProvider {
  name: string;
  verify(params: VerifyParams): Promise<VerifyResult>;
  checkStatus(id: string): Promise<StatusResult>;
}
```

## Deployment Architecture

### Development
```
localhost:3000 - Frontend
localhost:5000 - Relayer
testnet.aleo.org - Aleo Testnet
```

### Production
```
app.sybilshield.xyz - Frontend (Vercel)
api.sybilshield.xyz - Relayer (AWS/Railway)
mainnet.aleo.org - Aleo Mainnet
```

## Monitoring

### Metrics

- Badge issuance rate
- Verification success rate
- Vote participation
- API response times

### Alerts

- Relayer downtime
- Contract errors
- Unusual voting patterns
- Rate limit triggers
