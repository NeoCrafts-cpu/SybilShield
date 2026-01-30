# SybilShield Leo Contracts

## Overview

This directory contains the Leo smart contracts for the SybilShield project - a privacy-focused Sybil-resistant badge system for fair DAO governance on Aleo.

## Contracts

### 1. sybilshield_core.aleo

Badge management contract with 6 main transitions:

| Transition | Description | Access |
|------------|-------------|--------|
| `initialize` | Set up admin address | Once per deployment |
| `register_issuer` | Add verification provider | Admin only |
| `issue_badge` | Mint new badge | Registered issuers |
| `verify_badge` | Check badge validity | Badge owner |
| `revoke_badge` | Mark badge invalid | Admin or issuer |
| `renew_badge` | Extend badge expiry | Badge owner |

### 2. gov_vote.aleo

DAO governance contract with 5 main transitions:

| Transition | Description | Access |
|------------|-------------|--------|
| `initialize` | Set up DAO admin | Once per deployment |
| `create_proposal` | Create voting proposal | Badge holders |
| `vote` | Cast vote on proposal | Badge holders (1 per proposal) |
| `end_voting` | Finalize voting period | Anyone (after period ends) |
| `execute_proposal` | Execute passed proposal | DAO admin |

## Building

```bash
# Build all contracts
leo build

# Build with verbose output
leo build --verbose
```

## Testing

```bash
# Run all tests
leo test

# Run specific test file
leo test test_sybilshield_core

# Run with verbose output
leo test --verbose
```

## Deployment

```bash
# Deploy to testnet
leo deploy --network testnet

# Deploy with specific private key
leo deploy --network testnet --private-key <YOUR_PRIVATE_KEY>
```

## Privacy Model

### What's Private (Hidden on-chain)
- Badge holder identity (stored in private record)
- Voter identity (protected by nullifiers)
- Individual votes (only tallies are public)
- Proof of Humanity/Worldcoin verification details

### What's Public (Visible on-chain)
- Badge existence (not owner)
- Registered issuers
- Proposal details (title, description hashes)
- Vote tallies (yes/no counts)
- Proposal outcomes

## Data Structures

### SybilBadge (Private Record)
```leo
record SybilBadge {
    owner: address,           // Hidden
    issuer: address,          // Visible
    created_at: u32,          // Visible
    expires_at: u32,          // Visible
    unique_proof_hash: field, // Hidden
    nonce: field,             // Visible
}
```

### Proposal (Public Struct)
```leo
struct Proposal {
    id: u32,
    title: field,       // Hash of actual title
    description: field, // Hash of actual description
    proposer: field,    // Hash of proposer address
    created_at: u32,
    ends_at: u32,
    votes_yes: u32,
    votes_no: u32,
    executed: bool,
    passed: bool,
}
```

## Mappings

### sybilshield_core.aleo
- `admin: u8 => address`
- `issuer_registry: address => bool`
- `badge_registry: field => BadgeInfo`
- `revoked_badges: field => bool`
- `used_proof_hashes: field => bool`
- `badge_count: u8 => u32`

### gov_vote.aleo
- `dao_admin: u8 => address`
- `proposals: u32 => Proposal`
- `vote_nullifiers: field => bool`
- `vote_tallies: u32 => field`
- `active_proposals: u32 => bool`

## Security Considerations

1. **Non-transferable Badges**: Badges cannot be transferred between addresses
2. **One Badge Per Proof**: Same verification proof cannot mint multiple badges
3. **Nullifier-based Double-vote Prevention**: Cryptographic nullifiers prevent re-voting
4. **Expiring Badges**: Badges have expiration dates for security
5. **Revocation Support**: Fraudulent badges can be revoked by admin/issuer

## License

MIT
