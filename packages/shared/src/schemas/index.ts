import { z } from 'zod';

export const EventTypeSchema = z.enum(['wedding', 'birthday', 'community', 'corporate', 'other']);
export const EventStatusSchema = z.enum(['draft', 'planned', 'active', 'completed']);
export const TaskPhaseSchema = z.enum(['pre_event', 'day_of', 'post_event']);
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high']);
export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed']);
export const VendorStatusSchema = z.enum(['inquired', 'shortlisted', 'hired', 'rejected']);
export const ProposalStatusSchema = z.enum(['pending', 'applied', 'rejected', 'stale']);

// Authentication Schemas
export const RegisterInputSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
});

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Event Schemas
export const EventPreferencesSchema = z.object({
  theme: z.string().max(200).optional(),
  vibe: z.string().max(200).optional(),
  dietaryRestrictions: z.array(z.string().max(100)).optional(),
  notes: z.string().max(1000).optional(),
});

export const CreateEventInputSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150).trim(),
  eventType: EventTypeSchema,
  eventDate: z.string().datetime({ message: 'Event date must be a valid ISO string' }),
  location: z.string().min(2, 'Location is required').max(200).trim(),
  guestCount: z.number().int().positive('Guest count must be at least 1').max(50000),
  totalBudget: z.number().positive('Budget must be greater than zero').max(100000000),
  currency: z.string().min(1).max(10).default('INR'),
  preferences: EventPreferencesSchema.default({}),
});

export const UpdateEventInputSchema = CreateEventInputSchema.partial();

// Budget Item Schema
export const BudgetItemAllocationInputSchema = z.object({
  category: z.string().min(1, 'Category name is required').max(100).trim(),
  percentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100').optional(),
  allocatedAmount: z.number().min(0, 'Allocated amount cannot be negative').optional(),
  isLocked: z.boolean().default(false),
  rationale: z.string().max(500).optional(),
}).refine(
  (data) => {
    if (data.isLocked && data.allocatedAmount === undefined) {
      return false;
    }
    return true;
  },
  {
    message: 'Locked categories must specify an allocatedAmount',
    path: ['allocatedAmount'],
  }
);

export const BudgetRebalanceInputSchema = z.object({
  totalBudget: z.number().positive('Total budget must be a positive number greater than zero').max(100000000),
  currency: z.string().min(1).max(10).default('INR'),
  contingencyCategoryName: z.string().max(100).default('Contingency & Miscellaneous'),
  categories: z.array(BudgetItemAllocationInputSchema).min(1, 'At least one budget category is required'),
}).refine(
  (data) => {
    const normalized = data.categories.map((c) => c.category.trim().toLowerCase());
    return new Set(normalized).size === normalized.length;
  },
  {
    message: 'Duplicate budget categories detected. Category names must be unique within an event.',
    path: ['categories'],
  }
);

export const UpdateBudgetItemSchema = z.object({
  allocatedAmount: z.number().nonnegative('Amount cannot be negative').optional(),
  actualSpent: z.number().nonnegative('Actual spent cannot be negative').optional(),
  rationale: z.string().max(500).optional(),
  isLocked: z.boolean().optional(),
});

// Timeline Task Schemas
export const CreateTaskSchema = z.object({
  phase: TaskPhaseSchema,
  title: z.string().min(2, 'Title must be at least 2 characters').max(200).trim(),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: TaskPrioritySchema.default('medium'),
  category: z.string().max(100).optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  status: TaskStatusSchema.optional(),
});

// Vendor Quotation Schemas
export const CreateVendorSchema = z.object({
  category: z.string().min(2).max(100).trim(),
  vendorName: z.string().min(2).max(150).trim(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  quotedAmount: z.number().nonnegative('Amount cannot be negative'),
  status: VendorStatusSchema.default('inquired'),
  deliverablesNotes: z.string().max(1000).optional(),
  ratingScore: z.number().min(1).max(5).optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial();

// AI Plan Generation Schemas
export const AIGeneratePlanInputSchema = z.object({
  additionalNotes: z.string().max(1000).optional(),
  focusAreas: z.array(z.string()).optional(),
});

export const AIRevisionRequestSchema = z.object({
  userPrompt: z.string().min(5, 'Revision instruction must be at least 5 characters').max(1000).trim(),
});

export const ReviewProposalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  currentEventVersion: z.number().int().nonnegative('Current event version must be provided'),
});

// Structured AI Response Output Schemas (for Gemini Structured Outputs Validation)
export const AIGeneratedPlanOutputSchema = z.object({
  themeConcept: z.string().min(1, 'Theme concept is required'),
  executiveSummary: z.string().min(1, 'Executive summary is required'),
  budgetBreakdown: z.array(
    z.object({
      category: z.string().min(1, 'Category name is required').trim(),
      percentage: z.number().positive('Percentage must be greater than zero').max(100, 'Percentage cannot exceed 100'),
      rationale: z.string().min(1, 'Rationale is required'),
    })
  ).min(1, 'At least one budget category recommendation is required')
  .refine(
    (items) => {
      const names = items.map((i) => i.category.trim().toLowerCase());
      return new Set(names).size === names.length;
    },
    {
      message: 'AI proposed duplicate budget categories',
    }
  ),
  timelinePhases: z.array(
    z.object({
      phase: TaskPhaseSchema,
      tasks: z.array(
        z.object({
          title: z.string().min(1, 'Task title is required'),
          description: z.string().default(''),
          priority: TaskPrioritySchema,
          category: z.string().default('General'),
        })
      ),
    })
  ),
  vendorChecklist: z.array(
    z.object({
      category: z.string().min(1, 'Category is required'),
      estimatedCostPercentage: z.number().min(0).max(100),
      keyDeliverables: z.string().min(1, 'Key deliverables are required'),
    })
  ),
});

export const AIRevisionProposalOutputSchema = z.object({
  summary: z.string().min(1, 'Summary of changes is required'),
  budgetAdjustments: z.array(
    z.object({
      category: z.string().min(1, 'Category is required'),
      percentage: z.number().min(0).max(100),
      rationale: z.string().min(1, 'Rationale is required'),
    })
  ).min(1, 'At least one budget category is required'),
  taskChanges: z.array(
    z.object({
      action: z.enum(['add', 'remove', 'modify']),
      phase: TaskPhaseSchema,
      title: z.string().min(1, 'Task title is required'),
      description: z.string().optional(),
      priority: TaskPrioritySchema.optional(),
      targetTaskId: z.string().optional(),
    })
  ),
  vendorRecommendations: z.array(z.string()).default([]),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'eventDate', 'title', 'totalBudget']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const UpdateEventWithVersionSchema = UpdateEventInputSchema.extend({
  expectedVersion: z.number().int().nonnegative().optional(),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;
export type UpdateEventWithVersionInput = z.infer<typeof UpdateEventWithVersionSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type BudgetItemAllocationInput = z.infer<typeof BudgetItemAllocationInputSchema>;
export type BudgetRebalanceInput = z.infer<typeof BudgetRebalanceInputSchema>;
export type UpdateBudgetItemInput = z.infer<typeof UpdateBudgetItemSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
export type AIGeneratePlanInput = z.infer<typeof AIGeneratePlanInputSchema>;
export type AIRevisionRequestInput = z.infer<typeof AIRevisionRequestSchema>;
export type ReviewProposalInput = z.infer<typeof ReviewProposalSchema>;
export type AIGeneratedPlanOutput = z.infer<typeof AIGeneratedPlanOutputSchema>;
export type AIRevisionProposalOutput = z.infer<typeof AIRevisionProposalOutputSchema>;


