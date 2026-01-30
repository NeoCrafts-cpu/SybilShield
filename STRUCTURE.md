# SybilShield Project Structure

```
sybilshield/
│
├── 📁 .github/                    # GitHub configuration
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline for Leo, relayer, frontend
│
├── 📁 contracts/                  # Leo smart contracts (Aleo blockchain)
│   ├── src/
│   │   ├── main.leo              # Main program entry point
│   │   ├── sybilshield_core.leo  # Badge management contract
│   │   └── gov_vote.leo          # DAO governance contract
│   ├── tests/
│   │   ├── test_sybilshield_core.leo  # Badge contract tests
│   │   └── test_gov_vote.leo          # Governance contract tests
│   ├── build/                    # Compiled outputs (gitignored)
│   ├── Leo.toml                  # Leo project configuration
│   └── README.md                 # Contract documentation
│
├── 📁 relayer/                   # Off-chain relayer (Express.js backend)
│   ├── src/
│   │   ├── index.ts              # Application entry point
│   │   ├── server.ts             # Express app configuration
│   │   ├── config.ts             # Environment configuration
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── middleware/
│   │   │   ├── auth.ts           # Wallet signature verification
│   │   │   ├── rateLimit.ts      # Rate limiting (10 req/min)
│   │   │   └── errorHandler.ts   # Global error handler
│   │   ├── routes/
│   │   │   ├── verification.ts   # PoH/Worldcoin verification
│   │   │   ├── badge.ts          # Badge issuance endpoints
│   │   │   └── health.ts         # Health check endpoint
│   │   └── utils/
│   │       ├── crypto.ts         # Cryptographic utilities
│   │       ├── pohIntegration.ts # Proof of Humanity API
│   │       └── worldcoinIntegration.ts  # Worldcoin API
│   ├── tests/
│   │   └── relayer.test.ts       # Jest test suite
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── .env.example              # Environment template
│   └── README.md                 # Relayer documentation
│
├── 📁 frontend/                  # Next.js 14 frontend application
│   ├── app/                      # App Router (Next.js 14)
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing page
│   │   ├── badge/
│   │   │   └── page.tsx          # Badge management page
│   │   ├── vote/
│   │   │   └── page.tsx          # DAO voting interface
│   │   ├── api/                  # API route handlers
│   │   │   ├── verification/route.ts
│   │   │   ├── badge/route.ts
│   │   │   ├── vote/route.ts
│   │   │   └── health/route.ts
│   │   └── components/           # React components
│   │       ├── Navigation.tsx    # Header navigation
│   │       ├── Footer.tsx        # Site footer
│   │       ├── BadgeCard.tsx     # Badge display component
│   │       ├── ProposalCard.tsx  # Proposal list item
│   │       ├── VotingForm.tsx    # Vote submission form
│   │       ├── VerificationForm.tsx  # Multi-step verification
│   │       ├── WalletButton.tsx  # Wallet connect button
│   │       └── ...               # Other UI components
│   ├── hooks/                    # Custom React hooks
│   │   ├── useWallet.ts          # Wallet connection hook
│   │   ├── useBadge.ts           # Badge management hook
│   │   ├── useProposal.ts        # Proposal/voting hook
│   │   └── useVerification.ts    # Verification flow hook
│   ├── services/                 # API and blockchain services
│   │   ├── api.ts                # Relayer API client
│   │   └── blockchain.ts         # Aleo blockchain interactions
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts              # Shared interfaces
│   ├── styles/
│   │   └── globals.css           # Global styles and Tailwind
│   ├── public/                   # Static assets
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.js            # Next.js configuration
│   ├── tailwind.config.ts        # Tailwind CSS configuration
│   └── README.md                 # Frontend documentation
│
├── 📁 docs/                      # Project documentation
│   ├── ARCHITECTURE.md           # System design and data flows
│   ├── PRIVACY_MODEL.md          # Privacy guarantees and threat model
│   ├── DEPLOYMENT.md             # Deployment instructions
│   ├── DEMO_SCRIPT.md            # Demo presentation script
│   └── SUBMIT_WAVE1.md           # Buildathon submission document
│
├── package.json                  # Root package.json (pnpm workspaces)
├── turbo.json                    # Turborepo configuration
├── tsconfig.json                 # Root TypeScript configuration
├── .gitignore                    # Git ignore rules
├── README.md                     # Project overview
└── STRUCTURE.md                  # This file (structure guide)
```

## Directory Purpose Guide

### `/contracts` - Leo Smart Contracts
The heart of SybilShield. Contains two Leo programs:
- **sybilshield_core.leo**: Manages badge lifecycle (issue, verify, revoke, renew)
- **gov_vote.leo**: DAO governance with Sybil-resistant voting

### `/relayer` - Off-Chain Backend
Bridges the gap between identity verification and blockchain:
- Verifies users via Proof of Humanity or Worldcoin
- Generates cryptographic proofs for badge issuance
- Rate limits requests to prevent abuse

### `/frontend` - Next.js Application
User-facing application for:
- Connecting Leo Wallet
- Completing verification flow
- Managing SybilShield badges
- Voting on DAO proposals

### `/docs` - Documentation
Comprehensive documentation for:
- Developers (architecture, deployment)
- Users (how to use)
- Judges (privacy model, submission)

## Tech Stack Summary

| Layer      | Technology        | Purpose                    |
|------------|-------------------|----------------------------|
| Blockchain | Aleo + Leo 3.4.0  | Privacy-preserving compute |
| Backend    | Express.js + TS   | Identity verification      |
| Frontend   | Next.js 14 + TS   | User interface             |
| Styling    | Tailwind CSS      | Responsive design          |
| Wallet     | Leo Wallet Adapter| Aleo wallet integration    |
| Build      | Turborepo + pnpm  | Monorepo management        |
| CI/CD      | GitHub Actions    | Automated testing          |

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development servers
pnpm dev

# Run tests
pnpm test

# Build Leo contracts
pnpm contracts:build
```
