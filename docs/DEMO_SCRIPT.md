# SybilShield Demo Script

This script guides you through demonstrating SybilShield's features for the Aleo Privacy Buildathon Wave 1 submission.

## Demo Overview

**Duration**: ~10 minutes

**Key Points to Demonstrate**:
1. Privacy-preserving identity verification
2. Zero-knowledge badge issuance
3. Private DAO voting
4. Sybil resistance

## Pre-Demo Setup

### 1. Start All Services

```bash
# Terminal 1: Start the relayer
cd relayer
pnpm dev

# Terminal 2: Start the frontend
cd frontend
pnpm dev

# Both should be running:
# - Frontend: http://localhost:3000
# - Relayer: http://localhost:5000
```

### 2. Install Leo Wallet

1. Install Leo Wallet browser extension
2. Create or import a wallet
3. Get testnet tokens from faucet (if needed)

### 3. Enable Demo Mode

The app is configured for demo mode by default, allowing verification to succeed without real API keys.

## Demo Script

### Part 1: Introduction (1 minute)

**Talking Points**:

> "SybilShield solves a critical problem in DAO governance: how do you ensure one person gets one vote, while maintaining privacy?"
>
> "Traditional solutions either sacrifice privacy by linking identity to votes, or fail to prevent Sybil attacks where one person controls multiple accounts."
>
> "SybilShield uses zero-knowledge proofs on Aleo to achieve both privacy AND Sybil resistance."

### Part 2: Landing Page Tour (1 minute)

**Navigate to**: http://localhost:3000

**Show**:
1. Hero section with tagline "One Person, One Vote. Privately."
2. Scroll to Problem section - explain current DAO issues
3. Scroll to Solution section - highlight the four key features
4. Scroll to "How It Works" - show the three-step process

**Talking Points**:

> "The landing page explains our value proposition. Users verify their humanity once, receive a privacy-preserving badge, and can then vote in any integrated DAO."

### Part 3: Connect Wallet (30 seconds)

**Action**: Click "Connect Wallet" in navigation

**Show**:
1. Leo Wallet popup appears
2. Approve connection
3. Wallet address appears in navbar

**Talking Points**:

> "First, users connect their Leo Wallet. This is the only on-chain identifier - there's no link between this wallet and their real identity."

### Part 4: Badge Verification Flow (3 minutes)

**Navigate to**: http://localhost:3000/badge

**Step 1: Show Step Indicator**

> "The badge process has three steps: Connect Wallet (done), Verify Identity, and Claim Badge."

**Step 2: Select Verification Provider**

> "We support multiple identity providers. Let me show Proof of Humanity."

**Action**: Click "Proof of Humanity"

**Step 3: Enter Verification Details**

> "In demo mode, any valid-looking URL works. In production, this would validate against the real Proof of Humanity registry."

**Action**: Enter `https://app.proofofhumanity.id/profile/0x1234567890123456789012345678901234567890`

**Step 4: Submit Verification**

**Action**: Click "Verify Identity"

**Show**:
1. Loading state
2. Success message
3. Transition to Step 3

**Talking Points**:

> "Notice what's happening behind the scenes: The relayer checks your Proof of Humanity status, generates a zero-knowledge proof, and prepares a badge transaction."
>
> "The key privacy feature: at no point is your PoH identity linked to your Aleo wallet address."

**Step 5: Claim Badge**

**Action**: Click "Claim Your Badge"

**Show**:
1. Loading state with "Minting Badge..."
2. Badge card appears with status "Active"

**Talking Points**:

> "Your SybilShield badge is now minted on Aleo. It contains a unique nonce for voting, but NO identifying information. The badge proves you're a verified human without revealing WHO you are."

### Part 5: Badge Card Details (1 minute)

**Show**:
1. Badge visual with glow effect
2. Status badge (Active)
3. Expiration date (1 year from now)
4. Proof hash (commitment to verification)

**Talking Points**:

> "The badge is valid for one year. The proof hash is a one-way commitment - you can't reverse-engineer the identity from it."
>
> "Also notice the privacy badge at the top - 'ZK-Protected' - reminding users their privacy is maintained throughout."

### Part 6: DAO Voting (3 minutes)

**Navigate to**: http://localhost:3000/vote

**Show**:
1. List of proposals
2. Badge status indicator (should show "Badge Active")
3. Search and filter options

**Talking Points**:

> "Now let's see the governance interface. Because you have a valid badge, you can vote on any active proposal."

**Step 1: Review a Proposal**

**Action**: Scroll to an active proposal

**Show**:
1. Proposal title and description
2. Voting progress bar
3. Time remaining
4. Vote buttons

**Talking Points**:

> "Each proposal shows the current vote tally. Notice these are aggregate numbers - you can't see WHO voted, only the totals."

**Step 2: Cast a Vote**

**Action**: Click "Vote Yes" on a proposal

**Show**:
1. Loading state with spinner
2. Success toast notification
3. Updated vote count
4. "You have already voted" message

**Talking Points**:

> "When you vote, a zero-knowledge proof is generated that proves:"
> "1. You own a valid SybilShield badge"
> "2. You haven't voted on this proposal before"
> "3. Your vote choice"
>
> "But the proof reveals NONE of these details to observers. They only see that a valid vote was recorded."

**Step 3: Show Double-Vote Prevention**

**Action**: Try to vote again on the same proposal

**Show**:
1. Vote buttons are gone
2. "Already voted" message

**Talking Points**:

> "Sybil resistance in action: your badge's unique nonce creates a nullifier that prevents double voting. But this nullifier can't be linked back to you."

### Part 7: Create a Proposal (1 minute)

**Action**: Click "New Proposal" button

**Show**:
1. Create Proposal modal
2. Fill in title and description
3. Select voting duration

**Action**: Submit the proposal

**Talking Points**:

> "Badge holders can also create proposals. This ensures only verified humans can submit proposals, preventing spam attacks."

### Part 8: Architecture Overview (30 seconds)

**Show**: Terminal windows with running services

**Talking Points**:

> "Quick architecture overview: The frontend is Next.js 14, the relayer is Express.js handling identity verification, and the smart contracts are written in Leo for Aleo."
>
> "The relayer is the privacy boundary - it sees identity verification results but never records the link to wallet addresses."

## Closing Remarks

**Key Takeaways**:

> "SybilShield achieves what was previously thought impossible: true one-person-one-vote democracy WITH complete privacy."
>
> "Built on Aleo's zero-knowledge architecture, every vote is verifiable yet private. Every badge holder is proven unique yet anonymous."
>
> "This is the future of fair DAO governance."

## Troubleshooting During Demo

### Wallet Won't Connect
- Check if Leo Wallet extension is installed
- Try refreshing the page
- Check browser console for errors

### Verification Fails
- Ensure demo mode is enabled
- Check relayer is running on port 5000
- Verify CORS settings

### Vote Not Recording
- Check wallet is still connected
- Verify badge status is "Active"
- Check browser console for transaction errors

### General Issues
- Clear browser cache
- Restart services
- Check all environment variables are set

## Recording Tips

If recording for async viewing:

1. **Audio**: Use a quality microphone, minimize background noise
2. **Screen**: Use 1920x1080 resolution, increase font sizes
3. **Pacing**: Pause briefly after each action to let viewers follow
4. **Mouse**: Use slow, deliberate cursor movements
5. **Highlight**: Use a cursor highlighter extension

## Post-Demo Questions

Be prepared to answer:

1. **"How do you prevent the relayer from linking identities?"**
   > The relayer doesn't store the mapping. It generates a proof hash and immediately discards the identity link.

2. **"What if someone loses their wallet?"**
   > They would need to re-verify with a new wallet. The old badge becomes unusable.

3. **"Can this scale to millions of users?"**
   > Yes, Aleo's architecture is designed for scale. Badge issuance is O(1), voting is O(1).

4. **"How do you handle identity provider compromises?"**
   > We support multiple providers. Users can choose the one they trust. Badges can be revoked if needed.

5. **"What's the gas cost?"**
   > On Aleo testnet, transactions are free. On mainnet, costs depend on network conditions.
