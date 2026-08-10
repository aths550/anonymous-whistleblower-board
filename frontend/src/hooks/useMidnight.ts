import { useState, useEffect, useCallback } from 'react';
import type { MidnightProvider, MidnightConnectedAPI } from '../types/midnight';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  networkId: string | null;
  error: string | null;
  providerName: string | null;
  api: MidnightConnectedAPI | null;
}

export function useMidnight() {
  const targetNetwork = import.meta.env.VITE_NETWORK || 'preview';
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    networkId: null,
    error: null,
    providerName: null,
    api: null,
  });

  const getInstalledProvider = useCallback((): { name: string; provider: MidnightProvider } | null => {
    if (typeof window === 'undefined' || !window.midnight) {
      return null;
    }
    const providers = Object.entries(window.midnight);
    if (providers.length === 0) return null;
    const [name, provider] = providers[0];
    return { name, provider };
  }, []);

  const connect = useCallback(async () => {
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const installed = getInstalledProvider();
      if (!installed) {
        throw new Error('Midnight Wallet extension not detected in browser. Please install Midnight Lace wallet.');
      }

      const connectedApi = await installed.provider.connect(targetNetwork);
      const network = await connectedApi.networkId();

      if (network !== targetNetwork && targetNetwork !== 'undeployed') {
        throw new Error(
          `Wallet connected to '${network}', but app requires '${targetNetwork}'. Please switch network in wallet.`
        );
      }

      const { address } = await connectedApi.getUnshieldedAddress();

      setWalletState({
        isConnected: true,
        isConnecting: false,
        address,
        networkId: network,
        error: null,
        providerName: installed.name,
        api: connectedApi,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setWalletState({
        isConnected: false,
        isConnecting: false,
        address: null,
        networkId: null,
        error: msg,
        providerName: null,
        api: null,
      });
    }
  }, [getInstalledProvider, targetNetwork]);

  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      isConnecting: false,
      address: null,
      networkId: null,
      error: null,
      providerName: null,
      api: null,
    });
  }, []);

  useEffect(() => {
    const installed = getInstalledProvider();
    if (!installed) {
      setWalletState((prev) => ({
        ...prev,
        error: 'Midnight Wallet extension not found. Install Midnight Lace extension to interact with Preview Network.',
      }));
    }
  }, [getInstalledProvider]);

  return {
    ...walletState,
    targetNetwork,
    connect,
    disconnect,
  };
}
