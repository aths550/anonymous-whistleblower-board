import React from 'react';
import { WalletConnect } from './components/WalletConnect';
import { SubmitReport } from './components/SubmitReport';
import { ReportBoard } from './components/ReportBoard';
import { DiscloseReport } from './components/DiscloseReport';
import { Shield, Sparkles, Server, Github } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <WalletConnect />

      <main>
        {/* Intro Hero Banner */}
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Privacy-Preserving Whistleblower System</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Submit verifiable reports anonymously using <b>Midnight Network Zero-Knowledge Proofs</b>. Membership is proven via an 8-level Merkle tree (up to 256 authorized identities). Nullifiers prevent double submission without revealing reporter identity.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <SubmitReport />
          <ReportBoard />
          <DiscloseReport />
        </div>
      </main>

      <footer style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Shield size={14} color="var(--accent-cyan)" /> Midnight ZK Protocol
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Server size={14} color="var(--accent-blue)" /> Preview Network
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Github size={14} /> Compact Smart Contract
          </span>
        </div>
        <p>© 2026 Anonymous Whistleblower Board • INTO the Midnight SPPU Bootcamp</p>
      </footer>
    </div>
  );
};

export default App;
