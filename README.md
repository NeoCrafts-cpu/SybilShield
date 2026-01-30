# SybilShield

<div align="center">
  <img src="docs/images/logo.png" alt="SybilShield Logo" width="200" />
  
  ## One Person, One Vote. Privately.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Built on Aleo](https://img.shields.io/badge/Built%20on-Aleo-00D4FF.svg)](https://aleo.org)
  [![Aleo Privacy Buildathon](https://img.shields.io/badge/Aleo%20Privacy-Buildathon%20Wave%201-purple.svg)](https://aleo.org/buildathon)
</div>

---

## 🎯 Overview

**SybilShield** is a privacy-focused, zero-knowledge proof-based system for fair DAO governance on the Aleo blockchain. It enables democratic voting where each verified unique human gets exactly one vote, while maintaining complete privacy.

### The Problem

Current DAO governance systems face critical challenges:

- **Sybil Attacks**: Malicious actors create multiple accounts to manipulate votes
- **Plutocracy**: Token-weighted voting gives wealthy participants outsized influence
- **Privacy Sacrifice**: Existing identity solutions link real-world identity to on-chain activity
- **Vote Tracking**: Public voting leads to coercion and social pressure

### The Solution

SybilShield provides:

- ✅ **Sybil Resistance**: Each verified human gets exactly one badge and one vote
- 🔒 **Complete Privacy**: Zero-knowledge proofs ensure votes can't be traced to voters
- ⚖️ **Fair Governance**: One person = one vote, regardless of token holdings
- 🌐 **Portable Identity**: SybilShield badges work across any integrated DAO

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (Next.js 14 Frontend)                        │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Verification Relayer                        │
│                      (Express.js Backend)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Proof of        │  │ Worldcoin       │  │ Badge           │  │
│  │ Humanity API    │  │ Integration     │  │ Management      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Aleo Blockchain                            │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │ sybilshield_core.aleo   │  │ gov_vote.aleo               │   │
│  │ - Badge issuance        │  │ - Proposal creation         │   │
│  │ - Badge verification    │  │ - Private voting            │   │
│  │ - Badge renewal         │  │ - Vote tallying             │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
SybilShield/
├── contracts/               # Leo smart contracts
│   ├── src/
│   │   ├── main.leo
│   │   ├── sybilshield_core.leo
│   │   └── gov_vote.leo
│   ├── tests/
│   └── Leo.toml
├── relayer/                 # Express.js verification relayer
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   └── package.json
├── frontend/                # Next.js 14 frontend
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── package.json
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── PRIVACY_MODEL.md
│   └── DEPLOYMENT.md
└── package.json             # Monorepo root
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Leo CLI 3.4.0+ (for smart contracts)
- Leo Wallet browser extension

### Installation

```bash
# Clone the repository
git clone https://github.com/sybilshield/sybilshield.git
cd sybilshield

# Install dependencies
pnpm install

# Set up environment variables
cp relayer/.env.example relayer/.env
cp frontend/.env.example frontend/.env.local

# Start all services
pnpm dev
```

### Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter contracts build
pnpm --filter relayer build
pnpm --filter frontend build
```

### Test

```bash
# Run all tests
pnpm test

# Test specific package
pnpm --filter contracts test
pnpm --filter relayer test
pnpm --filter frontend test
```

## 🔐 How It Works

### 1. Identity Verification

Users verify their humanity through trusted providers:
- **Proof of Humanity**: Decentralized registry of verified humans
- **Worldcoin**: Biometric verification via World ID

### 2. Badge Issuance

Upon successful verification:
1. The relayer generates a zero-knowledge proof of verification
2. A SybilShield badge is minted on Aleo
3. The badge contains a unique nonce but no identifying information
4. The link between identity and badge is never stored

### 3. Private Voting

When voting on proposals:
1. User proves they own a valid badge (ZK proof)
2. Vote is recorded without revealing voter identity
3. Badge nonce ensures one vote per person per proposal
4. Vote choice remains private (encrypted on-chain)

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Privacy Model](docs/PRIVACY_MODEL.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Demo Script](docs/DEMO_SCRIPT.md)
- [API Reference](relayer/README.md)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Leo 3.4.0+, Aleo blockchain |
| **Backend** | Express.js, TypeScript, Zod |
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **Wallet** | Leo Wallet Adapter |
| **Build System** | pnpm workspaces, Turborepo |

## 🗺️ Roadmap

### Phase 1 (Current) - MVP
- [x] Core badge issuance contract
- [x] Governance voting contract
- [x] Proof of Humanity integration
- [x] Worldcoin integration
- [x] Basic frontend UI

### Phase 2 - Enhanced Features
- [ ] Additional identity providers (BrightID, Gitcoin Passport)
- [ ] Quadratic voting support
- [ ] Delegation with privacy
- [ ] Multi-DAO dashboard

### Phase 3 - Ecosystem Growth
- [ ] DAO integration SDK
- [ ] Cross-chain badge portability
- [ ] Mobile app
- [ ] Analytics dashboard

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Aleo](https://aleo.org) - For the privacy-preserving blockchain infrastructure
- [Proof of Humanity](https://proofofhumanity.id) - For decentralized identity verification
- [Worldcoin](https://worldcoin.org) - For biometric identity verification
- All contributors and supporters of the project

---

<div align="center">
  <p>Built with ❤️ for the Aleo Privacy Buildathon Wave 1</p>
  <p>
    <a href="https://sybilshield.xyz">Website</a> •
    <a href="https://twitter.com/sybilshield">Twitter</a> •
    <a href="https://discord.gg/sybilshield">Discord</a>
  </p>
</div>
