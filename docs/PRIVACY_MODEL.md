# SybilShield Privacy Model

## Overview

SybilShield is designed with privacy as a first-class concern. This document explains our privacy model, the guarantees we provide, and how zero-knowledge proofs enable private yet verifiable governance.

## Privacy Goals

### 1. Voter Anonymity
**Goal**: No one can determine how a specific person voted.

**Mechanism**: Votes are cast using zero-knowledge proofs that prove badge ownership without revealing the badge owner's identity.

### 2. Unlinkability
**Goal**: The on-chain badge cannot be linked to the off-chain identity verification.

**Mechanism**: The relayer generates a proof hash from the verification data, but does not store the mapping between identity and badge.

### 3. Vote Privacy
**Goal**: Individual vote choices remain confidential.

**Mechanism**: Votes are recorded as commitments on-chain. Only the final tally is public.

### 4. Coercion Resistance
**Goal**: Voters cannot prove how they voted to a third party.

**Mechanism**: The voting protocol does not produce receipts that could be used to prove vote choices.

## Zero-Knowledge Proof Architecture

### Badge Issuance

When issuing a badge, we prove:

```
ZK Proof: "I have a valid identity verification from an approved provider"
Public Inputs: proof_hash (commitment to verification)
Private Inputs: verification_details, identity_data
Output: Badge record with unique nonce
```

The proof hash is a one-way commitment:
```
proof_hash = hash(provider_id || verification_timestamp || random_salt)
```

This allows:
- ✅ Verifying that a valid verification occurred
- ❌ Recovering the original identity from the hash
- ❌ Linking multiple proof hashes to the same identity

### Private Voting

When voting, we prove:

```
ZK Proof: "I own a valid, unexpired badge and have not voted on this proposal"
Public Inputs: proposal_id, vote_commitment
Private Inputs: badge_record, vote_choice, nonce
Output: Vote recorded, nullifier stored
```

The nullifier prevents double voting:
```
nullifier = hash(badge_nonce || proposal_id)
```

This ensures:
- ✅ Each badge can only vote once per proposal
- ❌ Voters cannot be identified from nullifiers
- ❌ Vote choices cannot be derived from commitments

## Data Flow Privacy Analysis

### Phase 1: Identity Verification

```
User ──[identity data]──▶ Provider (PoH/Worldcoin)
                                │
                         [verification result]
                                │
                                ▼
User ◀──[verification_id]── Relayer
```

**Privacy Properties:**
- Identity data only shared with the identity provider
- Relayer receives only verification result, not identity details
- Verification ID is a random identifier, not linked to identity

### Phase 2: Badge Issuance

```
User ──[verification_id + wallet]──▶ Relayer
                                         │
                              [generate proof_hash]
                                         │
                                         ▼
                                   Aleo Network
                                   [issue badge]
                                         │
User ◀──────[badge record]───────────────┘
```

**Privacy Properties:**
- Wallet address is public (on Aleo), but not linked to identity
- Proof hash is a commitment, not revealing verification source
- Badge nonce is random, used only for voting nullifiers

### Phase 3: Voting

```
User ──[vote + badge proof]──▶ Aleo Network
                                    │
                         [verify ZK proof]
                         [check nullifier]
                         [record vote]
                                    │
User ◀──[confirmation]──────────────┘
```

**Privacy Properties:**
- Vote is encrypted in the ZK proof
- Badge ownership proven without revealing badge
- Nullifier prevents double-voting without linking to identity

## Threat Model

### Threats We Defend Against

| Threat | Mitigation |
|--------|------------|
| Sybil attacks | Each identity verification produces at most one badge |
| Vote buying | Votes cannot be proven to third parties |
| Voter coercion | No vote receipts; same-looking confirmation for all votes |
| Vote tracking | Votes recorded as commitments, not plaintext |
| Identity leakage | ZK proofs hide identity from on-chain data |
| Collusion analysis | Random nonces prevent statistical linkage |

### Threats We Do NOT Defend Against

| Threat | Reason |
|--------|--------|
| Identity provider compromise | We trust PoH/Worldcoin for identity verification |
| Wallet tracking | Wallet addresses are public; use fresh wallets for privacy |
| Network analysis | IP addresses visible during transaction submission |
| Side-channel attacks | Implementation-specific; requires auditing |

## Privacy-Preserving Components

### 1. Badge Records (Private on Aleo)

```leo
record Badge {
    owner: address,      // Only owner can see
    issuer: address,     // Only owner can see
    proof_hash: field,   // Commitment, not revealing
    created_at: u64,     // Timing data
    expires_at: u64,     // Timing data
    nonce: field,        // Random, used for nullifiers
}
```

Records in Aleo are encrypted to the owner's view key. Only the badge owner can decrypt and see their badge details.

### 2. Vote Nullifiers (Public but Anonymous)

```leo
mapping vote_nullifiers: field => bool;
```

The nullifier mapping is public, but nullifiers are:
- Derived from secret badge nonce + proposal ID
- Cannot be reversed to identify the voter
- Cannot be linked across proposals

### 3. Vote Tallies (Public Aggregate)

```leo
struct Proposal {
    votes_yes: u64,
    votes_no: u64,
    // ...
}
```

Only aggregate counts are public. Individual vote choices are never revealed.

## Privacy Levels

### Maximum Privacy (Recommended)

For maximum privacy, users should:

1. **Use a fresh wallet** for badge issuance
2. **Avoid linking wallet** to other identifiable transactions
3. **Use a VPN/Tor** when submitting transactions
4. **Wait random time** between verification and badge claim

### Standard Privacy

With standard usage:

1. Wallet address is public but pseudonymous
2. Badge ownership is private (encrypted record)
3. Vote choices are private (ZK proofs)
4. Voting participation is somewhat observable (transaction timing)

## Comparison with Other Systems

| Feature | SybilShield | Token Voting | Snapshot | MACI |
|---------|-------------|--------------|----------|------|
| Sybil Resistant | ✅ | ❌ | ❌ | ✅ |
| Vote Privacy | ✅ | ❌ | ❌ | ✅ |
| Identity Privacy | ✅ | N/A | N/A | ❌ |
| Coercion Resistant | ✅ | ❌ | ❌ | ✅ |
| On-Chain | ✅ | ✅ | ❌ | ✅ |
| Gas Efficient | ✅ | ✅ | ✅ | ❌ |

## Future Privacy Enhancements

### Planned Improvements

1. **Threshold Voting**: Require minimum votes before revealing tally
2. **Delayed Revelation**: Votes revealed only after voting ends
3. **Batched Verification**: Group verifications to increase anonymity set
4. **Cross-Chain Privacy**: Private badge verification across chains

### Research Directions

1. **Fully Homomorphic Voting**: Compute on encrypted votes
2. **Mixnets for Transactions**: Hide transaction origin
3. **Time-Lock Encryption**: Automatic future revelation

## Compliance Considerations

SybilShield is designed for legitimate governance use cases. However, privacy technologies can be misused. We recommend:

1. **Transparency of Rules**: Publish governance rules publicly
2. **Audit Trails**: Maintain logs of badge issuance (without identity links)
3. **Legal Compliance**: Ensure usage complies with local regulations
4. **Responsible Disclosure**: Report vulnerabilities through proper channels

## Privacy Audit Status

- [ ] Internal security review
- [ ] External smart contract audit
- [ ] Cryptographic protocol review
- [ ] Privacy impact assessment

## Contact

For privacy-related concerns or vulnerability reports:
- Email: privacy@sybilshield.xyz
- PGP Key: [Available on keyserver]
