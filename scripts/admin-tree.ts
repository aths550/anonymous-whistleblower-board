import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import pino from 'pino';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { buildMerkleTree, getMerkleProof, hashLeaf } from '../src/merkle.js';
import { getConfig } from '../src/config.js';
import { MidnightWalletProvider, syncWallet, type WalletSecret } from '../src/wallet.js';
import { buildProviders } from '../src/providers.js';
import { CompiledWhistleblowerContract, zkConfigPath } from '../contract/index.js';
import type { Contract } from '../contract/managed/whistleblower/contract/index.js';

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

export interface IdentityProof {
  index: number;
  secretIdentity: string; // hex
  leaf: string; // hex
  merklePath: string[]; // hex[]
  pathDirections: boolean[];
}

export interface MerkleTreeState {
  merkleRoot: string; // hex
  count: number;
  identities: IdentityProof[];
}

export function toHex(buf: Uint8Array): string {
  return Buffer.from(buf).toString('hex');
}

export function fromHex(hex: string): Uint8Array {
  return Buffer.from(hex, 'hex');
}

export function buildAndPersistTreeState(
  secretIdentitiesHex: string[],
  outputPath?: string,
): MerkleTreeState {
  const secrets = secretIdentitiesHex.map(fromHex);
  const { root, layers } = buildMerkleTree(secrets);

  const identities: IdentityProof[] = secrets.map((sec, idx) => {
    const leaf = hashLeaf(sec);
    const { merklePath, pathDirections } = getMerkleProof(layers, idx);
    return {
      index: idx,
      secretIdentity: toHex(sec),
      leaf: toHex(leaf),
      merklePath: merklePath.map(toHex),
      pathDirections,
    };
  });

  const state: MerkleTreeState = {
    merkleRoot: toHex(root),
    count: secrets.length,
    identities,
  };

  if (outputPath) {
    const fullPath = resolve(outputPath);
    writeFileSync(fullPath, JSON.stringify(state, null, 2), 'utf-8');
    logger.info(`Persisted Merkle tree state (${secrets.length} identities) to ${fullPath}`);
  }

  return state;
}

export async function updateAuthorityRootOnChain(
  contractAddress: ContractAddress,
  merkleRootHex: string,
  network: string = process.env['MIDNIGHT_NETWORK'] ?? 'local',
): Promise<void> {
  const config = getConfig();
  setNetworkId(config.networkId);

  const envConfig: EnvironmentConfiguration = {
    walletNetworkId: config.networkId,
    networkId: config.networkId,
    indexer: config.indexer,
    indexerWS: config.indexerWS,
    node: config.node,
    nodeWS: config.nodeWS,
    faucet: config.faucet,
    proofServer: config.proofServer,
  };

  const seed = process.env['MIDNIGHT_ADMIN_SEED'] ?? '0000000000000000000000000000000000000000000000000000000000000001';
  const secret: WalletSecret = { kind: 'seed', value: seed };

  const wallet = await MidnightWalletProvider.build(logger, envConfig, secret);
  await wallet.start();
  try {
    await syncWallet(logger, wallet.wallet, 300_000);
    const providers = buildProviders(wallet, zkConfigPath, config);
    providers.privateStateProvider.setContractAddress(contractAddress);

    const rootBytes = fromHex(merkleRootHex);
    logger.info(`Submitting updateAuthorityRoot on-chain for root: ${merkleRootHex}`);

    await (submitCallTx<Contract, 'updateAuthorityRoot'>)(providers, {
      compiledContract: CompiledWhistleblowerContract,
      contractAddress,
      privateStateId: 'adminPrivateState',
      circuitId: 'updateAuthorityRoot',
      args: [rootBytes],
    });

    logger.info(`Successfully updated authority root on-chain!`);
  } finally {
    await wallet.stop();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const actionArg = args.find((a) => a.startsWith('--action='))?.split('=')[1] ?? args[0] ?? 'build';

  if (actionArg === 'build' || actionArg === '--build') {
    const countArg = Number(process.env['IDENTITY_COUNT'] ?? 3);
    const secretIdentitiesHex = Array.from({ length: countArg }, () => toHex(randomBytes(32)));
    const outPath = process.env['TREE_OUTPUT'] ?? 'merkle-tree-state.json';
    const state = buildAndPersistTreeState(secretIdentitiesHex, outPath);
    logger.info(`Built tree root: ${state.merkleRoot}`);
  } else if (actionArg === 'update' || actionArg === '--update') {
    const contractAddr = process.env['CONTRACT_ADDRESS'] as ContractAddress;
    const treeFile = process.env['TREE_FILE'] ?? 'merkle-tree-state.json';
    if (!contractAddr) {
      throw new Error('CONTRACT_ADDRESS environment variable is required for --update');
    }
    const state: MerkleTreeState = JSON.parse(readFileSync(treeFile, 'utf-8'));
    await updateAuthorityRootOnChain(contractAddr, state.merkleRoot);
  } else {
    console.log(`
Usage:
  # Build Merkle tree state JSON:
  npm run admin:tree -- --action=build
  IDENTITY_COUNT=5 TREE_OUTPUT=my-tree.json npm run admin:tree -- --action=build

  # Update authority root on-chain:
  CONTRACT_ADDRESS=<address> TREE_FILE=my-tree.json npm run admin:tree -- --action=update
`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logger.error(`admin-tree failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    process.exitCode = 1;
  });
}
