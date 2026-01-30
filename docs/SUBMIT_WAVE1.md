# Aleo Privacy Buildathon Wave 1 - Submission Guide

This guide helps you prepare and submit SybilShield for the Aleo Privacy Buildathon Wave 1.

## Submission Deadline

**February 3rd, 2026**

## Submission Requirements

Based on typical Aleo Buildathon requirements, prepare the following:

### 1. Project Repository ✅

**GitHub Repository**: Your complete source code

Ensure your repository includes:
- [x] Complete source code
- [x] README.md with project overview
- [x] Installation instructions
- [x] Environment setup guide
- [x] Architecture documentation
- [x] License file

### 2. Demo Video 📹

Create a 5-10 minute video demonstrating:

1. **Introduction** (1 min)
   - What is SybilShield?
   - What problem does it solve?

2. **Live Demo** (5-7 min)
   - Wallet connection
   - Identity verification
   - Badge issuance
   - Voting on proposals
   - Creating proposals

3. **Technical Deep Dive** (2 min)
   - Zero-knowledge proof usage
   - Privacy guarantees
   - Smart contract overview

**Video Tips**:
- Use screen recording software (OBS, Loom, QuickTime)
- Record in 1080p
- Use clear audio
- Upload to YouTube (unlisted is fine)

### 3. Live Demo URL 🌐

Deploy your application:

**Option A: Local Demo**
- Provide clear setup instructions
- Ensure demo mode works without API keys

**Option B: Hosted Demo** (Recommended)
- Deploy frontend to Vercel
- Deploy relayer to Railway
- Deploy contracts to testnet
- Provide URL: `https://demo.sybilshield.xyz`

### 4. Technical Documentation 📚

Submit these documents:
- [x] [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [x] [PRIVACY_MODEL.md](./PRIVACY_MODEL.md) - Privacy guarantees
- [x] [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [x] [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) - Demo walkthrough

### 5. Project Description

Prepare a concise project description (500-1000 words):

---

**SybilShield: One Person, One Vote. Privately.**

SybilShield is a privacy-preserving, zero-knowledge proof-based system for fair DAO governance built on Aleo. It solves the fundamental tension between Sybil resistance and privacy in decentralized voting.

**The Problem**

Current DAO governance systems face critical challenges:
- Sybil attacks allow malicious actors to manipulate votes with multiple accounts
- Token-weighted voting creates plutocracy where wealth equals power
- Identity verification solutions sacrifice privacy by linking votes to identities

**Our Solution**

SybilShield leverages Aleo's zero-knowledge proof infrastructure to achieve:

1. **Sybil Resistance**: Each verified human receives exactly one SybilShield badge, preventing multiple account manipulation.

2. **Vote Privacy**: Votes are cast using ZK proofs that prove badge ownership and vote validity without revealing the voter's identity or choice.

3. **Identity Unlinkability**: The on-chain badge cannot be traced back to the off-chain identity verification, preserving user privacy.

**How It Works**

1. Users verify their humanity through trusted providers (Proof of Humanity, Worldcoin)
2. A privacy-preserving SybilShield badge is minted on Aleo
3. Badge holders can vote on proposals with one vote per person
4. Votes are recorded with ZK proofs, ensuring privacy and preventing double-voting

**Technical Implementation**

- **Smart Contracts**: Two Leo programs - `sybilshield_core.aleo` for badge management and `gov_vote.aleo` for governance
- **Relayer**: Express.js service bridging identity providers and Aleo
- **Frontend**: Next.js 14 application with Leo Wallet integration

**Privacy Guarantees**

- Voter anonymity within the set of all badge holders
- Vote choices encrypted on-chain
- No persistent link between identity and wallet
- Coercion resistance through receipt-free voting

**Impact**

SybilShield enables truly democratic DAO governance where every verified human has equal voting power, regardless of wealth, while maintaining the privacy that blockchain technology promises.

---

## Submission Checklist

### Code Quality
- [ ] Code is well-organized and documented
- [ ] No sensitive credentials in repository
- [ ] All dependencies are specified
- [ ] Build instructions are accurate

### Functionality
- [ ] Smart contracts compile successfully
- [ ] Relayer runs without errors
- [ ] Frontend loads correctly
- [ ] Wallet connection works
- [ ] Verification flow completes
- [ ] Badge issuance works
- [ ] Voting works

### Documentation
- [ ] README is comprehensive
- [ ] Architecture is explained
- [ ] Privacy model is documented
- [ ] Setup instructions work

### Demo
- [ ] Demo video is recorded
- [ ] Video is uploaded
- [ ] Live demo is accessible
- [ ] Demo script is prepared

### Submission
- [ ] All materials collected
- [ ] Submission form completed
- [ ] Submitted before deadline

## Judging Criteria

Based on typical Aleo Buildathon criteria:

### 1. Innovation (25%)
- Novel approach to Sybil resistance
- Creative use of ZK proofs
- Unique privacy features

### 2. Technical Excellence (25%)
- Code quality
- Smart contract security
- System architecture

### 3. Aleo Integration (25%)
- Effective use of Leo language
- Proper ZK proof implementation
- Testnet deployment

### 4. Impact & Practicality (25%)
- Real-world applicability
- User experience
- Potential for adoption

## Presentation Tips

### Highlight Privacy Features
- Emphasize zero-knowledge proofs
- Show unlinkability between identity and votes
- Demonstrate Sybil resistance

### Show Working Demo
- Use demo mode for reliable demonstration
- Prepare for network issues
- Have backup recordings

### Explain Technical Decisions
- Why Leo for smart contracts?
- Why separate relayer service?
- Why these identity providers?

### Address Limitations
- Acknowledge trust assumptions
- Discuss future improvements
- Show roadmap

## Post-Submission

### After Submitting
1. Share on social media
2. Engage with community
3. Be available for judge questions
4. Prepare for potential presentation

### If Selected
1. Polish demo environment
2. Prepare extended presentation
3. Have team members available
4. Practice Q&A responses

## Resources

### Aleo Resources
- [Aleo Developer Docs](https://developer.aleo.org/)
- [Leo Language Guide](https://developer.aleo.org/leo/)
- [Aleo Studio](https://www.aleo.studio/)

### Buildathon Resources
- [Buildathon Page](https://aleo.org/buildathon)
- [Discord Support](https://discord.gg/aleo)
- [Previous Winners](https://aleo.org/ecosystem)

## Contact

For submission questions:
- Aleo Discord: #buildathon channel
- Email: buildathon@aleo.org

For SybilShield questions:
- GitHub Issues: https://github.com/sybilshield/sybilshield
- Email: team@sybilshield.xyz

---

**Good luck with your submission! 🚀**
