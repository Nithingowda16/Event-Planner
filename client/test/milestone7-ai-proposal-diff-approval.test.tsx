import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { EventEntity, PlanProposalEntity } from '@celebrateos/shared';
import { RequestRevisionModal } from '../src/components/proposals/RequestRevisionModal.js';
import { DiffInspectorModal } from '../src/components/proposals/DiffInspectorModal.js';
import { ProposalsListModal } from '../src/components/proposals/ProposalsListModal.js';
import { EventDetailsView } from '../src/components/events/EventDetailsView.js';
import { ToastProvider } from '../src/components/ui/ToastContext.js';

describe('Milestone 7: AI Proposal Diff Preview & Approval UI', () => {
  const mockEvent: EventEntity = {
    id: 'evt-test-123',
    userId: 'usr-123',
    title: 'Emerald Gala Celebration',
    eventType: 'corporate',
    eventDate: '2026-11-20T18:00:00.000Z',
    location: 'Metropolitan Hall, Seattle',
    guestCount: 200,
    totalBudget: 50000,
    currency: 'INR',
    status: 'draft',
    budgetItems: [
      {
        category: 'Venue & Staging',
        percentageOfTotal: 40,
        allocatedAmount: 20000,
        allocatedAmountMinor: 2000000,
        actualSpent: 0,
        actualSpentMinor: 0,
        isLocked: false,
      },
      {
        category: 'Catering & Beverages',
        percentageOfTotal: 30,
        allocatedAmount: 15000,
        allocatedAmountMinor: 1500000,
        actualSpent: 0,
        actualSpentMinor: 0,
        isLocked: false,
      },
      {
        category: 'Live Music & Production',
        percentageOfTotal: 15,
        allocatedAmount: 7500,
        allocatedAmountMinor: 750000,
        actualSpent: 0,
        actualSpentMinor: 0,
        isLocked: false,
      },
      {
        category: 'Contingency & Reserves',
        percentageOfTotal: 15,
        allocatedAmount: 7500,
        allocatedAmountMinor: 750000,
        actualSpent: 0,
        actualSpentMinor: 0,
        isLocked: false,
      },
    ],
    version: 0,
    createdAt: '2026-10-21T10:00:00.000Z',
    updatedAt: '2026-10-21T10:00:00.000Z',
  };

  const mockProposal: PlanProposalEntity & { diffSnapshot?: Record<string, unknown> } = {
    id: 'prop-test-789',
    eventId: 'evt-test-123',
    userId: 'usr-123',
    baseEventVersion: 0,
    userPrompt: 'Upgrade sound production and add milestone audio checks',
    status: 'pending',
    createdAt: '2026-10-21T12:00:00.000Z',
    proposedChanges: {
      summary: 'Reallocated 5% of contingency into live production to support an 8-piece band and added stage audio check milestones.',
      budgetDeltas: [
        {
          category: 'Live Music & Production',
          currentAmount: 7500,
          proposedAmount: 10000,
          deltaAmount: 2500,
          rationale: 'Enhanced sound gear and staging equipment',
        },
        {
          category: 'Contingency & Reserves',
          currentAmount: 7500,
          proposedAmount: 5000,
          deltaAmount: -2500,
          rationale: 'Shifted reserve into production while keeping minimum 10% buffer',
        },
        {
          category: 'Venue & Staging',
          currentAmount: 20000,
          proposedAmount: 20000,
          deltaAmount: 0,
          rationale: 'Maintained ballroom booking',
        },
      ],
      taskChanges: [
        {
          action: 'add',
          phase: 'pre_event',
          title: 'Conduct Stage Acoustics Inspection',
          description: 'Test decibel limits with venue audio supervisor',
          priority: 'high',
        },
        {
          action: 'add',
          phase: 'day_of',
          title: 'Band Soundcheck & Mic Balancing',
          description: 'Full sound rehearsal 2 hours before guest arrival',
          priority: 'high',
        },
        {
          action: 'remove',
          phase: 'pre_event',
          title: 'Order Generic Playlist Speakers',
          targetTaskId: 'task-old-speaker-1',
        },
      ],
      vendorRecommendations: [
        'Acoustic Sound Masters NW',
        'Stage Lighting Specialists',
      ],
    },
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. RequestRevisionModal: Proposal Generation Flow', () => {
    it('opens modal, accepts prompt with character limit, and creates proposal', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          proposal: mockProposal,
          diffSnapshot: {},
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const onProposalCreated = vi.fn();
      const onClose = vi.fn();

      render(
        <ToastProvider>
          <RequestRevisionModal
            isOpen={true}
            onClose={onClose}
            event={mockEvent}
            onProposalCreated={onProposalCreated}
          />
        </ToastProvider>
      );

      expect(screen.getByRole('dialog', { name: /Request AI Revision Proposal/i })).toBeDefined();
      expect(screen.getByText(/Safe Review Flow/i)).toBeDefined();

      const textarea = screen.getByLabelText(/What adjustments would you like Gemini to make\?/i);
      fireEvent.change(textarea, { target: { value: 'Upgrade sound production and add milestone audio checks' } });

      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/v1/events/${mockEvent.id}/ai/propose-revision`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              userPrompt: 'Upgrade sound production and add milestone audio checks',
            }),
          })
        );
        expect(onProposalCreated).toHaveBeenCalledWith(mockProposal);
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('handles AI rate limits (429) gracefully with actionable error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'RateLimitExceeded',
          message: 'Too many AI requests. Please wait a moment.',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      render(
        <ToastProvider>
          <RequestRevisionModal
            isOpen={true}
            onClose={vi.fn()}
            event={mockEvent}
            onProposalCreated={vi.fn()}
          />
        </ToastProvider>
      );

      const textarea = screen.getByLabelText(/What adjustments would you like Gemini to make\?/i);
      fireEvent.change(textarea, { target: { value: 'Refine budget' } });

      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        const alertEl = screen.getByRole('alert');
        expect(alertEl.textContent).toContain('rate limit reached');
      });
    });
  });

  describe('2. DiffInspectorModal: Side-by-Side Review & Presentation', () => {
    it('displays summary metrics, version baseline, and tabbed budget & task diffs', () => {
      render(
        <ToastProvider>
          <DiffInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            event={mockEvent}
            proposal={mockProposal}
            onApproved={vi.fn()}
            onRejected={vi.fn()}
          />
        </ToastProvider>
      );

      // Verify Headers & Version Anchors
      expect(screen.getByRole('dialog', { name: /AI Proposal Diff Inspector/i })).toBeDefined();
      expect(screen.getByText('Pending Review')).toBeDefined();
      expect(screen.getAllByText(/v0/).length).toBeGreaterThanOrEqual(2);

      // Verify Executive Summary
      expect(screen.getByText(/Reallocated 5% of contingency into live production/i)).toBeDefined();

      // Verify Metric Counters
      expect(screen.getByText('+2')).toBeDefined(); // 2 added tasks
      expect(screen.getByText('-1')).toBeDefined(); // 1 removed task

      // Verify Budget Tab
      expect(screen.getByText('Live Music & Production')).toBeDefined();
      expect(screen.getByText('+₹2,500')).toBeDefined();
      expect(screen.getByText('-₹2,500')).toBeDefined();
      expect(screen.getByText('No Change (₹0)')).toBeDefined();

      // Switch to Timeline Tasks Tab
      const tasksTab = screen.getByRole('tab', { name: /Timeline Tasks/i });
      fireEvent.click(tasksTab);

      expect(screen.getByText('Conduct Stage Acoustics Inspection')).toBeDefined();
      expect(screen.getByText('Band Soundcheck & Mic Balancing')).toBeDefined();
      expect(screen.getByText('Order Generic Playlist Speakers')).toBeDefined();
      expect(screen.getAllByText('+ ADDED').length).toBe(2);
      expect(screen.getByText('- REMOVED')).toBeDefined();

      // Switch to Vendor Ideas Tab
      const vendorsTab = screen.getByRole('tab', { name: /Vendor Ideas/i });
      fireEvent.click(vendorsTab);

      expect(screen.getByText(/Planning Suggestions/i)).toBeDefined();
      expect(screen.getByText('Acoustic Sound Masters NW')).toBeDefined();
      expect(screen.getByText('Stage Lighting Specialists')).toBeDefined();
    });

    it('renders Stale Proposal warning and hides Approve button when event version is newer', () => {
      const staleEvent: EventEntity = {
        ...mockEvent,
        version: 2, // Event version advanced to 2, proposal is anchored at v0
      };

      render(
        <ToastProvider>
          <DiffInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            event={staleEvent}
            proposal={mockProposal}
            onApproved={vi.fn()}
            onRejected={vi.fn()}
            onRequestNewRevision={vi.fn()}
          />
        </ToastProvider>
      );

      expect(screen.getByText('Stale Proposal')).toBeDefined();
      expect(screen.getByRole('alert').textContent).toContain('Event Version Conflict');
      expect(screen.queryByRole('button', { name: /Approve & Apply Plan/i })).toBeNull();
      expect(screen.getByRole('button', { name: /Request Fresh Revision/i })).toBeDefined();
    });
  });

  describe('3. Proposal Approval Flow with Concurrency Enforcement', () => {
    it('approves proposal, applies changes, and confirms optimistic version increment', async () => {
      const updatedEvent: EventEntity = {
        ...mockEvent,
        version: 1,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          message: 'Proposal approved and applied successfully',
          event: updatedEvent,
          proposal: { ...mockProposal, status: 'applied' },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const onApproved = vi.fn();
      const onClose = vi.fn();

      render(
        <ToastProvider>
          <DiffInspectorModal
            isOpen={true}
            onClose={onClose}
            event={mockEvent}
            proposal={mockProposal}
            onApproved={onApproved}
            onRejected={vi.fn()}
          />
        </ToastProvider>
      );

      const approveBtn = screen.getByRole('button', { name: /Approve & Apply Plan/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/v1/events/${mockEvent.id}/ai/proposals/${mockProposal.id}/approve`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ expectedVersion: 0 }),
          })
        );
        expect(onApproved).toHaveBeenCalledWith(updatedEvent, expect.objectContaining({ status: 'applied' }));
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('handles 409 Conflict during approval by transitioning proposal to stale', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'Conflict',
          message: 'Conflict: The event was modified concurrently. Proposal is now stale.',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      render(
        <ToastProvider>
          <DiffInspectorModal
            isOpen={true}
            onClose={vi.fn()}
            event={mockEvent}
            proposal={mockProposal}
            onApproved={vi.fn()}
            onRejected={vi.fn()}
          />
        </ToastProvider>
      );

      const approveBtn = screen.getByRole('button', { name: /Approve & Apply Plan/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByText(/modified concurrently/i)).toBeDefined();
        expect(screen.getByText('Stale Proposal')).toBeDefined();
      });
    });
  });

  describe('4. Proposal Rejection: Discard Without Event Mutations', () => {
    it('rejects proposal and leaves active event unmodified', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          message: 'Proposal rejected without changes',
          proposal: { ...mockProposal, status: 'rejected' },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const onRejected = vi.fn();
      const onClose = vi.fn();

      render(
        <ToastProvider>
          <DiffInspectorModal
            isOpen={true}
            onClose={onClose}
            event={mockEvent}
            proposal={mockProposal}
            onApproved={vi.fn()}
            onRejected={onRejected}
          />
        </ToastProvider>
      );

      const rejectBtn = screen.getByRole('button', { name: /Reject Proposal/i });
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/v1/events/${mockEvent.id}/ai/proposals/${mockProposal.id}/reject`,
          expect.objectContaining({ method: 'POST' })
        );
        expect(onRejected).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }));
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('5. ProposalsListModal: History and Inspect Diff Selection', () => {
    it('fetches and lists proposals with status badges, allowing diff inspection', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          proposals: [
            mockProposal,
            {
              ...mockProposal,
              id: 'prop-stale-001',
              userPrompt: 'Older revision attempt',
              baseEventVersion: 0,
              status: 'stale' as const,
              createdAt: '2026-10-20T08:00:00.000Z',
            },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const onSelectProposal = vi.fn();
      const onClose = vi.fn();

      render(
        <ToastProvider>
          <ProposalsListModal
            isOpen={true}
            onClose={onClose}
            event={mockEvent}
            onSelectProposal={onSelectProposal}
            onRequestNewRevision={vi.fn()}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Upgrade sound production/i)).toBeDefined();
        expect(screen.getByText(/Older revision attempt/i)).toBeDefined();
        expect(screen.getByText('Pending Review')).toBeDefined();
      });

      const inspectBtns = screen.getAllByRole('button', { name: /Inspect Diff/i });
      fireEvent.click(inspectBtns[0]);

      expect(onClose).toHaveBeenCalled();
      expect(onSelectProposal).toHaveBeenCalledWith(mockProposal);
    });
  });

  describe('6. EventDetailsView Integration: End-to-End Proposal Actions', () => {
    it('integrates AI revision buttons and tab navigation seamlessly', async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/budget')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              budget: {
                totalBudget: mockEvent.totalBudget,
                totalAllocated: 42500,
                remainingUnallocated: 7500,
                currency: mockEvent.currency,
                items: mockEvent.budgetItems,
                invariantCheck: { isValid: true, calculatedTotal: 50000, discrepancy: 0 },
              },
            }),
          });
        }
        if (url.includes('/tasks')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ tasks: [] }),
          });
        }
        if (url.includes('/vendors')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ vendors: [] }),
          });
        }
        if (url.includes('/proposals')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ proposals: [mockProposal] }),
          });
        }
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
        });
      });
      vi.stubGlobal('fetch', mockFetch);

      render(
        <ToastProvider>
          <EventDetailsView
            event={mockEvent}
            onBack={vi.fn()}
            onEventUpdated={vi.fn()}
            onEventDeleted={vi.fn()}
          />
        </ToastProvider>
      );

      expect(screen.getByRole('button', { name: /Request AI Revision/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /AI Proposals/i })).toBeDefined();

      // Click AI Proposals tab
      const proposalsTab = screen.getByRole('button', { name: /AI Revisions & Diffs/i });
      fireEvent.click(proposalsTab);

      expect(screen.getByText(/AI proposals are strictly isolated drafts/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /View All Generated Proposals/i })).toBeDefined();
    });
  });
});
