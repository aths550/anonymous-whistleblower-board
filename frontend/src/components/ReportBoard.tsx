import React, { useState } from 'react';
import { Database, Eye, EyeOff, Hash, CheckCircle2 } from 'lucide-react';

export interface ReportItem {
  id: number;
  reportHash: string;
  nullifier: string;
  timestamp: string;
  disclosedContent?: string;
}

const SAMPLE_REPORTS: ReportItem[] = [
  {
    id: 0,
    reportHash: '7ec653cd...a14ea8eeca85',
    nullifier: '4a1b8c2d...9e01f2345678',
    timestamp: '2026-08-10 18:58:33 UTC',
    disclosedContent: 'The Q3 numbers were falsified.',
  },
  {
    id: 1,
    reportHash: '3f8e91a2...c456b7890123',
    nullifier: '8d2e1f4a...6b7c8d9e0123',
    timestamp: '2026-08-10 19:19:30 UTC',
  },
];

export const ReportBoard: React.FC = () => {
  const [reports] = useState<ReportItem[]>(SAMPLE_REPORTS);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={18} color="var(--accent-cyan)" />
          Ledger Report Board & Indexer Feed
        </h2>
        <span className="badge badge-preview">
          Total Reports: {reports.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reports.map((report) => (
          <div
            key={report.id}
            id={`report-item-${report.id}`}
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius)',
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="font-mono" style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                  Report #{report.id}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{report.timestamp}</span>
              </div>

              {report.disclosedContent ? (
                <span className="badge badge-privacy">
                  <Eye size={13} /> Disclosed
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <EyeOff size={13} /> Anonymous Hash Only
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>On-Ledger Report Hash (SHA-256):</span>
                <code className="font-mono" style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                  <Hash size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {report.reportHash}
                </code>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Spent Nullifier (Unlinkable):</span>
                <code className="font-mono" style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                  {report.nullifier}
                </code>
              </div>
            </div>

            {report.disclosedContent && (
              <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--badge-green-text)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                  <CheckCircle2 size={13} /> Verified Plaintext Content:
                </span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', background: 'rgba(16, 185, 129, 0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  "{report.disclosedContent}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
