/**
 * CelebrateOS Shared Core Domain Types
 * Strict contracts shared across Client and Server
 */

export type EventType = 'wedding' | 'birthday' | 'community' | 'corporate' | 'other';
export type EventStatus = 'draft' | 'planned' | 'active' | 'completed';

export type TaskPhase = 'pre_event' | 'day_of' | 'post_event';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type VendorStatus = 'inquired' | 'shortlisted' | 'hired' | 'rejected';
export type ProposalStatus = 'pending' | 'applied' | 'rejected' | 'stale';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface EventPreferences {
  theme?: string;
  vibe?: string;
  dietaryRestrictions?: string[];
  notes?: string;
}

export interface EventEntity {
  id: string;
  userId: string;
  title: string;
  eventType: EventType;
  eventDate: string; // ISO date string
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  preferences: EventPreferences;
  status: EventStatus;
  version: number; // For optimistic concurrency control
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItemEntity {
  id: string;
  eventId: string;
  category: string;
  percentageOfTotal: number;
  allocatedAmount: number; // Deterministically computed by backend
  allocatedAmountMinor?: number; // Integer minor currency units (cents/paise)
  actualSpent: number;
  actualSpentMinor?: number;
  rationale?: string;
  isLocked: boolean;
}

export type BudgetErrorCode =
  | 'INVALID_TOTAL_BUDGET'
  | 'EMPTY_ALLOCATIONS'
  | 'DUPLICATE_CATEGORIES'
  | 'LOCKED_EXCEEDS_BUDGET'
  | 'ALL_LOCKED_MISMATCH'
  | 'INVALID_PERCENTAGES'
  | 'INVALID_AMOUNT';

export interface BudgetCalculationInputItem {
  category: string;
  percentage?: number;
  allocatedAmount?: number;
  isLocked?: boolean;
  rationale?: string;
}

export interface CalculatedBudgetItem {
  category: string;
  allocatedAmount: number;
  allocatedAmountMinor: number;
  percentageOfTotal: number;
  isLocked: boolean;
  rationale?: string;
}

export interface BudgetCalculationSuccess {
  success: true;
  totalBudget: number;
  totalBudgetMinor: number;
  totalAllocated: number;
  totalAllocatedMinor: number;
  currency: string;
  precision: number;
  items: CalculatedBudgetItem[];
  lockedTotal: number;
  unlockedTotal: number;
  discrepancyMinor: number;
}

export interface BudgetCalculationFailure {
  success: false;
  code: BudgetErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type BudgetCalculationResult = BudgetCalculationSuccess | BudgetCalculationFailure;

export interface BudgetSummary {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  remainingUnallocated: number;
  items: BudgetItemEntity[];
}

export interface TimelineTaskEntity {
  id: string;
  eventId: string;
  phase: TaskPhase;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category?: string;
}

export interface VendorQuotationEntity {
  id: string;
  eventId: string;
  category: string;
  vendorName: string;
  contactEmail?: string;
  quotedAmount: number;
  status: VendorStatus;
  deliverablesNotes?: string;
  ratingScore?: number; // 1 to 5
}

export interface ProposedBudgetDelta {
  category: string;
  currentAmount: number;
  proposedAmount: number;
  deltaAmount: number;
  rationale: string;
}

export interface ProposedTaskChange {
  action: 'add' | 'remove' | 'modify';
  phase: TaskPhase;
  title: string;
  description?: string;
  priority?: TaskPriority;
  targetTaskId?: string;
}

export interface ProposedChangesPayload {
  summary: string;
  budgetDeltas: ProposedBudgetDelta[];
  taskChanges: ProposedTaskChange[];
  vendorRecommendations?: string[];
}

export interface PlanProposalEntity {
  id: string;
  eventId: string;
  userId: string;
  baseEventVersion: number; // Captured event.__v at proposal time
  userPrompt: string;
  proposedChanges: ProposedChangesPayload;
  status: ProposalStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

