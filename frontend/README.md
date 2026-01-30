# SybilShield Frontend

The Next.js 14 frontend for SybilShield - a privacy-focused, zero-knowledge proof-based system for fair DAO governance.

## Features

- 🌐 **Modern Next.js 14** with App Router
- 🎨 **Beautiful UI** with Tailwind CSS and Framer Motion
- 🔐 **Wallet Integration** with Leo Wallet adapter
- 🛡️ **Privacy-First** design with ZK indicators
- 📱 **Fully Responsive** for all devices
- ⚡ **Demo Mode** for testing without real blockchain

## Pages

### Landing Page (`/`)
- Hero section with value proposition
- Problem/Solution explanation
- How it works guide
- Call-to-action sections

### Badge Page (`/badge`)
- Step-by-step verification flow
- Multiple verification providers (PoH, Worldcoin)
- Badge status display
- Renewal functionality

### Vote Page (`/vote`)
- List of active proposals
- Search and filter functionality
- Voting interface
- Create new proposals

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Leo Wallet browser extension

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

### Environment Variables

```env
NEXT_PUBLIC_RELAYER_URL=http://localhost:5000
NEXT_PUBLIC_ALEO_NETWORK=testnet
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true
```

## Project Structure

```
frontend/
├── app/
│   ├── components/        # Reusable UI components
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── WalletButton.tsx
│   │   ├── BadgeCard.tsx
│   │   ├── ProposalCard.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── VerificationForm.tsx
│   │   └── CreateProposalModal.tsx
│   ├── badge/
│   │   └── page.tsx       # Badge verification page
│   ├── vote/
│   │   └── page.tsx       # DAO voting page
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # Context providers
├── hooks/
│   ├── useBadge.ts        # Badge state management
│   ├── useVerification.ts # Verification flow
│   └── useProposals.ts    # Proposals state
├── services/
│   ├── api.ts             # Relayer API client
│   └── blockchain.ts      # Aleo blockchain service
├── styles/
│   └── globals.css        # Global styles + Tailwind
├── types/
│   └── index.ts           # TypeScript definitions
└── public/                # Static assets
```

## Components

### Navigation
Fixed navigation bar with:
- Logo and branding
- Page links
- Privacy indicator
- Wallet connection button
- Mobile menu

### BadgeCard
Displays badge status with:
- Visual badge representation
- Status indicators (active/expired/revoked)
- Expiry information
- Renewal actions

### ProposalCard
Shows proposal details with:
- Title and description
- Voting progress bar
- Vote buttons
- Status badges

### VerificationForm
Multi-step verification with:
- Provider selection
- Form validation
- Loading states
- Error handling

## Hooks

### useBadge
```typescript
const { badge, loading, fetchBadge, requestBadge, renewBadge } = useBadge();
```

### useVerification
```typescript
const { verification, verifyIdentity, checkStatus } = useVerification();
```

### useProposals
```typescript
const { proposals, fetchProposals, createProposal, vote } = useProposals();
```

## Styling

The app uses a custom dark theme with:
- **Primary**: Blue tones (#0ea5e9)
- **Accent**: Cyan (#00D4FF)
- **Backgrounds**: Dark slate tones
- **Glass morphism** effects
- **Gradient** accents

### Custom Classes
- `.glass-card` - Glassmorphism card style
- `.btn-glow` - Primary button with glow effect
- `.btn-secondary` - Secondary button style
- `.input-field` - Form input styling
- `.text-gradient` - Gradient text effect

## Demo Mode

When `NEXT_PUBLIC_DEMO_MODE=true`:
- API calls return mock data
- Verification always succeeds
- No real blockchain transactions
- Perfect for testing UI/UX

## Scripts

```bash
# Development
pnpm dev

# Build
pnpm build

# Start production
pnpm start

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Wallet Integration

The app uses `@demox-labs/aleo-wallet-adapter-react` for Leo Wallet integration:

```typescript
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';

const { connected, publicKey, signMessage } = useWallet();
```

## License

MIT
