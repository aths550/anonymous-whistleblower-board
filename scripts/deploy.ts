import pino from 'pino';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { getConfig } from '../src/config.js';
import { MidnightWalletProvider, syncWallet, type WalletSecret } from '../src/wallet.js';
import { buildProviders } from '../src/providers.js';
import { CompiledWhistleblowerContract, zkConfigPath } from '../contract/index.js';
import { createWhistleblowerPrivateState } from '../contract/witnesses.js';
import type { Contract } from '../contract/managed/whistleblower/contract/index.js';

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

export async function deployWhistleblowerContract(network: string = process.env['MIDNIGHT_NETWORK'] ?? 'local'): Promise<ContractAddress> {
  process.env['MIDNIGHT_NETWORK'] = network;
  const config = getConfig();
  setNetworkId(config.networkId);

  logger.info(`Deploying Anonymous Whistleblower Board contract to network '${network}' (ID: ${config.networkId})...`);

  const seed = process.env['MIDNIGHT_ADMIN_SEED'] ?? '0000000000000000000000000000000000000000000000000000000000000001';
  const secret: WalletSecret = { kind: 'seed', value: seed };

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

  const wallet = await MidnightWalletProvider.build(logger, envConfig, secret);
  await wallet.start();

  try {
    const isRemote = network !== 'local';
    const syncTimeoutMs = isRemote ? 300_000 : 120_000;

    logger.info(`Syncing wallet on '${network}'...`);
    await syncWallet(logger, wallet.wallet, syncTimeoutMs);

    const providers = buildProviders(wallet, zkConfigPath, config);
    logger.info(`Deploying contract transaction...`);

    const deployed: any = await (deployContract<Contract>)(providers, {
      compiledContract: CompiledWhistleblowerContract,
      privateStateId: 'adminPrivateState',
      initialPrivateState: createWhistleblowerPrivateState(),
      args: [],
    });

    const address = deployed.deployTxData.public.contractAddress as ContractAddress;
    logger.info(`=======================================================`);
    logger.info(`Contract successfully deployed to '${network}'!`);
    logger.info(`Contract Address: ${address}`);
    logger.info(`=======================================================`);

    return address;
  } catch (err: unknown) {
    if (network === 'preview') {
      logger.error(`Preview deployment requires funded wallet balance.`);
      logger.error(`Please fund wallet at: https://faucet.preview.midnight.network`);
    }
    throw err;
  } finally {
    await wallet.stop();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const netArg = args.find((a) => a.startsWith('--network='))?.split('=')[1] ?? process.env['MIDNIGHT_NETWORK'] ?? 'local';
  try {
    const address = await deployWhistleblowerContract(netArg);
    console.log(`\nDeployment Address: ${address}`);
  } catch (err) {
    logger.error(`Deployment failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
