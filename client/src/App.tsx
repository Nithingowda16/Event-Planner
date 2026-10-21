import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Cpu, Database, Layers } from 'lucide-react';
import './styles/global.css';

interface HealthState {
  status: 'idle' | 'checking' | 'connected' | 'disconnected';
  data?: {
    service: string;
    timestamp: string;
    uptimeSeconds: number;
  };
  error?: string;
}

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthState>({ status: 'idle' });

  const checkServerHealth = async () => {
    setHealth({ status: 'checking' });
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth({ status: 'connected', data });
    } catch (err: unknown) {
      setHealth({
        status: 'disconnected',
        error: err instanceof Error ? err.message : 'Failed to connect to backend',
      });
    }
  };

  useEffect(() => {
    checkServerHealth();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-4) 0',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', margin: 0 }}>CelebrateOS</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                AI-Powered Celebration & Event Planner
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor:
                  health.status === 'connected' ? 'var(--accent-emerald-soft)' : 'var(--accent-rose-soft)',
                color: health.status === 'connected' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'currentColor',
                }}
              />
              Backend:{' '}
              {health.status === 'checking'
                ? 'Connecting...'
                : health.status === 'connected'
                ? 'Online'
                : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: 'var(--space-8) 0' }}>
        <div className="container">
          <section
            aria-labelledby="foundation-title"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-6)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <Layers size={24} color="var(--accent-gold)" aria-hidden="true" />
              <h2 id="foundation-title" style={{ fontSize: '1.5rem' }}>
                Milestone 0: Monorepo Foundation & Workspace Scaffolding
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              Strict TypeScript monorepo configured with npm workspaces. Shared contracts and schemas are established,
              with backend authoritative budget execution and preview-only UI calculations.
            </p>

            {/* Architecture Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <ShieldCheck size={18} color="var(--accent-emerald)" aria-hidden="true" />
                  <h3 style={{ fontSize: '1rem' }}>Zero Key Leakage</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Gemini API keys, MongoDB URIs, and JWT secrets remain strictly backend-isolated.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <Database size={18} color="var(--accent-purple)" aria-hidden="true" />
                  <h3 style={{ fontSize: '1rem' }}>Authoritative Backend</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Deterministic budget allocation and invariant enforcement executed in server code.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <Cpu size={18} color="var(--accent-gold)" aria-hidden="true" />
                  <h3 style={{ fontSize: '1rem' }}>Proposal Diff Engine</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Revisions require user approval with baseEventVersion verification to prevent stale updates.
                </p>
              </div>
            </div>
          </section>

          {/* Health Status Diagnostic */}
          <section
            aria-labelledby="diagnostic-title"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 id="diagnostic-title" style={{ fontSize: '1.25rem' }}>
                Environment Diagnostics
              </h2>
              <button
                type="button"
                onClick={checkServerHealth}
                style={{
                  backgroundColor: 'var(--accent-gold-soft)',
                  color: 'var(--accent-gold)',
                  border: '1px solid var(--accent-gold)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                Re-check API Health
              </button>
            </div>

            {health.status === 'connected' && health.data && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--accent-emerald-soft)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-emerald)',
                }}
              >
                <CheckCircle2 size={20} aria-hidden="true" />
                <span>
                  <strong>Connected to {health.data.service}</strong> — Timestamp: {health.data.timestamp} (Uptime: {health.data.uptimeSeconds}s)
                </span>
              </div>
            )}

            {health.status === 'disconnected' && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--accent-rose-soft)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-rose)',
                }}
              >
                Backend disconnected ({health.error}). Start backend with <code>npm run dev:server</code>.
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: 'var(--space-4) 0',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        <div className="container">
          CelebrateOS — PromptWars Challenge 5 Foundation Milestone
        </div>
      </footer>
    </div>
  );
};
