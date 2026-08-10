# Anonymous Whistleblower Board (Midnight / Compact)

A privacy-preserving whistleblower reporting system built on the **Midnight Network** using the **Compact** smart contract language and **midnight-js**.

Authorized identities can anonymously submit reports:
- **Zero-Knowledge Membership**: Membership is proven via an 8-level Merkle tree (up to 256 authorized identities) without revealing *which* identity submitted.
- **Sentinel Padding Security**: Empty leaves in the Merkle tree are padded with a domain-separated sentinel leaf (`PADDING_LEAF`), preventing raw/zero-byte identity impersonation.
- **Nullifier Protection**: A unique nullifier prevents double-submitting while keeping the reporter's secret identity unlinked.
- **Report Content Hashing & Disclosure**: Reports are hashed off-chain (`hashReportContent`) and recorded on ledger (`reportHashes`). Reporters can later opt to disclose the plaintext content of a specific report (`discloseReport`), which is verified on-chain and against the stored content hash.
- **Admin Membership Management CLI**: Off-chain admin tooling (`npm run admin:tree`) builds Merkle trees, persists state & proof vectors to JSON, and updates contract authority roots (`updateAuthorityRoot`).

---

## Contract Architecture (`contract/whistleblower.compact`)

### Ledger State
- `merkleRoot: Bytes<32>` — commitment to the current authorized identity set
- `reportCount: Counter` — total number of submitted reports
- `reportHashes: Map<Uint<64>, Bytes<32>>` — report content hash per report ID
- `nullifiers: Set<Bytes<32>>` — spent nullifiers preventing duplicate submissions
- `disclosedReports: Map<Uint<64>, Opaque<"string">>` — disclosed plaintext report contents

### Circuits
- `updateAuthorityRoot(newRoot: Bytes<32>)`: Admin sets or updates the Merkle tree root.
- `submitReport(secretIdentity, merklePath, pathDirections, reportHash)`: Proves Merkle tree membership and records report hash & nullifier.
- `getReportCount()`: Returns total report count.
- `discloseReport(reportId, secretIdentity, reportContent)`: Discloses report text, verifying report ID existence and matching nullifier.

---

## Quickstart & Environment Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Contract
Compiles `contract/whistleblower.compact` to managed TypeScript and ZK circuits:
```bash
npm run compile
```

### 3. Start Local Midnight Devnet
Starts local node, indexer, and proof server via Docker:
```bash
npm run env:up
```

### 4. Run Test Suite
Runs the Vitest suite against local devnet:
```bash
npm run test:local
```

---

## Admin Tooling CLI

Admin CLI script for managing authorized identity sets and updating the contract authority root:

```bash
# Build Merkle tree state JSON (default: 3 random identities -> merkle-tree-state.json):
npm run admin:tree -- --action=build

# Customize identity count and output file:
IDENTITY_COUNT=5 TREE_OUTPUT=my-tree.json npm run admin:tree -- --action=build

# Update authority root on-chain for a deployed contract:
CONTRACT_ADDRESS=<address> TREE_FILE=my-tree.json npm run admin:tree -- --action=update
```

---

## Project History & Version Tags

- `v0.1-single-authority`: Initial version with single trusted authority verifying direct commitment hash.
- `v0.2-merkle-authority`: Upgraded version featuring 8-level Merkle tree membership proofs, sentinel padding security, report content hashing, disclosure verification, and admin CLI tooling.
