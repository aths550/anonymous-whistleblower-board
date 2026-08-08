import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomBytes } from 'node:crypto';
import pino from 'pino';
import { submitCallTx, deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type EnvironmentConfiguration, waitForFunds } from '@midnight-ntwrk/testkit-js';
import { persistentHash, CompactTypeBytes } from '@midnight-ntwrk/compact-runtime';
import { getConfig } from '../config.js';
import { MidnightWalletProvider, syncWallet, type WalletSecret } from '../wallet.js';
import { buildProviders, type WhistleblowerProviders } from '../providers.js';
import {
    CompiledWhistleblowerContract,
    ledger,
    zkConfigPath,
} from '../../contract/index.js';
import { Contract } from '../../contract/managed/whistleblower/contract/index.js';
import { createWhistleblowerPrivateState } from '../../contract/witnesses.js';
import type { FinalizedCallTxData } from '@midnight-ntwrk/midnight-js-contracts';

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  console.error('Promise:', promise);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

type Role = 'ADMIN' | 'REPORTER';

const LOCAL_SEEDS: Record<Role, string> = {
    ADMIN:    '0000000000000000000000000000000000000000000000000000000000000001',
    REPORTER: '0000000000000000000000000000000000000000000000000000000000000002',
};

function resolveSecret(net: string, role: Role): WalletSecret {
    if (net === 'local') return { kind: 'seed', value: LOCAL_SEEDS[role] };

    const upper = net.toUpperCase();
    const mnemonicEnv = `MIDNIGHT_${upper}_${role}_MNEMONIC`;
    const seedEnv = `MIDNIGHT_${upper}_${role}_SEED`;
    const mnemonic = process.env[mnemonicEnv]?.trim().replace(/\s+/g, ' ');
    const seedHex = process.env[seedEnv]?.trim();

    if (mnemonic && seedHex) {
        throw new Error(`Set only one of ${mnemonicEnv} or ${seedEnv} (both are defined).`);
    }
    if (mnemonic) return { kind: 'mnemonic', value: mnemonic };
    if (seedHex) {
        if (!/^[0-9a-fA-F]+$/.test(seedHex) || seedHex.length % 2 !== 0) {
            throw new Error(`${seedEnv} must be a hex string of even length (no 0x prefix).`);
        }
        return { kind: 'seed', value: seedHex };
    }
    throw new Error(`Either ${mnemonicEnv} or ${seedEnv} is required for network '${net}'.`);
}

const ADMIN_PRIVATE_ID = 'adminPrivateState';
const REPORTER_PRIVATE_ID = 'reporterPrivateState';

const logger = pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    transport: { target: 'pino-pretty' },
});

const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';

const bytes32Type = new CompactTypeBytes(32);
function hashIdentity(secretIdentity: Uint8Array): Uint8Array {
    return persistentHash(bytes32Type, secretIdentity);
}

describe(`Anonymous Whistleblower Board via midnight-js (${network})`, () => {
    let adminWallet: MidnightWalletProvider;
    let reporterWallet: MidnightWalletProvider;
    let adminProviders: WhistleblowerProviders;
    let reporterProviders: WhistleblowerProviders;
    let contractAddress: ContractAddress;

    const config = getConfig();
    const adminSecret = resolveSecret(network, 'ADMIN');
    const reporterSecret = resolveSecret(network, 'REPORTER');
    const isRemote = network !== 'local';
    const syncTimeoutMs = Number(
        process.env['MIDNIGHT_SYNC_TIMEOUT_MS'] ?? (isRemote ? 3 * 60 * 60_000 : 10 * 60_000),
    );

    const secretIdentity = randomBytes(32);
    const wrongIdentity = randomBytes(32);
    const authorityCommitment = hashIdentity(secretIdentity);

    async function queryLedger(providers: WhistleblowerProviders) {
        const state = await providers.publicDataProvider.queryContractState(contractAddress);
        expect(state).not.toBeNull();
        return ledger(state!.data);
    }

    beforeAll(async () => {
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

        adminWallet = await MidnightWalletProvider.build(logger, envConfig, adminSecret);
        await adminWallet.start();
        await syncWallet(logger, adminWallet.wallet, syncTimeoutMs);

        reporterWallet = await MidnightWalletProvider.build(logger, envConfig, reporterSecret);
        await reporterWallet.start();
        await syncWallet(logger, reporterWallet.wallet, syncTimeoutMs);

        if (isRemote) {
            for (const [name, w] of [
                ['Admin', adminWallet],
                ['Reporter', reporterWallet],
            ] as const) {
                const nightBalance = await waitForFunds(w.wallet, envConfig, false, w.unshieldedKeystore);
                logger.info(`${name} NIGHT balance on '${network}': ${nightBalance}`);
            }
        }

        adminProviders = buildProviders(adminWallet, zkConfigPath, config);
        reporterProviders = buildProviders(reporterWallet, zkConfigPath, config);

        logger.info(`Providers initialized on '${network}', ready to test.`);
    });

    afterAll(async () => {
        if (adminWallet) await adminWallet.stop();
        if (reporterWallet) await reporterWallet.stop();
    });

    it('deploys the contract', async () => {
        const deployed: any = await (deployContract<Contract>)(adminProviders, {
            compiledContract: CompiledWhistleblowerContract,
            privateStateId: ADMIN_PRIVATE_ID,
            initialPrivateState: createWhistleblowerPrivateState(),
            args: [],
        });

        contractAddress = deployed.deployTxData.public.contractAddress;
        adminProviders.privateStateProvider.setContractAddress(contractAddress);

        logger.info(`Contract deployed at: ${contractAddress}`);
        expect(contractAddress).toBeDefined();

        const state = await queryLedger(adminProviders);
        expect(state.reportCount).toEqual(0n);
    });

    it('registers the authority commitment', async () => {
        await (submitCallTx<Contract, 'registerAuthority'>)(adminProviders, {
            compiledContract: CompiledWhistleblowerContract,
            contractAddress,
            privateStateId: ADMIN_PRIVATE_ID,
            circuitId: 'registerAuthority',
            args: [authorityCommitment],
        });

        const state = await queryLedger(adminProviders);
        expect(state.authorityCommitment).toEqual(authorityCommitment);
    });

    it('allows an authorized identity to submit a report, exposing only the nullifier', async () => {
        reporterProviders.privateStateProvider.setContractAddress(contractAddress);
        await reporterProviders.privateStateProvider.set(
            REPORTER_PRIVATE_ID,
            createWhistleblowerPrivateState(),
        );

        const reportHash = randomBytes(32);

        await (submitCallTx<Contract, 'submitReport'>)(reporterProviders, {
            compiledContract: CompiledWhistleblowerContract,
            contractAddress,
            privateStateId: REPORTER_PRIVATE_ID,
            circuitId: 'submitReport',
            args: [secretIdentity, reportHash],
        });

        const state = await queryLedger(reporterProviders);
        expect(state.reportCount).toEqual(1n);

        const nullifier = hashIdentity(secretIdentity);
        expect(state.nullifiers.member(nullifier)).toBeTruthy();

        const stateJson = JSON.stringify(state, (_key, value) =>
            value instanceof Uint8Array ? Buffer.from(value).toString('hex') : value,
        );
        expect(stateJson).not.toContain(Buffer.from(secretIdentity).toString('hex'));
    });

    it('rejects a duplicate submission from the same identity', async () => {
        const reportHash = randomBytes(32);
        await expect(async () => {
            await (submitCallTx<Contract, 'submitReport'>)(reporterProviders, {
                compiledContract: CompiledWhistleblowerContract,
                contractAddress,
                privateStateId: REPORTER_PRIVATE_ID,
                circuitId: 'submitReport',
                args: [secretIdentity, reportHash],
            });
        }).rejects.toThrow();
    });

    it('rejects submission from an unauthorized identity', async () => {
        const reportHash = randomBytes(32);
        await expect(async () => {
            await (submitCallTx<Contract, 'submitReport'>)(reporterProviders, {
                compiledContract: CompiledWhistleblowerContract,
                contractAddress,
                privateStateId: REPORTER_PRIVATE_ID,
                circuitId: 'submitReport',
                args: [wrongIdentity, reportHash],
            });
        }).rejects.toThrow();
    });

    it('allows the original reporter to disclose their report content', async () => {
        const reportContent = 'The Q3 numbers were falsified.';

        await (submitCallTx<Contract, 'discloseReport'>)(reporterProviders, {
            compiledContract: CompiledWhistleblowerContract,
            contractAddress,
            privateStateId: REPORTER_PRIVATE_ID,
            circuitId: 'discloseReport',
            args: [0n, secretIdentity, reportContent],
        });

        const state = await queryLedger(reporterProviders);
        expect(state.disclosedReports.member(0n)).toBeTruthy();
    });
});
