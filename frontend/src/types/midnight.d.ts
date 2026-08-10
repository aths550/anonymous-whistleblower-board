export interface MidnightProvider {
  name: string;
  apiVersion: string;
  icon?: string;
  connect(networkId: string): Promise<MidnightConnectedAPI>;
}

export interface MidnightConnectedAPI {
  networkId(): Promise<string>;
  getUnshieldedAddress(): Promise<{ address: string }>;
  submitTx?(tx: unknown): Promise<string>;
  calculateProof?(circuit: string, args: unknown[]): Promise<unknown>;
}

declare global {
  interface Window {
    midnight?: Record<string, MidnightProvider>;
  }
}
