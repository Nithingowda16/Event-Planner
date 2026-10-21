import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LandingPage } from '../src/components/landing/LandingPage.js';
import { AuthModal } from '../src/components/auth/AuthModal.js';
import { SwakaryaLogo } from '../src/components/brand/SwakaryaLogo.js';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext.js';
import { tokenStorage, api } from '../src/services/api.js';
import { AuthProvider } from '../src/context/AuthContext.js';
import { ToastProvider } from '../src/components/ui/ToastContext.js';

// Test harness for Theme Toggle
const ThemeTestConsumer: React.FC = () => {
  const { theme, preference, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="active-theme">{theme}</span>
      <span data-testid="active-pref">{preference}</span>
      <button type="button" onClick={toggleTheme} data-testid="toggle-btn">
        Toggle
      </button>
      <button type="button" onClick={() => setTheme('light')} data-testid="set-light-btn">
        Set Light
      </button>
      <button type="button" onClick={() => setTheme('dark')} data-testid="set-dark-btn">
        Set Dark
      </button>
    </div>
  );
};

describe('Swakarya — Official Branding, Theme System & Demo Removal', () => {
  beforeEach(() => {
    tokenStorage.clear();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('1. Official Swakarya Brand & Tagline Verification', () => {
    it('renders the official lotus logo, Swakarya wordmark and exact tagline', () => {
      render(
        <ThemeProvider>
          <SwakaryaLogo size={40} showWordmark={true} showTagline={true} />
        </ThemeProvider>
      );

      // Lotus image
      const logoImg = screen.getByRole('img', { name: /swakarya lotus logo/i });
      expect(logoImg).toBeDefined();

      // Wordmark
      expect(screen.getByRole('heading', { level: 1, name: /^swakarya$/i })).toBeDefined();

      // Exact tagline
      expect(screen.getByText('Every Moment, Beautifully Planned.')).toBeDefined();
    });

    it('renders all required public sections with Swakarya identity and exact footer', () => {
      render(
        <ToastProvider>
          <LandingPage onOpenLogin={vi.fn()} onOpenRegister={vi.fn()} />
        </ToastProvider>
      );

      // 1. Navigation / Header
      expect(screen.getByRole('banner')).toBeDefined();
      expect(screen.getByRole('heading', { level: 1, name: /^swakarya$/i })).toBeDefined();
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeDefined();
      expect(screen.getAllByRole('link', { name: /^features$/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('link', { name: /^how it works$/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('link', { name: /^benefits$/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: /^log in$/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /^get started$/i })).toBeDefined();

      // 2. Hero Section with exact official tagline
      expect(screen.getAllByRole('heading', { level: 2, name: /every moment, beautifully planned/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/swakarya brings ai-assisted event planning/i)).toBeDefined();

      // 3. Problem & Solution
      expect(screen.getByText(/the traditional chaos/i)).toBeDefined();
      expect(screen.getByText(/the swakarya way/i)).toBeDefined();

      // 4. Features Section
      expect(screen.getByRole('heading', { level: 3, name: /ai planning proposals/i })).toBeDefined();
      expect(screen.getByRole('heading', { level: 3, name: /authoritative budget engine/i })).toBeDefined();
      expect(screen.getByRole('heading', { level: 3, name: /event timelines & tasks/i })).toBeDefined();
      expect(screen.getByRole('heading', { level: 3, name: /vendor quote tracking/i })).toBeDefined();

      // 5. Minimal Footer: © Swakarya 2026. All rights reserved.
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeDefined();
      expect(footer.textContent?.trim()).toBe('© Swakarya 2026. All rights reserved.');
    });
  });

  describe('2. Dark & Light Theme System Verification', () => {
    it('initializes default theme and toggles smoothly between light and dark', () => {
      render(
        <ThemeProvider>
          <ThemeTestConsumer />
        </ThemeProvider>
      );

      const activeTheme = screen.getByTestId('active-theme');
      const toggleBtn = screen.getByTestId('toggle-btn');

      // Default theme is dark
      expect(activeTheme.textContent).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // Toggle to light mode
      fireEvent.click(toggleBtn);
      expect(activeTheme.textContent).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('swakarya_theme')).toBe('light');

      // Toggle back to dark mode
      fireEvent.click(toggleBtn);
      expect(activeTheme.textContent).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('swakarya_theme')).toBe('dark');
    });

    it('persists theme preference across page reloads via localStorage', () => {
      localStorage.setItem('swakarya_theme', 'light');

      render(
        <ThemeProvider>
          <ThemeTestConsumer />
        </ThemeProvider>
      );

      // Successfully restored from localStorage
      expect(screen.getByTestId('active-theme').textContent).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('3. Demo Login Removal & Real Authentication', () => {
    it('verifies zero demo login buttons or demo shortcuts exist in AuthModal', () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <AuthModal isOpen={true} onClose={vi.fn()} />
          </ToastProvider>
        </AuthProvider>
      );

      // Ensure no demo button exists
      expect(screen.queryByText(/demo sign in/i)).toBeNull();
      expect(screen.queryByText(/quick planner access/i)).toBeNull();
      expect(screen.queryByText(/executive bypass/i)).toBeNull();
      expect(screen.queryByText(/instant access for evaluation/i)).toBeNull();
      expect(screen.queryByText(/or continue with email/i)).toBeNull();
      expect(screen.queryByTestId('quick-demo-login-btn')).toBeNull();

      // Ensure no hardcoded credentials are shown
      expect(screen.queryByText(/planner@celebrateos\.dev/i)).toBeNull();
      expect(screen.queryByText(/password123/i)).toBeNull();
    });

    it('toggles cleanly between real login and registration with Swakarya titles', async () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />
          </ToastProvider>
        </AuthProvider>
      );

      // Starts in login mode
      expect(screen.getByRole('heading', { name: /sign in to swakarya/i })).toBeDefined();
      expect(screen.queryByLabelText(/full name/i)).toBeNull();

      // Click "Need an account? Register"
      const toggleBtn = screen.getByRole('button', { name: /need an account\? register/i });
      fireEvent.click(toggleBtn);

      // Switched to register mode
      expect(screen.getByRole('heading', { name: /create swakarya account/i })).toBeDefined();
      expect(screen.getByLabelText(/full name/i)).toBeDefined();

      // Click "Already have an account? Sign In"
      const toggleBackBtn = screen.getByRole('button', { name: /already have an account\? sign in/i });
      fireEvent.click(toggleBackBtn);

      // Switched back to login mode
      expect(screen.getByRole('heading', { name: /sign in to swakarya/i })).toBeDefined();
      expect(screen.queryByLabelText(/full name/i)).toBeNull();
    });

    it('submits real credentials to API login endpoint', async () => {
      const loginSpy = vi.spyOn(api.auth, 'login').mockResolvedValueOnce({
        token: 'real-jwt-token-xyz',
        user: {
          id: 'usr-real-1',
          email: 'sarah@swakarya.com',
          fullName: 'Sarah Event Director',
          role: 'planner',
          createdAt: new Date().toISOString(),
        },
      });

      render(
        <AuthProvider>
          <ToastProvider>
            <AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />
          </ToastProvider>
        </AuthProvider>
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'sarah@swakarya.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'SecurePass2026!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(loginSpy).toHaveBeenCalledWith({
          email: 'sarah@swakarya.com',
          password: 'SecurePass2026!',
        });
      });
    });
  });

  describe('4. Authentication Guarding & No Direct Workspace/Dashboard Bypass (Requirement 15)', () => {
    it('prohibits direct dashboard or workspace bypass buttons on the public landing page', () => {
      render(
        <ToastProvider>
          <LandingPage onOpenLogin={vi.fn()} onOpenRegister={vi.fn()} />
        </ToastProvider>
      );

      // Verify no direct bypass buttons exist
      expect(screen.queryByText(/open dashboard/i)).toBeNull();
      expect(screen.queryByText(/enter workspace/i)).toBeNull();
      expect(screen.queryByText(/enter dashboard/i)).toBeNull();
      expect(screen.queryByText(/guest bypass/i)).toBeNull();
      expect(screen.queryByText(/skip login/i)).toBeNull();
    });

    it('routes user to credential-based authentication when clicking Get Started or Log In', () => {
      const openLoginSpy = vi.fn();
      const openRegisterSpy = vi.fn();

      render(
        <ToastProvider>
          <LandingPage onOpenLogin={openLoginSpy} onOpenRegister={openRegisterSpy} />
        </ToastProvider>
      );

      // Click "Log In" in nav
      const loginNavBtn = screen.getAllByRole('button', { name: /^log in$/i })[0];
      fireEvent.click(loginNavBtn);
      expect(openLoginSpy).toHaveBeenCalledTimes(1);

      // Click "Get Started" in nav
      const getStartedBtn = screen.getByRole('button', { name: /^get started$/i });
      fireEvent.click(getStartedBtn);
      expect(openRegisterSpy).toHaveBeenCalledTimes(1);
    });
  });
});
