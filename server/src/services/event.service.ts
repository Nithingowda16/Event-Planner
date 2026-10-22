import mongoose, { type SortOrder } from 'mongoose';
import { Event, type IEvent } from '../models/event.model.js';
import { Task } from '../models/task.model.js';
import { VendorQuotation } from '../models/vendor.model.js';
import { PlanProposal } from '../models/plan-proposal.model.js';
import { calculateAuthoritativeBudget } from '@celebrateos/shared';
import type {
  CreateEventInput,
  UpdateEventInput,
  EventEntity,
  PaginationQuery,
  PaginatedResponse,
  BudgetSummary,
  UpdateBudgetItemInput,
  BudgetRebalanceInput,
} from '@celebrateos/shared';

export class EventServiceError extends Error {
  constructor(public statusCode: number, message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'EventServiceError';
  }
}

export function toEventEntity(doc: IEvent): EventEntity {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    title: doc.title,
    eventType: doc.eventType,
    eventDate: doc.eventDate.toISOString(),
    location: doc.location,
    guestCount: doc.guestCount,
    totalBudget: doc.totalBudget,
    currency: doc.currency,
    preferences: doc.preferences || {},
    status: doc.status,
    version: doc.__v,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const DEFAULT_BUDGET_TEMPLATE = [
  { category: 'Venue & Facilities', percentage: 35 },
  { category: 'Catering & Beverages', percentage: 30 },
  { category: 'Music & Entertainment', percentage: 12 },
  { category: 'Photography & Videography', percentage: 10 },
  { category: 'Decor & Florals', percentage: 8 },
  { category: 'Contingency & Miscellaneous', percentage: 5 },
];

/**
 * Creates a new event owned strictly by the authenticated user.
 * Deterministically initializes budget items using integer minor-unit math.
 */
export async function createEvent(userId: string, input: CreateEventInput): Promise<EventEntity> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new EventServiceError(400, 'Invalid user ID format');
  }

  // Calculate authoritative starter budget
  const budgetResult = calculateAuthoritativeBudget({
    totalBudget: input.totalBudget,
    currency: input.currency || 'INR',
    categories: DEFAULT_BUDGET_TEMPLATE,
  });

  const budgetItems = budgetResult.success
    ? budgetResult.items.map((item) => ({
        category: item.category,
        percentageOfTotal: item.percentageOfTotal,
        allocatedAmount: item.allocatedAmount,
        allocatedAmountMinor: item.allocatedAmountMinor,
        actualSpent: 0,
        actualSpentMinor: 0,
        isLocked: false,
      }))
    : [];

  const eventDoc = await Event.create({
    userId: new mongoose.Types.ObjectId(userId),
    title: input.title.trim(),
    eventType: input.eventType,
    eventDate: new Date(input.eventDate),
    location: input.location.trim(),
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: input.currency || 'INR',
    preferences: input.preferences || {},
    status: 'draft',
    budgetItems,
  });

  return toEventEntity(eventDoc);
}

/**
 * Fetches an event strictly scoped to the requesting user (tenant isolation).
 */
export async function getEventById(userId: string, eventId: string): Promise<EventEntity> {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new EventServiceError(404, 'Event not found');
  }

  const eventDoc = await Event.findOne({
    _id: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!eventDoc) {
    // Return 404 to prevent IDOR user enumeration / data leakage
    throw new EventServiceError(404, 'Event not found');
  }

  return toEventEntity(eventDoc);
}

/**
 * Lists all events owned by the user with pagination and predictable sorting.
 */
export async function getUserEvents(
  userId: string,
  query: PaginationQuery = { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
): Promise<PaginatedResponse<EventEntity>> {
  const page = Math.max(1, query.page);
  const limit = Math.min(100, Math.max(1, query.limit));
  const skip = (page - 1) * limit;

  const sortDirection: SortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sortCriteria: Record<string, SortOrder> = {
    [query.sortBy]: sortDirection,
  };

  const userObjId = new mongoose.Types.ObjectId(userId);

  const [total, events] = await Promise.all([
    Event.countDocuments({ userId: userObjId }),
    Event.find({ userId: userObjId })
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: events.map(toEventEntity),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Updates an event with ownership enforcement and optimistic concurrency control.
 * Rejects if expectedVersion does not match current document version.
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  input: UpdateEventInput,
  expectedVersion?: number
): Promise<EventEntity> {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new EventServiceError(404, 'Event not found');
  }

  const eventDoc = await Event.findOne({
    _id: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!eventDoc) {
    throw new EventServiceError(404, 'Event not found');
  }

  // Optimistic Concurrency Control Check
  if (expectedVersion !== undefined && eventDoc.__v !== expectedVersion) {
    throw new EventServiceError(
      409,
      `Conflict: The event was modified concurrently. Current version is ${eventDoc.__v}, but proposal/update targeted version ${expectedVersion}.`,
      { currentVersion: eventDoc.__v, expectedVersion }
    );
  }

  if (input.title !== undefined) eventDoc.title = input.title.trim();
  if (input.eventType !== undefined) eventDoc.eventType = input.eventType;
  if (input.eventDate !== undefined) eventDoc.eventDate = new Date(input.eventDate);
  if (input.location !== undefined) eventDoc.location = input.location.trim();
  if (input.guestCount !== undefined) eventDoc.guestCount = input.guestCount;
  if (input.preferences !== undefined) eventDoc.preferences = { ...eventDoc.preferences, ...input.preferences };

  // If budget changed, rebalance budget items authoritatively
  if (input.totalBudget !== undefined && input.totalBudget !== eventDoc.totalBudget) {
    eventDoc.totalBudget = input.totalBudget;
    const existingCategories = eventDoc.budgetItems.map((b) => ({
      category: b.category,
      percentage: b.percentageOfTotal,
      allocatedAmount: b.allocatedAmount,
      isLocked: b.isLocked,
      rationale: b.rationale,
    }));

    const rebalanceResult = calculateAuthoritativeBudget({
      totalBudget: input.totalBudget,
      currency: eventDoc.currency,
      categories: existingCategories.length > 0 ? existingCategories : DEFAULT_BUDGET_TEMPLATE,
    });

    if (rebalanceResult.success) {
      eventDoc.budgetItems = rebalanceResult.items.map((i) => ({
        category: i.category,
        percentageOfTotal: i.percentageOfTotal,
        allocatedAmount: i.allocatedAmount,
        allocatedAmountMinor: i.allocatedAmountMinor,
        actualSpent: 0,
        isLocked: i.isLocked,
        rationale: i.rationale,
      }));
    }
  }

  await eventDoc.save();
  return toEventEntity(eventDoc);
}

/**
 * Deletes an event strictly scoped to the requesting user and cascades to prevent orphaned resources.
 */
export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new EventServiceError(404, 'Event not found');
  }

  const eventObjId = new mongoose.Types.ObjectId(eventId);
  const userObjId = new mongoose.Types.ObjectId(userId);

  const result = await Event.deleteOne({
    _id: eventObjId,
    userId: userObjId,
  });

  if (result.deletedCount === 0) {
    throw new EventServiceError(404, 'Event not found');
  }

  // Cascading cleanup of dependent collections to prevent orphaned records
  await Promise.all([
    Task.deleteMany({ eventId: eventObjId, userId: userObjId }),
    VendorQuotation.deleteMany({ eventId: eventObjId, userId: userObjId }),
    PlanProposal.deleteMany({ eventId: eventObjId, userId: userObjId }),
  ]);
}

/**
 * Transforms an event document into the authoritative budget summary response.
 * Preserves the exact response structure, rounding, currency, and item schema.
 */
export function formatBudgetSummary(event: IEvent): BudgetSummary & { currency: string } {
  const totalAllocated = event.budgetItems.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
  const totalSpent = event.budgetItems.reduce((acc, curr) => acc + curr.actualSpent, 0);
  const remainingUnallocated = Math.round((event.totalBudget - totalAllocated) * 100) / 100;

  return {
    totalBudget: event.totalBudget,
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    remainingUnallocated,
    currency: event.currency,
    items: event.budgetItems.map((item) => ({
      id: item._id ? item._id.toString() : '',
      eventId: event._id.toString(),
      category: item.category,
      percentageOfTotal: item.percentageOfTotal,
      allocatedAmount: item.allocatedAmount,
      allocatedAmountMinor: item.allocatedAmountMinor,
      actualSpent: item.actualSpent,
      actualSpentMinor: item.actualSpentMinor,
      rationale: item.rationale,
      isLocked: item.isLocked,
    })),
  };
}

/**
 * Retrieves the budget breakdown for an event.
 */
export async function getEventBudget(userId: string, eventId: string): Promise<BudgetSummary & { currency: string }> {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new EventServiceError(404, 'Event not found');
  }

  const event = await Event.findOne({
    _id: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!event) {
    throw new EventServiceError(404, 'Event not found');
  }

  return formatBudgetSummary(event);
}

/**
 * Updates a single budget item with server authoritative rebalancing.
 */
export async function updateBudgetItem(
  userId: string,
  eventId: string,
  itemId: string,
  input: UpdateBudgetItemInput
): Promise<BudgetSummary & { currency: string }> {
  if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(itemId)) {
    throw new EventServiceError(404, 'Event or budget item not found');
  }

  const event = await Event.findOne({
    _id: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!event) {
    throw new EventServiceError(404, 'Event not found');
  }

  const item = event.budgetItems.find((b) => b._id && b._id.toString() === itemId);
  if (!item) {
    throw new EventServiceError(404, 'Budget item not found');
  }

  if (input.actualSpent !== undefined) item.actualSpent = input.actualSpent;
  if (input.rationale !== undefined) item.rationale = input.rationale;
  if (input.isLocked !== undefined) item.isLocked = input.isLocked;

  // If allocated amount changed or lock state toggled, recalculate authoritatively
  if (input.allocatedAmount !== undefined) {
    item.allocatedAmount = input.allocatedAmount;
    item.isLocked = true; // Manual allocation change implicitly locks item
  }

  const categories = event.budgetItems.map((b) => ({
    category: b.category,
    percentage: b.percentageOfTotal,
    allocatedAmount: b.allocatedAmount,
    isLocked: b.isLocked,
    rationale: b.rationale,
  }));

  const calcResult = calculateAuthoritativeBudget({
    totalBudget: event.totalBudget,
    currency: event.currency,
    categories,
  });

  if (!calcResult.success) {
    throw new EventServiceError(400, calcResult.message, calcResult.details);
  }

  // Update items with authoritative calculations
  for (const calcItem of calcResult.items) {
    const target = event.budgetItems.find((b) => b.category.toLowerCase() === calcItem.category.toLowerCase());
    if (target) {
      target.allocatedAmount = calcItem.allocatedAmount;
      target.allocatedAmountMinor = calcItem.allocatedAmountMinor;
      target.percentageOfTotal = calcItem.percentageOfTotal;
      target.isLocked = calcItem.isLocked;
    }
  }

  await event.save();
  return formatBudgetSummary(event);
}

/**
 * Authoritatively rebalances entire budget for an event.
 */
export async function rebalanceEventBudget(
  userId: string,
  eventId: string,
  input: BudgetRebalanceInput
): Promise<BudgetSummary & { currency: string }> {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new EventServiceError(404, 'Event not found');
  }

  const event = await Event.findOne({
    _id: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!event) {
    throw new EventServiceError(404, 'Event not found');
  }

  const calcResult = calculateAuthoritativeBudget({
    totalBudget: input.totalBudget,
    currency: input.currency || event.currency,
    contingencyCategoryName: input.contingencyCategoryName,
    categories: input.categories,
  });

  if (!calcResult.success) {
    throw new EventServiceError(400, calcResult.message, calcResult.details);
  }

  event.totalBudget = input.totalBudget;
  if (input.currency) event.currency = input.currency;

  event.budgetItems = calcResult.items.map((i) => ({
    category: i.category,
    percentageOfTotal: i.percentageOfTotal,
    allocatedAmount: i.allocatedAmount,
    allocatedAmountMinor: i.allocatedAmountMinor,
    actualSpent: 0,
    isLocked: i.isLocked,
    rationale: i.rationale,
  }));

  await event.save();
  return formatBudgetSummary(event);
}
