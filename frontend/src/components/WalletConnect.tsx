import React from 'react';
import { Shield, Wallet, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useMidnight } from '../hooks/useMidnight';

export const WalletConnect: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    address,
    networkId,
    error,
    targetNetwork,
    connect,
    disconnect,
  } = useMidnight();

  const truncateAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  return (
    <header className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
            <Shield size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Anonymous Whistleblower Board
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Zero-Knowledge Verifiable Submissions • Midnight Network
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="badge badge-preview" id="badge-network-target">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'inline-block' }}></span>
            Network: {networkId || targetNetwork}
          </span>

          {isConnected && address ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-privacy font-mono" id="wallet-address-badge">
                <CheckCircle2 size={14} />
                {truncateAddress(address)}
              </span>
              <button
                id="btn-disconnect-wallet"
                onClick={disconnect}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              id="btn-connect-wallet"
              onClick={connect}
              disabled={isConnecting}
              className="btn-primary"
            >
              {isConnecting ? (
                <>
                  <RefreshCw size={16} className="spinner" />
                  Connecting Wallet...
                </>
              ) : (
                <>
                  <Wallet size={16} />
                  Connect Midnight Wallet
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          id="wallet-error-banner"
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: 'var(--danger-text)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </header>
  );
};
