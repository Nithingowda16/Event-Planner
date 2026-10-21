import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { Button } from '../src/components/ui/Button.js';
import { Badge } from '../src/components/ui/Badge.js';
import { Spinner } from '../src/components/ui/Spinner.js';
import { Input } from '../src/components/ui/Input.js';
import { Select } from '../src/components/ui/Select.js';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../src/components/ui/Card.js';
import { Modal } from '../src/components/ui/Modal.js';
import { ToastProvider, useToast } from '../src/components/ui/ToastContext.js';

describe('Milestone 5: Design System & Accessible Component Library', () => {
  describe('1. Button Component', () => {
    it('renders with accessible type, variants, and handles clicks', () => {
      const handleClick = vi.fn();
      render(
        <Button variant="primary" onClick={handleClick}>
          Plan Wedding
        </Button>
      );

      const button = screen.getByRole('button', { name: /plan wedding/i });
      expect(button).toBeDefined();
      expect(button.getAttribute('type')).toBe('button');
      expect(button.classList.contains('celebrate-btn--primary')).toBe(true);

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles loading state with aria-busy and spinner', () => {
      render(
        <Button isLoading loadingText="Generating Plan...">
          Generate Plan
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(screen.getAllByText('Generating Plan...').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('status')).toBeDefined();
    });

    it('supports danger and outline variants', () => {
      render(
        <div>
          <Button variant="danger">Delete Event</Button>
          <Button variant="outline">Preview Budget</Button>
        </div>
      );

      expect(screen.getByRole('button', { name: /delete event/i }).classList.contains('celebrate-btn--danger')).toBe(true);
      expect(screen.getByRole('button', { name: /preview budget/i }).classList.contains('celebrate-btn--outline')).toBe(true);
    });
  });

  describe('2. Badge Component', () => {
    it('renders with proper color variant and dot indicators', () => {
      render(
        <div>
          <Badge variant="emerald" withDot id="verified-badge">
            Verified
          </Badge>
          <Badge variant="gold" size="sm">
            AI Generated
          </Badge>
        </div>
      );

      const badge = document.getElementById('verified-badge');
      expect(badge).toBeDefined();
      expect(badge?.classList.contains('celebrate-badge--emerald')).toBe(true);
      expect(screen.getByText('AI Generated')).toBeDefined();
    });
  });

  describe('3. Spinner Component', () => {
    it('renders accessible role=status and screen reader text', () => {
      render(<Spinner size="lg" label="Loading celebration data..." />);

      const status = screen.getByRole('status');
      expect(status).toBeDefined();
      expect(screen.getByText('Loading celebration data...')).toBeDefined();
    });
  });

  describe('4. Input Component & Form Accessibility', () => {
    it('links label with input via htmlFor and id', () => {
      render(<Input id="guest-count" label="Guest Count" placeholder="150" />);

      const labelText = screen.getByText('Guest Count');
      const labelElement = labelText.closest('label');
      const input = screen.getByLabelText('Guest Count');

      expect(labelElement?.getAttribute('for')).toBe('guest-count');
      expect(input.id).toBe('guest-count');
    });

    it('renders error state with aria-invalid and aria-describedby', () => {
      render(
        <Input
          id="budget-input"
          label="Total Budget"
          error="Budget must be greater than zero"
        />
      );

      const input = screen.getByLabelText('Total Budget');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('budget-input-error');

      const errorMsg = screen.getByRole('alert');
      expect(errorMsg.textContent).toBe('Budget must be greater than zero');
      expect(errorMsg.id).toBe('budget-input-error');
    });
  });

  describe('5. Select Component', () => {
    it('renders accessible select with options and label association', () => {
      const options = [
        { value: 'wedding', label: 'Wedding' },
        { value: 'birthday', label: 'Birthday' },
      ];

      render(<Select id="event-type" label="Celebration Type" options={options} defaultValue="wedding" />);

      const select = screen.getByLabelText('Celebration Type') as HTMLSelectElement;
      expect(select).toBeDefined();
      expect(select.value).toBe('wedding');
      expect(screen.getByRole('combobox')).toBeDefined();
    });
  });

  describe('6. Card Component Compound Architecture', () => {
    it('renders Header, Title, Body, and Footer cleanly', () => {
      render(
        <Card elevation="glass">
          <CardHeader>
            <CardTitle as="h2">Wedding Plan Summary</CardTitle>
          </CardHeader>
          <CardBody>
            <p>Authoritative budget allocations and timeline.</p>
          </CardBody>
          <CardFooter>
            <Button size="sm">Edit Details</Button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { level: 2, name: /wedding plan summary/i })).toBeDefined();
      expect(screen.getByText('Authoritative budget allocations and timeline.')).toBeDefined();
      expect(screen.getByRole('button', { name: /edit details/i })).toBeDefined();
    });
  });

  describe('7. Modal Component Accessibility & Keyboard Navigation', () => {
    const ModalTestHarness = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setIsOpen(true)}>
            Open Dialog
          </button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Create Celebration"
            description="Enter celebration parameters"
            footer={<button type="button" onClick={() => setIsOpen(false)}>Confirm</button>}
          >
            <input type="text" aria-label="Celebration Name" />
          </Modal>
        </div>
      );
    };

    it('opens dialog with role=dialog, aria-modal=true, and closes via close button', async () => {
      render(<ModalTestHarness />);

      // Initially closed
      expect(screen.queryByRole('dialog')).toBeNull();

      // Open modal
      fireEvent.click(screen.getByRole('button', { name: /open dialog/i }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(screen.getByRole('heading', { name: /create celebration/i })).toBeDefined();

      // Close via close button
      const closeBtn = screen.getByRole('button', { name: /close dialog/i });
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
    });

    it('closes modal on pressing Escape key', async () => {
      render(<ModalTestHarness />);

      fireEvent.click(screen.getByRole('button', { name: /open dialog/i }));
      expect(screen.getByRole('dialog')).toBeDefined();

      // Press Escape
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
    });
  });

  describe('8. Toast Notification System', () => {
    const ToastTestHarness = () => {
      const { showToast } = useToast();
      return (
        <div>
          <button type="button" onClick={() => showToast('Plan created successfully!', 'success')}>
            Trigger Success Toast
          </button>
          <button type="button" onClick={() => showToast('Network connection failed', 'error')}>
            Trigger Error Toast
          </button>
        </div>
      );
    };

    it('renders toast with accessible role, live region, and dismiss button', async () => {
      render(
        <ToastProvider>
          <ToastTestHarness />
        </ToastProvider>
      );

      // Trigger toast
      fireEvent.click(screen.getByRole('button', { name: /trigger success toast/i }));

      const toast = screen.getByRole('status');
      expect(toast).toBeDefined();
      expect(toast.textContent).toContain('Plan created successfully!');

      // Dismiss button
      const dismissBtn = screen.getByRole('button', { name: /dismiss notification/i });
      fireEvent.click(dismissBtn);

      await waitFor(() => {
        expect(screen.queryByText('Plan created successfully!')).toBeNull();
      });
    });

    it('renders error toast with role=alert and assertive live region', () => {
      render(
        <ToastProvider>
          <ToastTestHarness />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /trigger error toast/i }));
      const errorToast = screen.getByRole('alert');
      expect(errorToast).toBeDefined();
      expect(errorToast.getAttribute('aria-live')).toBe('assertive');
    });
  });
});
