import type {
  RegisterInput,
  LoginInput,
  CreateEventInput,
  UpdateEventWithVersionInput,
  PaginationQuery,
  UpdateBudgetItemInput,
  BudgetRebalanceInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateVendorInput,
  UpdateVendorInput,
  UserProfile,
  EventEntity,
  BudgetSummary,
  TimelineTaskEntity,
  VendorQuotationEntity,
  PaginatedResponse,
  PlanProposalEntity,
  AIRevisionRequestInput,
  AIGeneratePlanInput,
} from '@celebrateos/shared';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const TOKEN_STORAGE_KEY = 'celebrateos_auth_token';

let inMemoryToken: string | null = null;

export const tokenStorage = {
  get(): string | null {
    if (inMemoryToken) return inMemoryToken;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        inMemoryToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // localStorage may fail in restrictive environments
    }
    return inMemoryToken;
  },
  set(token: string): void {
    inMemoryToken = token;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch {
      // Ignore storage errors
    }
  },
  clear(): void {
    inMemoryToken = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  },
};

export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL)
  : ''
).replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (_netErr: unknown) {
    throw new ApiError(
      0,
      'Unable to connect to the backend server. Please check your internet connection or backend server status.'
    );
  }

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    let errorMsg = data?.message || data?.error;
    if (!errorMsg) {
      if (res.status === 404) {
        errorMsg =
          'API endpoint not found (404). If running on Netlify, please deploy the backend server (Render/Railway) or set the VITE_API_URL environment variable.';
      } else {
        errorMsg = `HTTP error ${res.status}`;
      }
    }
    throw new ApiError(res.status, errorMsg, data);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    async register(input: RegisterInput): Promise<{ user: UserProfile; token: string }> {
      const result = await request<{ user: UserProfile; token: string }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      tokenStorage.set(result.token);
      return result;
    },
    async login(input: LoginInput): Promise<{ user: UserProfile; token: string }> {
      const result = await request<{ user: UserProfile; token: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      tokenStorage.set(result.token);
      return result;
    },
    async getMe(): Promise<{ user: UserProfile }> {
      return request<{ user: UserProfile }>('/api/v1/auth/me');
    },
    async logout(): Promise<void> {
      try {
        await request<{ message: string }>('/api/v1/auth/logout', { method: 'POST' });
      } finally {
        tokenStorage.clear();
      }
    },
  },

  // Event CRUD
  events: {
    async list(params?: Partial<PaginationQuery>): Promise<PaginatedResponse<EventEntity>> {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && String(val) !== '') {
            queryParams.append(key, String(val));
          }
        });
      }
      const url = `/api/v1/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return request<PaginatedResponse<EventEntity>>(url);
    },
    async create(input: CreateEventInput): Promise<{ event: EventEntity }> {
      return request<{ event: EventEntity }>('/api/v1/events', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    async get(id: string): Promise<{ event: EventEntity }> {
      return request<{ event: EventEntity }>(`/api/v1/events/${id}`);
    },
    async update(id: string, input: UpdateEventWithVersionInput): Promise<{ event: EventEntity }> {
      return request<{ event: EventEntity }>(`/api/v1/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    async delete(id: string): Promise<{ message: string }> {
      return request<{ message: string }>(`/api/v1/events/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Authoritative Budget
  budget: {
    async get(eventId: string): Promise<{ budget: BudgetSummary }> {
      return request<{ budget: BudgetSummary }>(`/api/v1/events/${eventId}/budget`);
    },
    async updateItem(
      eventId: string,
      itemId: string,
      input: UpdateBudgetItemInput
    ): Promise<{ budget: BudgetSummary }> {
      return request<{ budget: BudgetSummary }>(`/api/v1/events/${eventId}/budget/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    async rebalance(eventId: string, input: BudgetRebalanceInput): Promise<{ budget: BudgetSummary }> {
      return request<{ budget: BudgetSummary }>(`/api/v1/events/${eventId}/budget/rebalance`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
  },

  // Timeline Tasks
  tasks: {
    async list(eventId: string): Promise<{ tasks: TimelineTaskEntity[] }> {
      return request<{ tasks: TimelineTaskEntity[] }>(`/api/v1/events/${eventId}/tasks`);
    },
    async create(eventId: string, input: CreateTaskInput): Promise<{ task: TimelineTaskEntity }> {
      return request<{ task: TimelineTaskEntity }>(`/api/v1/events/${eventId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    async update(
      eventId: string,
      taskId: string,
      input: UpdateTaskInput
    ): Promise<{ task: TimelineTaskEntity }> {
      return request<{ task: TimelineTaskEntity }>(`/api/v1/events/${eventId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
    async delete(eventId: string, taskId: string): Promise<{ message: string }> {
      return request<{ message: string }>(`/api/v1/events/${eventId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
    },
  },

  // Vendors & Quotes
  vendors: {
    async list(eventId: string): Promise<{ vendors: VendorQuotationEntity[] }> {
      return request<{ vendors: VendorQuotationEntity[] }>(`/api/v1/events/${eventId}/vendors`);
    },
    async create(eventId: string, input: CreateVendorInput): Promise<{ vendor: VendorQuotationEntity }> {
      return request<{ vendor: VendorQuotationEntity }>(`/api/v1/events/${eventId}/vendors`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    async update(
      eventId: string,
      vendorId: string,
      input: UpdateVendorInput
    ): Promise<{ vendor: VendorQuotationEntity }> {
      return request<{ vendor: VendorQuotationEntity }>(`/api/v1/events/${eventId}/vendors/${vendorId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
    async delete(eventId: string, vendorId: string): Promise<{ message: string }> {
      return request<{ message: string }>(`/api/v1/events/${eventId}/vendors/${vendorId}`, {
        method: 'DELETE',
      });
    },
  },

  // AI Plan Generation & Revision Proposals
  ai: {
    async generatePlan(
      eventId: string,
      input?: AIGeneratePlanInput
    ): Promise<{
      event: EventEntity;
      themeConcept: string;
      executiveSummary: string;
      tasksCreatedCount: number;
      vendorChecklist: Array<{
        category: string;
        estimatedCostPercentage: number;
        keyDeliverables: string;
      }>;
    }> {
      return request(`/api/v1/events/${eventId}/ai/generate`, {
        method: 'POST',
        body: JSON.stringify(input || {}),
      });
    },
    async proposeRevision(
      eventId: string,
      input: AIRevisionRequestInput
    ): Promise<{
      proposal: PlanProposalEntity;
      diffSnapshot: Record<string, unknown>;
    }> {
      return request(`/api/v1/events/${eventId}/ai/propose-revision`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    async listProposals(eventId: string): Promise<{ proposals: PlanProposalEntity[] }> {
      return request<{ proposals: PlanProposalEntity[] }>(`/api/v1/events/${eventId}/ai/proposals`);
    },
    async getProposal(
      eventId: string,
      proposalId: string
    ): Promise<{
      proposal: PlanProposalEntity & { diffSnapshot?: Record<string, unknown> };
    }> {
      return request(`/api/v1/events/${eventId}/ai/proposals/${proposalId}`);
    },
    async approveProposal(
      eventId: string,
      proposalId: string,
      expectedVersion?: number
    ): Promise<{
      message: string;
      event: EventEntity;
      proposal: PlanProposalEntity;
    }> {
      return request(`/api/v1/events/${eventId}/ai/proposals/${proposalId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ expectedVersion }),
      });
    },
    async rejectProposal(
      eventId: string,
      proposalId: string
    ): Promise<{
      message: string;
      proposal: PlanProposalEntity;
    }> {
      return request(`/api/v1/events/${eventId}/ai/proposals/${proposalId}/reject`, {
        method: 'POST',
      });
    },
  },
};
