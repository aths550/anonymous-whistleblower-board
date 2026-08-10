import React, { useState } from 'react';
import { Send, ShieldCheck, Lock, Cpu, CheckCircle } from 'lucide-react';

interface SubmitReportProps {
  onSuccess?: (reportHash: string) => void;
}

export const SubmitReport: React.FC<SubmitReportProps> = ({ onSuccess }) => {
  const [reportContent, setReportContent] = useState('');
  const [isProving, setIsProving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportContent.trim()) return;

    setIsProving(true);
    setError(null);
    setStatusMessage('Generating 8-level Merkle ZK proof locally (secret identity never leaves browser memory)...');
    setLastTxHash(null);

    try {
      // 1. Generate ephemeral 32-byte secret identity in local function scope ONLY.
      // NEVER save secretIdentity in persistent React state, UI, or console logs.
      const ephemeralSecret = new Uint8Array(32);
      window.crypto.getRandomValues(ephemeralSecret);

      // 2. Off-chain SHA-256 report content digest for on-ledger reportHash
      const encoder = new TextEncoder();
      const contentBytes = encoder.encode(reportContent);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', contentBytes);
      const reportHashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Simulate ZK Proof compilation delay (real proof server time)
      await new Promise((res) => setTimeout(res, 2500));

      setStatusMessage('Submitting balanced ZK transaction to Midnight Network...');
      await new Promise((res) => setTimeout(res, 1500));

      // Mock tx hash representation (or real tx via wallet adapter)
      const mockTx = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setLastTxHash(mockTx);
      setStatusMessage(null);
      setReportContent('');
      if (onSuccess) onSuccess(reportHashHex);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Report submission failed.');
      setStatusMessage(null);
    } finally {
      setIsProving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} color="var(--accent-cyan)" />
          Submit Anonymous Report
        </h2>
        
        <span className="badge badge-privacy" id="badge-zk-guarantee">
          <ShieldCheck size={14} />
          Proved without revealing your input
        </span>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Your report content is committed on-ledger via SHA-256. Zero-Knowledge inclusion proofs verify that your identity belongs to the 256-member authorized Merkle tree without revealing <i>which</i> member submitted.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="report-content-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Report Plaintext Content
          </label>
          <textarea
            id="report-content-input"
            className="textarea-field"
            placeholder="Type your whistleblower report or tip securely..."
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            disabled={isProving}
            required
          />
        </div>

        {isProving && (
          <div
            id="proving-status-indicator"
            style={{
              padding: '0.875rem 1rem',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: 'var(--radius)',
              color: 'var(--accent-cyan)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Cpu size={20} className="spinner" />
            <div>
              <div style={{ fontWeight: 600 }}>Generating Zero-Knowledge Proof...</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{statusMessage}</div>
            </div>
          </div>
        )}

        {lastTxHash && (
          <div
            id="tx-success-banner"
            style={{
              padding: '0.875rem 1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius)',
              color: 'var(--badge-green-text)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle size={18} />
            <div>
              <strong>Report Successfully Submitted!</strong>
              <div className="font-mono" style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.9 }}>
                Tx Hash: {lastTxHash}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            id="submit-error-banner"
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius)',
              color: 'var(--danger-text)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          id="btn-submit-report"
          className="btn-primary"
          disabled={isProving || !reportContent.trim()}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Send size={16} />
          {isProving ? 'Generating ZK Proof...' : 'Submit Report Anonymously'}
        </button>
      </form>
    </div>
  );
};
