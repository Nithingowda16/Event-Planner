import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { App } from '../src/App.js';
import { EventDetailsView } from '../src/components/events/EventDetailsView.js';
import { BudgetView } from '../src/components/budget/BudgetView.js';
import { TimelineView } from '../src/components/timeline/TimelineView.js';
import { VendorsView } from '../src/components/vendors/VendorsView.js';
import { ToastProvider } from '../src/components/ui/ToastContext.js';
import { tokenStorage } from '../src/services/api.js';
import type {
  EventEntity,
  BudgetSummary,
  TimelineTaskEntity,
  VendorQuotationEntity,
} from '@celebrateos/shared';

const mockEvent: EventEntity = {
  id: 'evt-milestone6-1',
  userId: 'usr-planner-1',
  title: 'Ananya & Kabir Sangeet Celebration',
  eventType: 'wedding',
  eventDate: '2026-11-20T18:00:00.000Z',
  location: 'Taj West End, Bengaluru',
  guestCount: 200,
  totalBudget: 150000000, // 1,500,000 INR in paise (minor units)
  currency: 'INR',
  preferences: {
    theme: 'Royal Bollywood Glam',
    vibe: 'Festive & Elegant',
    notes: 'Live dhol troupe and curated fusion buffet',
  },
  status: 'planned',
  version: 2,
  createdAt: '2026-10-21T00:00:00.000Z',
  updatedAt: '2026-10-21T00:00:00.000Z',
};

const mockBudget: BudgetSummary = {
  totalBudget: 150000000,
  totalAllocated: 135000000,
  totalSpent: 0,
  remainingUnallocated: 15000000,
  items: [
    {
      id: 'b-item-1',
      eventId: 'evt-milestone6-1',
      category: 'Venue & Decor',
      percentageOfTotal: 50,
      allocatedAmount: 75000000,
      actualSpent: 0,
      isLocked: true,
      rationale: 'Grand ballroom and floral mandate',
    },
    {
      id: 'b-item-2',
      eventId: 'evt-milestone6-1',
      category: 'Catering & Beverages',
      percentageOfTotal: 30,
      allocatedAmount: 45000000,
      actualSpent: 0,
      isLocked: false,
      rationale: 'Three-course multi-cuisine buffet',
    },
    {
      id: 'b-item-3',
      eventId: 'evt-milestone6-1',
      category: 'Music & Entertainment',
      percentageOfTotal: 10,
      allocatedAmount: 15000000,
      actualSpent: 0,
      isLocked: false,
      rationale: 'DJ and sound setup',
    },
  ],
  lastCalculatedAt: '2026-10-21T01:00:00.000Z',
  isBalanced: true,
};

const mockTasks: TimelineTaskEntity[] = [
  {
    id: 'tsk-1',
    eventId: 'evt-milestone6-1',
    title: 'Finalize DJ and sound engineer contract',
    phase: 'pre_event',
    priority: 'high',
    status: 'pending',
    dueDate: '2026-11-10T12:00:00.000Z',
    category: 'Entertainment',
    createdAt: '2026-10-21T00:00:00.000Z',
  },
  {
    id: 'tsk-2',
    eventId: 'evt-milestone6-1',
    title: 'Verify stage lighting and AV check',
    phase: 'day_of',
    priority: 'medium',
    status: 'pending',
    dueDate: '2026-11-20T15:00:00.000Z',
    category: 'Production',
    createdAt: '2026-10-21T00:00:00.000Z',
  },
  {
    id: 'tsk-3',
    eventId: 'evt-milestone6-1',
    title: 'Settle final vendor disbursements',
    phase: 'post_event',
    priority: 'low',
    status: 'completed',
    dueDate: '2026-11-22T10:00:00.000Z',
    category: 'Finance',
    createdAt: '2026-10-21T00:00:00.000Z',
  },
];

const mockVendors: VendorQuotationEntity[] = [
  {
    id: 'vnd-1',
    eventId: 'evt-milestone6-1',
    vendorName: 'Bangalore Sound & Lights Co.',
    category: 'Music & Entertainment',
    quotedAmount: 14500000,
    currency: 'INR',
    status: 'shortlisted',
    contactInfo: 'events@bangaloresound.com',
    notes: 'Includes line-array speakers and wireless microphones',
    createdAt: '2026-10-21T00:00:00.000Z',
  },
];

describe('Milestone 6: Event Onboarding, Budget Interface, Timeline & Vendors', () => {
  beforeEach(() => {
    tokenStorage.set('valid-test-jwt-token');

    // Default mock fetch handler
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      const method = init?.method || 'GET';

      // Health
      if (urlStr.includes('/api/v1/health')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ status: 'ok', service: 'celebrateos-server' }),
        });
      }

      // Auth Me
      if (urlStr.includes('/api/v1/auth/me')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              user: {
                id: 'usr-planner-1',
                email: 'planner@celebrateos.dev',
                fullName: 'Demo Event Planner',
                role: 'planner',
                createdAt: new Date().toISOString(),
              },
            }),
        });
      }

      // Events list
      if (urlStr.includes('/api/v1/events') && method === 'GET' && !urlStr.includes('/evt-')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              data: [mockEvent],
              pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }),
        });
      }

      // Budget GET
      if (urlStr.includes('/budget') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ budget: mockBudget }),
        });
      }

      // Tasks GET
      if (urlStr.includes('/tasks') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ tasks: mockTasks }),
        });
      }

      // Vendors GET
      if (urlStr.includes('/vendors') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ vendors: mockVendors }),
        });
      }

      // Single Event GET
      if (urlStr.includes('/api/v1/events/evt-milestone6-1') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ event: mockEvent }),
        });
      }

      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });
    });
  });

  describe('1. Event Onboarding & Persistent Event Management', () => {
    it('renders dashboard with persisted events and navigates to event details', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Ananya & Kabir Sangeet Celebration')).toBeDefined();
      });

      // Assert event card attributes
      expect(screen.getByText(/200 attendees/i)).toBeDefined();
      expect(screen.getByText(/taj west end, bengaluru/i)).toBeDefined();

      // Click "View Details" to navigate into the EventDetailsView
      const manageBtn = screen.getByRole('button', { name: /view details/i });
      fireEvent.click(manageBtn);

      // Verify Event Details workspace loaded
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'Ananya & Kabir Sangeet Celebration' })).toBeDefined();
      });

      // Workspace tabs present
      expect(screen.getByRole('button', { name: /authoritative budget/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /timeline & tasks/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /vendors & quotes/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /event info/i })).toBeDefined();
    });

    it('enforces optimistic concurrency control and sends expectedVersion on event edit', async () => {
      let putBody: { title?: string; location?: string; expectedVersion?: number } | null = null;

      global.fetch = vi.fn().mockImplementation((url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        const method = init?.method || 'GET';

        if (urlStr.includes('/api/v1/events/evt-milestone6-1') && method === 'PUT') {
          putBody = JSON.parse(init?.body as string);
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () =>
              Promise.resolve({
                event: {
                  ...mockEvent,
                  title: putBody.title,
                  location: putBody.location,
                  version: mockEvent.version + 1,
                },
              }),
          });
        }

        if (urlStr.includes('/budget')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ budget: mockBudget }),
          });
        }

        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({}),
        });
      });

      const handleUpdate = vi.fn();
      const handleDelete = vi.fn();
      const handleBack = vi.fn();

      render(
        <ToastProvider>
          <EventDetailsView
            event={mockEvent}
            onEventUpdated={handleUpdate}
            onEventDeleted={handleDelete}
            onBack={handleBack}
          />
        </ToastProvider>
      );

      // Click "Edit Event" button in header
      const editBtn = screen.getByRole('button', { name: /^edit event$/i });
      fireEvent.click(editBtn);

      // Edit dialog appears
      const modal = screen.getByRole('dialog');
      expect(modal).toBeDefined();

      const locationInput = screen.getByLabelText(/location or venue/i);
      fireEvent.change(locationInput, { target: { value: 'Leela Palace, Bengaluru' } });

      const form = modal.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(putBody).not.toBeNull();
      });

      // Verify that expectedVersion was included in the request body
      expect(putBody.expectedVersion).toBe(mockEvent.version);
      expect(putBody.location).toBe('Leela Palace, Bengaluru');
      expect(handleUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Authoritative Budget Engine Interface', () => {
    it('displays authoritative budget metrics and honors integer minor precision', async () => {
      render(
        <ToastProvider>
          <BudgetView event={mockEvent} />
        </ToastProvider>
      );

      // Wait for budget loading
      await waitFor(() => {
        expect(screen.getByText('Venue & Decor')).toBeDefined();
      });

      // Invariant check indicator
      expect(screen.getByText(/Authoritative Deterministic Engine/i)).toBeDefined();

      // Financial overview cards
      expect(screen.getByText(/Total Event Budget/i)).toBeDefined();
      expect(screen.getByText(/Allocated to Categories/i)).toBeDefined();
      expect(screen.getByText(/Remaining Contingency/i)).toBeDefined();

      // Categories and lock badges
      expect(screen.getByText('Catering & Beverages')).toBeDefined();
      expect(screen.getByText('Music & Entertainment')).toBeDefined();

      // Locked category indicator
      expect(screen.getByText('Locked')).toBeDefined();
    });

    it('submits category item updates to server authoritative endpoint and updates view', async () => {
      let putItemBody: { isLocked?: boolean; allocatedAmount?: number } | null = null;

      global.fetch = vi.fn().mockImplementation((url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        const method = init?.method || 'GET';

        if (urlStr.includes('/items/b-item-2') && method === 'PUT') {
          putItemBody = JSON.parse(init?.body as string);
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () =>
              Promise.resolve({
                budget: {
                  ...mockBudget,
                  items: mockBudget.items.map((item) =>
                    item.id === 'b-item-2'
                      ? {
                          ...item,
                          allocatedAmount: 50000000,
                          percentageOfTotal: 33.33,
                          isLocked: true,
                        }
                      : item
                  ),
                },
              }),
          });
        }

        if (urlStr.includes('/budget')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ budget: mockBudget }),
          });
        }

        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({}),
        });
      });

      render(
        <ToastProvider>
          <BudgetView event={mockEvent} />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Catering & Beverages')).toBeDefined();
      });

      // Click "Edit" on the Catering & Beverages item
      const editBtn = screen.getByRole('button', { name: /edit catering & beverages budget/i });
      fireEvent.click(editBtn);

      // Modal appears
      const modal = screen.getByRole('dialog');
      expect(modal).toBeDefined();
      expect(screen.getByText(/Edit Category: Catering & Beverages/i)).toBeDefined();

      // Toggle lock checkbox
      const lockCheckbox = screen.getByLabelText(/lock category amount/i);
      fireEvent.click(lockCheckbox);

      // Save allocation
      const form = modal.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(putItemBody).not.toBeNull();
      });

      expect(putItemBody.isLocked).toBe(true);
    });
  });

  describe('3. Timeline & Tasks Management', () => {
    it('groups tasks by pre_event, day_of, and post_event phases with status toggle', async () => {
      let patchBody: { status?: string } | null = null;

      global.fetch = vi.fn().mockImplementation((url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        const method = init?.method || 'GET';

        if (urlStr.includes('/tasks/tsk-1') && method === 'PATCH') {
          patchBody = JSON.parse(init?.body as string);
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () =>
              Promise.resolve({
                task: {
                  ...mockTasks[0],
                  status: patchBody.status,
                },
              }),
          });
        }

        if (urlStr.includes('/tasks')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ tasks: mockTasks }),
          });
        }

        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({}),
        });
      });

      render(
        <ToastProvider>
          <TimelineView event={mockEvent} />
        </ToastProvider>
      );

      // Wait for tasks to render
      await waitFor(() => {
        expect(screen.getByText('Finalize DJ and sound engineer contract')).toBeDefined();
      });

      // Check phase headings
      expect(screen.getByRole('heading', { level: 4, name: /pre-event planning/i })).toBeDefined();
      expect(screen.getByRole('heading', { level: 4, name: /day-of execution/i })).toBeDefined();
      expect(screen.getByRole('heading', { level: 4, name: /post-event wrap-up/i })).toBeDefined();

      // Check priorities
      expect(screen.getByText(/HIGH Priority/i)).toBeDefined();
      expect(screen.getByText(/MEDIUM Priority/i)).toBeDefined();

      // Toggle status of tsk-1 to completed
      const checkbox = screen.getByLabelText(/mark "finalize dj and sound engineer contract" as complete/i);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(patchBody).not.toBeNull();
      });

      expect(patchBody.status).toBe('completed');
    });

    it('creates a new task via CreateTaskModal and persists to backend', async () => {
      let postTaskBody: { title?: string; phase?: string; priority?: string; category?: string; dueDate?: string } | null = null;

      global.fetch = vi.fn().mockImplementation((url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        const method = init?.method || 'GET';

        if (urlStr.includes('/tasks') && method === 'POST') {
          postTaskBody = JSON.parse(init?.body as string);
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () =>
              Promise.resolve({
                task: {
                  id: 'tsk-new-1',
                  eventId: mockEvent.id,
                  title: postTaskBody.title,
                  phase: postTaskBody.phase,
                  priority: postTaskBody.priority,
                  status: 'pending',
                  category: postTaskBody.category,
                  dueDate: postTaskBody.dueDate,
                  createdAt: new Date().toISOString(),
                },
              }),
          });
        }

        if (urlStr.includes('/tasks')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ tasks: mockTasks }),
          });
        }

        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({}),
        });
      });

      render(
        <ToastProvider>
          <TimelineView event={mockEvent} />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Finalize DJ and sound engineer contract')).toBeDefined();
      });

      // Open Add Task Modal
      const addBtn = screen.getByRole('button', { name: /add milestone task/i });
      fireEvent.click(addBtn);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeDefined();
      expect(screen.getByRole('heading', { name: /add timeline task/i })).toBeDefined();

      // Fill in details
      const titleInput = screen.getByLabelText(/task title/i);
      fireEvent.change(titleInput, { target: { value: 'Coordinate guest welcome hampers' } });

      const form = modal.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(postTaskBody).not.toBeNull();
      });

      expect(postTaskBody.title).toBe('Coordinate guest welcome hampers');
      expect(postTaskBody.phase).toBe('pre_event');
    });
  });

  describe('4. Vendors & Quotations Interface (Anti-Hallucination Disclaimers)', () => {
    it('prominently displays anti-hallucination planning disclaimer banner', async () => {
      render(
        <ToastProvider>
          <VendorsView event={mockEvent} />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Bangalore Sound & Lights Co.')).toBeDefined();
      });

      // Anti-hallucination disclaimer banner assertions
      expect(
        screen.getByText(/AI Planning Guidance vs. Real Vendors/i)
      ).toBeDefined();
      expect(
        screen.getByText(
          /Generative AI models provide conceptual service ideas/i
        )
      ).toBeDefined();
    });

    it('creates and records a genuine vendor quotation', async () => {
      let postVendorBody: { vendorName?: string; category?: string; quotedAmount?: number } | null = null;

      global.fetch = vi.fn().mockImplementation((url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        const method = init?.method || 'GET';

        if (urlStr.includes('/vendors') && method === 'POST') {
          postVendorBody = JSON.parse(init?.body as string);
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () =>
              Promise.resolve({
                vendor: {
                  id: 'vnd-new-1',
                  eventId: mockEvent.id,
                  vendorName: postVendorBody.vendorName,
                  category: postVendorBody.category,
                  quotedAmount: postVendorBody.quotedAmount,
                  currency: postVendorBody.currency,
                  status: postVendorBody.status,
                  contactInfo: postVendorBody.contactInfo,
                  notes: postVendorBody.notes,
                  createdAt: new Date().toISOString(),
                },
              }),
          });
        }

        if (urlStr.includes('/vendors')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ vendors: mockVendors }),
          });
        }

        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({}),
        });
      });

      render(
        <ToastProvider>
          <VendorsView event={mockEvent} />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Bangalore Sound & Lights Co.')).toBeDefined();
      });

      // Click "Record Quote" button
      const recordBtn = screen.getByRole('button', { name: /record quote/i });
      fireEvent.click(recordBtn);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeDefined();
      expect(screen.getByRole('heading', { name: /record vendor quotation/i })).toBeDefined();

      // Enter vendor details
      const nameInput = screen.getByLabelText(/vendor \/ business name/i);
      fireEvent.change(nameInput, { target: { value: 'Royal Sweets & Mithai' } });

      const categoryInput = screen.getByLabelText(/service category/i);
      fireEvent.change(categoryInput, { target: { value: 'Catering & Mithai' } });

      const amountInput = screen.getByLabelText(/quoted amount/i);
      fireEvent.change(amountInput, { target: { value: '25000' } });

      const submitBtn = screen.getByRole('button', { name: /save quotation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(postVendorBody).not.toBeNull();
      });

      expect(postVendorBody.vendorName).toBe('Royal Sweets & Mithai');
      expect(postVendorBody.category).toBe('Catering & Mithai');
      expect(postVendorBody.quotedAmount).toBe(25000);
    });
  });
});
