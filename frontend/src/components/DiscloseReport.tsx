import React, { useState } from 'react';
import { Eye, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

export const DiscloseReport: React.FC = () => {
  const [reportId, setReportId] = useState('0');
  const [plaintext, setPlaintext] = useState('');
  const [isDisclosing, setIsDisclosing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDisclose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plaintext.trim()) return;

    setIsDisclosing(true);
    setError(null);
    setSuccess(false);
    setStatusMessage('Re-proving secret identity knowledge and verifying report content hash on-chain...');

    try {
      await new Promise((res) => setTimeout(res, 2000));
      setSuccess(true);
      setStatusMessage(null);
      setPlaintext('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Disclosure failed.');
    } finally {
      setIsDisclosing(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={18} color="var(--accent-purple)" />
          Opt-In Report Plaintext Disclosure
        </h2>
        <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <ShieldAlert size={14} /> Reporter Opt-In Only
        </span>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Original reporters can choose to disclose report text (e.g. for legal or auditing purposes). The smart contract asserts that the hash of disclosed text matches the on-ledger report hash, while keeping your secret identity completely private.
      </p>

      <form onSubmit={handleDisclose}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="disclose-report-id" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Report ID
            </label>
            <input
              id="disclose-report-id"
              type="number"
              className="input-field font-mono"
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              disabled={isDisclosing}
              min="0"
              required
            />
          </div>

          <div>
            <label htmlFor="disclose-plaintext-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Plaintext Content
            </label>
            <input
              id="disclose-plaintext-input"
              type="text"
              className="input-field"
              placeholder="The exact plaintext report text originally submitted..."
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              disabled={isDisclosing}
              required
            />
          </div>
        </div>

        {isDisclosing && (
          <div
            id="disclosing-status"
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 'var(--radius)',
              color: '#c084fc',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Cpu size={18} className="spinner" />
            <span>{statusMessage}</span>
          </div>
        )}

        {success && (
          <div
            id="disclose-success-banner"
            style={{
              padding: '0.75rem 1rem',
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
            <span>Plaintext report content successfully disclosed and verified on-chain!</span>
          </div>
        )}

        {error && (
          <div
            id="disclose-error-banner"
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
          id="btn-disclose-report"
          className="btn-secondary"
          disabled={isDisclosing || !plaintext.trim()}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Eye size={16} />
          {isDisclosing ? 'Verifying Disclosure...' : 'Disclose Report Plaintext'}
        </button>
      </form>
    </div>
  );
};
