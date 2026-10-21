import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../ui/ToastContext.js';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, demoLogin, isLoading, error, clearError } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (mode === 'register' && (!fullName || fullName.trim().length < 2)) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }

    try {
      if (mode === 'login') {
        await login({ email, password });
        showToast('Welcome back to CelebrateOS!', 'success');
      } else {
        await register({ fullName: fullName.trim(), email, password });
        showToast('Account registered successfully! Welcome to CelebrateOS.', 'success');
      }
      onClose();
    } catch {
      // Error handled by context
    }
  };

  const handleDemo = async () => {
    try {
      await demoLogin();
      showToast('Logged in as Demo Planner. You can now create and manage real server events.', 'success');
      onClose();
    } catch {
      // Error handled in context
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Sign In to CelebrateOS' : 'Create CelebrateOS Account'}
      description="Authentication protects your celebrations, budget allocations, and timeline tasks with strict tenant isolation."
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setFormError(null);
              clearError();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-gold)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign In'}
          </button>

          <Button
            variant="primary"
            type="submit"
            form="auth-form"
            isLoading={isLoading}
            loadingText={mode === 'login' ? 'Signing in...' : 'Registering...'}
          >
            {mode === 'login' ? 'Sign In' : 'Register'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Quick Demo Access */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--accent-gold-soft)',
            border: '1px solid var(--accent-gold-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Quick Planner Access
            </p>
            <p style={{ margin: 'var(--space-0-5) 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Instant access for evaluation & testing
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles size={16} />}
            onClick={handleDemo}
            isLoading={isLoading}
            id="quick-demo-login-btn"
          >
            Demo Sign In
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 'var(--space-1) 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
        </div>

        {(formError || error) && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--accent-rose-soft)',
              border: '1px solid rgba(251, 113, 133, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {formError || error}
          </div>
        )}

        <form id="auth-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {mode === 'register' && (
            <Input
              id="auth-name-input"
              label="Full Name"
              placeholder="e.g. Maya Lin"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}

          <Input
            id="auth-email-input"
            label="Email Address"
            type="email"
            placeholder="planner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="auth-password-input"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="Minimum 8 characters"
          />
        </form>
      </div>
    </Modal>
  );
};
