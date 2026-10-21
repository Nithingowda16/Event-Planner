import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../ui/ToastContext.js';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (isOpen && initialMode) {
      setMode(initialMode);
      setFormError(null);
      clearError();
    }
  }, [isOpen, initialMode, clearError]);

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
        showToast('Welcome back to Swakarya!', 'success');
      } else {
        await register({ fullName: fullName.trim(), email, password });
        showToast('Account registered successfully! Welcome to Swakarya.', 'success');
      }
      onClose();
    } catch {
      // Error handled by context
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Sign In to Swakarya' : 'Create Swakarya Account'}
      description="Authentication protects your celebrations, budget allocations, and timeline tasks with strict tenant isolation."
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button
            type="button"
            id="auth-toggle-mode-btn"
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
            id="auth-submit-btn"
            isLoading={isLoading}
            loadingText={mode === 'login' ? 'Signing in...' : 'Registering...'}
          >
            {mode === 'login' ? 'Sign In' : 'Register'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

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
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{formError || error}</span>
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
              leftIcon={<User size={16} />}
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
            leftIcon={<Mail size={16} />}
            required
          />

          <Input
            id="auth-password-input"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  width: '100%',
                  height: '100%',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
            helperText="Minimum 8 characters"
          />
        </form>
      </div>
    </Modal>
  );
};
