# Anonymous Whistleblower Board

Submit reports/tips that are cryptographically verifiable as coming from an "authorized" source, without revealing which one.

---

## Project Vision

The **Anonymous Whistleblower Board** provides a privacy-preserving whistleblower reporting mechanism built on the **Midnight Network** using the **Compact** smart contract language and zero-knowledge cryptography.

### The Public vs. Private Privacy Guarantee
> *"An observer can see that report #N was submitted by someone in the authorized set (via zero-knowledge Merkle inclusion proofs), and later (if the reporter chooses) see what it said — but can **NEVER** discover who submitted it, before or after disclosure."*

- **Zero-Knowledge Membership**: Proves identity inclusion in an 8-level Merkle tree (up to 256 authorized members) without disclosing *which* leaf matches.
- **Sentinel Padding Security**: Empty leaves in the Merkle tree are padded with a domain-separated sentinel leaf (`PADDING_LEAF`), preventing raw/zero-byte identity impersonation.
- **Nullifier Unlinkability**: A spent nullifier set prevents duplicate report submissions without linking back to the reporter's secret identity.
- **On-Ledger Content Hashing & Opt-In Plaintext Disclosure**: Submissions record SHA-256 report hashes on-ledger (`reportHashes`). Reporters can later opt to disclose plaintext report contents (`discloseReport`), which are verified on-chain against the stored report hash.

---

## Smart Contract Deployment

- **Network:** Preview (`preview`)
- **Deployed contract ID:** `[PENDING — run: npm run deploy -- --network preview]` (Faucet funding required on Preview via https://faucet.preview.midnight.network)
- **Local Devnet Deployment ID:** `0507a72d3e18a804db2c37dbec9a18fa300662d51b34bd9dfaa9dd800bbdfbd1`

---

## Key Features

1. **Compact Smart Contract (`contract/whistleblower.compact`)**:
   - `updateAuthorityRoot`: Admin registers or updates the authorized identity Merkle root.
   - `submitReport`: Submits anonymous reports with ZK inclusion proofs and spent nullifiers.
   - `getReportCount`: Reads total submitted report count.
   - `discloseReport`: Opt-in reporter plaintext content disclosure verified on-chain.
2. **Off-Chain Merkle & Sentinel Padding (`src/merkle.ts`)**:
   - Matches Compact `persistentHash` byte-for-byte using `@midnight-ntwrk/compact-runtime`.
   - Domain-separated sentinel padding leaf prevents zero-byte identity impersonation.
   - SHA-256 report content hashing (`hashReportContent`).
3. **Admin Membership CLI (`scripts/admin-tree.ts`)**:
   - Tooling to build Merkle tree state JSON off-chain and submit `updateAuthorityRoot` transactions on-chain.
4. **React + Vite + TypeScript Frontend (`frontend/`)**:
   - DApp Connector hook discovering installed Midnight wallet extension (`window.midnight`).
   - Wallet connection navbar with Preview network badge and error handling.
   - Anonymous report submission interface with real-time ZK proof generation loading state and **"Proved without revealing your input"** privacy badge.
   - Indexer-powered report board feed displaying on-ledger report hashes, nullifiers, and disclosed plaintext entries.
   - `secretIdentity` is strictly handled in transient memory and **NEVER** saved in React state, UI, or console logs.

---

## Future Scope

- **Multi-Authority Threshold Signature Roots**: Supporting multi-sig admin approvals before publishing authority root updates.
- **Encrypted Legal Communications**: End-to-end encrypted messaging channels between whistleblowers and legal teams using Midnight private state channels.
- **Dynamic Merkle Subtrees**: Extending Merkle capacity beyond 256 leaves using multi-layer subtrees for enterprise whistleblower programs.

---

## Tech Stack

- **Blockchain & ZK Engine**: Midnight Network (Compact Language v0.16 / Compact Compiler 0.31.1)
- **Client Libraries**: `midnight-js` (`@midnight-ntwrk/midnight-js-contracts`, `@midnight-ntwrk/compact-runtime`, `@midnight-ntwrk/testkit-js`)
- **Frontend Framework**: React 18 + TypeScript + Vite + Lucide Icons
- **Testing & Tooling**: Vitest, Node.js (>=22.0.0), Docker (Midnight Node, Indexer, Proof Server)

---

## Local Development

### 1. Install Dependencies
```bash
npm install
npm --prefix frontend install
```

### 2. Compile Contract
```bash
npm run compile
```

### 3. Start Local Midnight Devnet
```bash
npm run env:up
```

### 4. Run Test Suite
```bash
npm run test:local
```

### 5. Launch Frontend Dev Server
```bash
npm run frontend:dev
```

### 6. Build Frontend for Production
```bash
npm run frontend:build
```

### 7. Run Admin Merkle CLI Tool
```bash
# Build Merkle tree state JSON:
npm run admin:tree -- --action=build

# Update authority root on-chain:
CONTRACT_ADDRESS=<address> npm run admin:tree -- --action=update
```

---

## Versions

- `v0.1-single-authority`: Initial single trusted authority version.
- `v0.2-merkle-authority`: Merkle-tree membership proofs (8-level tree, up to 256 identities).
- `v0.3-hardened-merkle-admin`: Sentinel padding security, report hash verification, and admin CLI tooling.
- `v0.4-fullstack-dapp`: React + Vite + TypeScript frontend, DApp connector integration, Preview network support, and contract deploy script.
