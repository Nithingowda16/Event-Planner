import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../src/App.js';

describe('CelebrateOS Application Shell & Dashboard (Milestone 5)', () => {
  beforeEach(() => {
    // Mock global fetch for backend health check
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'ok',
            service: 'celebrateos-server',
            timestamp: new Date().toISOString(),
            uptimeSeconds: 120,
          }),
      })
    );
  });

  describe('1. Accessible Landmarks & Skip Link', () => {
    it('renders all required WCAG 2.1 AA landmarks and skip link', async () => {
      render(<App />);

      // Skip link
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeDefined();
      expect(skipLink.getAttribute('href')).toBe('#main-content');

      // Banner landmark
      const banner = screen.getByRole('banner');
      expect(banner).toBeDefined();

      // Navigation landmark
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeDefined();

      // Main content landmark
      const main = screen.getByRole('main');
      expect(main).toBeDefined();
      expect(main.id).toBe('main-content');

      // Contentinfo landmark
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeDefined();

      // Branding
      expect(screen.getByRole('heading', { level: 1, name: /celebrateos/i })).toBeDefined();

      // Backend status resolution
      await waitFor(() => {
        expect(screen.getByText(/API Online/i)).toBeDefined();
      });
    });
  });

  describe('2. Honest Empty State & Overview Metrics', () => {
    it('displays zero-state celebration metrics and honest empty state when no events exist', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/API Online/i)).toBeDefined();
      });

      // Metrics cards
      expect(screen.getByText(/Total Celebrations/i)).toBeDefined();
      expect(screen.getByText(/Authoritative Budget/i)).toBeDefined();
      expect(screen.getByText(/AI Revision Proposals/i)).toBeDefined();
      expect(screen.getByText(/Actionable Tasks/i)).toBeDefined();

      // Empty state
      expect(screen.getByRole('heading', { level: 2, name: /no celebrations created yet/i })).toBeDefined();
      expect(screen.getByText(/Your journey starts by defining an event/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /create your first celebration/i })).toBeDefined();
    });
  });

  describe('3. Event Creation Modal Flow & Toast Feedback', () => {
    it('opens create modal, validates required inputs, creates event, and shows toast', async () => {
      render(<App />);

      // 1. Open modal via header CTA
      const createBtn = screen.getByRole('button', { name: /^create event$/i });
      fireEvent.click(createBtn);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeDefined();
      expect(screen.getByRole('heading', { name: /create new celebration/i })).toBeDefined();

      // 2. Validate error handling when title is too short
      const titleInput = screen.getByLabelText(/celebration title/i);
      fireEvent.change(titleInput, { target: { value: 'ab' } });

      const submitBtn = screen.getByRole('button', { name: /create celebration/i });
      fireEvent.click(submitBtn);

      // Error appears
      await waitFor(() => {
        expect(screen.getByText(/event title must be at least 3 characters/i)).toBeDefined();
      });

      // 3. Complete valid form submission
      fireEvent.change(titleInput, { target: { value: 'Priya & Arjun Royal Wedding' } });

      const locationInput = screen.getByLabelText(/location or venue/i);
      fireEvent.change(locationInput, { target: { value: 'Palace Grounds, Bengaluru' } });

      const guestInput = screen.getByLabelText(/expected guests/i);
      fireEvent.change(guestInput, { target: { value: '350' } });

      const budgetInput = screen.getByLabelText(/total budget/i);
      fireEvent.change(budgetInput, { target: { value: '50000' } });

      fireEvent.click(submitBtn);

      // 4. Modal closes and event card appears in the grid
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });

      expect(screen.getByRole('heading', { level: 3, name: /priya & arjun royal wedding/i })).toBeDefined();
      expect(screen.getByText(/350 attendees/i)).toBeDefined();
      expect(screen.getByText(/palace grounds, bengaluru/i)).toBeDefined();

      // 5. Success toast is displayed
      const toast = screen.getByRole('status');
      expect(toast.textContent).toContain('"Priya & Arjun Royal Wedding" added to local preview');
    });
  });

  describe('4. Responsive Viewport Adaptability', () => {
    it('renders gracefully at mobile, tablet, and desktop viewports', async () => {
      const { container } = render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/API Online/i)).toBeDefined();
      });

      // Mobile viewport simulation
      window.innerWidth = 375;
      fireEvent(window, new Event('resize'));
      expect(container.querySelector('.celebrate-header')).toBeDefined();
      expect(container.querySelector('.container')).toBeDefined();

      // Tablet viewport simulation
      window.innerWidth = 768;
      fireEvent(window, new Event('resize'));
      expect(container.querySelector('.celebrate-dashboard')).toBeDefined();

      // Desktop viewport simulation
      window.innerWidth = 1200;
      fireEvent(window, new Event('resize'));
      expect(container.querySelector('.celebrate-overview-grid')).toBeDefined();
    });
  });
});
