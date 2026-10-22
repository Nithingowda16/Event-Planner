import mongoose from 'mongoose';
import { PlanProposal, type IPlanProposal } from '../models/plan-proposal.model.js';
import { Event } from '../models/event.model.js';
import { Task, type ITask } from '../models/task.model.js';
import { calculateAuthoritativeBudget, type PlanProposalEntity, type ProposedChangesPayload, type EventEntity } from '@celebrateos/shared';
import * as geminiService from './gemini.service.js';
import * as diffService from './diff.service.js';
import * as taskService from './task.service.js';
import { toEventEntity } from './event.service.js';

export class ProposalServiceError extends Error {
  constructor(public statusCode: number, message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'ProposalServiceError';
  }
}

export function toProposalEntity(doc: IPlanProposal): PlanProposalEntity {
  return {
    id: doc._id.toString(),
    eventId: doc.eventId.toString(),
    userId: doc.userId.toString(),
    baseEventVersion: doc.baseEventVersion,
    userPrompt: doc.userPrompt,
    proposedChanges: doc.proposedChanges,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    reviewedAt: doc.reviewedAt?.toISOString(),
  };
}

/**
 * Generates an AI revision proposal without mutating the active event.
 * Computes deterministic before/after diffs and stores proposal as pending.
 */
export async function generateProposal(
  userId: string,
  eventId: string,
  userPrompt: string
): Promise<{ proposal: PlanProposalEntity; diffSnapshot: Record<string, unknown> }> {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ProposalServiceError(404, 'Event not found');
  }

  const event = await Event.findOne({
    _id: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!event) {
    throw new ProposalServiceError(404, 'Event not found');
  }

  // 1. Capture current event version as concurrency baseline
  const baseEventVersion = event.__v;

  // 2. Retrieve existing tasks for planning context
  const currentTasks = await taskService.getEventTasks(userId, eventId);

  // 3. Request structured revision from Gemini
  const aiRevision = await geminiService.generateRevision(event, currentTasks, userPrompt);

  // 4. Run proposed budget adjustments through authoritative deterministic budget engine
  const budgetResult = calculateAuthoritativeBudget({
    totalBudget: event.totalBudget,
    currency: event.currency,
    categories: aiRevision.budgetAdjustments.map((b) => ({
      category: b.category,
      percentage: b.percentage,
      rationale: b.rationale,
      isLocked: false,
    })),
  });

  if (!budgetResult.success) {
    throw new ProposalServiceError(
      502,
      `AI proposed an invalid budget distribution: ${budgetResult.message}`,
      budgetResult.details
    );
  }

  // 5. Compile deterministic before-and-after diff
  const { proposedChanges, diffSnapshot } = diffService.compileDeterministicDiff({
    currentBudgetItems: event.budgetItems,
    calculatedProposedBudget: budgetResult.items,
    proposedTaskChanges: aiRevision.taskChanges,
    proposedVendorRecommendations: aiRevision.vendorRecommendations,
    summary: aiRevision.summary,
  });

  // 6. Persist proposal as pending (Zero mutations to active event!)
  const proposalDoc = await PlanProposal.create({
    eventId: event._id,
    userId: new mongoose.Types.ObjectId(userId),
    baseEventVersion,
    userPrompt: userPrompt.trim(),
    proposedChanges,
    diffSnapshot,
    status: 'pending',
  });

  return {
    proposal: toProposalEntity(proposalDoc),
    diffSnapshot,
  };
}

/**
 * Lists all proposals for an event.
 */
export async function listEventProposals(userId: string, eventId: string): Promise<PlanProposalEntity[]> {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ProposalServiceError(404, 'Event not found');
  }

  const proposals = await PlanProposal.find({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  }).sort({ createdAt: -1 });

  return proposals.map(toProposalEntity);
}

/**
 * Retrieves a proposal strictly verifying owner tenant isolation.
 */
export async function getProposalById(userId: string, proposalId: string): Promise<PlanProposalEntity & { diffSnapshot?: Record<string, unknown> }> {
  if (!mongoose.Types.ObjectId.isValid(proposalId)) {
    throw new ProposalServiceError(404, 'Proposal not found');
  }

  const proposal = await PlanProposal.findOne({
    _id: new mongoose.Types.ObjectId(proposalId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!proposal) {
    throw new ProposalServiceError(404, 'Proposal not found');
  }

  return {
    ...toProposalEntity(proposal),
    diffSnapshot: proposal.diffSnapshot as Record<string, unknown> | undefined,
  };
}

/**
 * Rejects a proposal without mutating any event state.
 */
export async function rejectProposal(userId: string, proposalId: string): Promise<PlanProposalEntity> {
  if (!mongoose.Types.ObjectId.isValid(proposalId)) {
    throw new ProposalServiceError(404, 'Proposal not found');
  }

  const proposal = await PlanProposal.findOne({
    _id: new mongoose.Types.ObjectId(proposalId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!proposal) {
    throw new ProposalServiceError(404, 'Proposal not found');
  }

  if (proposal.status !== 'pending') {
    throw new ProposalServiceError(400, `Cannot reject proposal with status "${proposal.status}"`);
  }

  proposal.status = 'rejected';
  proposal.reviewedAt = new Date();
  await proposal.save();

  return toProposalEntity(proposal);
}

/**
 * Validates whether a proposal is eligible for approval:
 * 1. Ownership check (userId === proposal.userId)
 * 2. Status check (proposal.status === 'pending')
 * 3. Optimistic concurrency check (proposal.baseEventVersion === event.__v)
 * If the event was modified in the interim, the proposal is marked 'stale' and rejected.
 */
export async function validateProposalForApproval(
  userId: string,
  proposalOrId: string | IPlanProposal,
  expectedVersion?: number
): Promise<{ proposal: IPlanProposal; event: InstanceType<typeof Event> }> {
  let proposal: IPlanProposal | null;

  if (typeof proposalOrId === 'string') {
    if (!mongoose.Types.ObjectId.isValid(proposalOrId)) {
      throw new ProposalServiceError(404, 'Proposal not found');
    }

    proposal = await PlanProposal.findOne({
      _id: new mongoose.Types.ObjectId(proposalOrId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!proposal) {
      throw new ProposalServiceError(404, 'Proposal not found');
    }

    if (proposal.status !== 'pending') {
      throw new ProposalServiceError(
        400,
        `Cannot review proposal with status "${proposal.status}". Only pending proposals can be reviewed.`
      );
    }
  } else {
    proposal = proposalOrId;
  }

  const event = await Event.findOne({
    _id: proposal.eventId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!event) {
    throw new ProposalServiceError(404, 'Referenced event no longer exists');
  }

  // Safe Concurrency & Stale Proposal Check
  const versionMismatch =
    proposal.baseEventVersion !== event.__v ||
    (expectedVersion !== undefined && event.__v !== expectedVersion);

  if (versionMismatch) {
    // Mark proposal as stale to prevent future race conditions
    proposal.status = 'stale';
    proposal.isApplying = false;
    proposal.reviewedAt = new Date();
    await proposal.save();

    throw new ProposalServiceError(
      409,
      `Conflict: The event was modified (current v${event.__v}) after this proposal was created (based on v${proposal.baseEventVersion}). Proposal is now stale. Please request a new revision.`,
      { currentEventVersion: event.__v, baseEventVersion: proposal.baseEventVersion, proposalStatus: 'stale' }
    );
  }

  return { proposal, event };
}

/**
 * Approves and atomically applies proposal changes to the active event.
 * Enforces atomic concurrency locking, version checks, and transactional/compensating rollback.
 */
export async function approveProposal(
  userId: string,
  eventId: string,
  proposalId: string,
  expectedVersion?: number
): Promise<{ event: EventEntity; proposal: PlanProposalEntity }> {
  if (!mongoose.Types.ObjectId.isValid(proposalId) || !mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ProposalServiceError(404, 'Invalid event or proposal ID');
  }

  // 1. Concurrency Defense: Atomically acquire lock on proposal
  const claimedProposal = await PlanProposal.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(proposalId),
      userId: new mongoose.Types.ObjectId(userId),
      eventId: new mongoose.Types.ObjectId(eventId),
      status: 'pending',
      isApplying: { $ne: true },
    },
    { $set: { isApplying: true } },
    { new: true }
  );

  if (!claimedProposal) {
    const existing = await PlanProposal.findOne({
      _id: new mongoose.Types.ObjectId(proposalId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!existing) {
      throw new ProposalServiceError(404, 'Proposal not found');
    }
    if (existing.eventId.toString() !== eventId) {
      throw new ProposalServiceError(404, 'Proposal does not belong to specified event');
    }
    if (existing.isApplying) {
      throw new ProposalServiceError(409, 'Proposal is currently being approved by another concurrent request.');
    }
    throw new ProposalServiceError(
      400,
      `Cannot review proposal with status "${existing.status}". Only pending proposals can be reviewed.`
    );
  }

  // 2. Validate event and version concurrency
  let eventDoc: InstanceType<typeof Event>;
  try {
    const validated = await validateProposalForApproval(userId, claimedProposal, expectedVersion);
    eventDoc = validated.event;
  } catch (validationErr) {
    claimedProposal.isApplying = false;
    await claimedProposal.save();
    throw validationErr;
  }

  if (eventDoc._id.toString() !== eventId) {
    claimedProposal.isApplying = false;
    await claimedProposal.save();
    throw new ProposalServiceError(404, 'Proposal does not belong to specified event');
  }

  // 3. Atomicity & Compensating Rollback
  const createdTaskIds: mongoose.Types.ObjectId[] = [];
  const deletedTaskBackups: Array<Partial<ITask>> = [];

  try {
    // 3a. Apply budget deltas
    if (claimedProposal.proposedChanges.budgetDeltas && claimedProposal.proposedChanges.budgetDeltas.length > 0) {
      const categories = claimedProposal.proposedChanges.budgetDeltas.map((d) => ({
        category: d.category,
        allocatedAmount: d.proposedAmount,
        isLocked: false,
        rationale: d.rationale,
      }));

      const budgetResult = calculateAuthoritativeBudget({
        totalBudget: eventDoc.totalBudget,
        currency: eventDoc.currency,
        categories,
      });

      if (budgetResult.success) {
        eventDoc.budgetItems = budgetResult.items.map((i) => ({
          category: i.category,
          percentageOfTotal: i.percentageOfTotal,
          allocatedAmount: i.allocatedAmount,
          allocatedAmountMinor: i.allocatedAmountMinor,
          actualSpent: 0,
          actualSpentMinor: 0,
          isLocked: i.isLocked,
          rationale: i.rationale,
        }));
      }
    }

    // 3b. Apply task changes
    if (claimedProposal.proposedChanges.taskChanges && claimedProposal.proposedChanges.taskChanges.length > 0) {
      for (const change of claimedProposal.proposedChanges.taskChanges) {
        if (change.action === 'add') {
          const newTask = await Task.create({
            eventId: eventDoc._id,
            userId: eventDoc.userId,
            phase: change.phase,
            title: change.title.trim(),
            description: change.description,
            priority: change.priority || 'medium',
            status: 'pending',
          });
          createdTaskIds.push(newTask._id);
        } else if (change.action === 'remove' && change.targetTaskId && mongoose.Types.ObjectId.isValid(change.targetTaskId)) {
          const taskToDelete = await Task.findOne({
            _id: new mongoose.Types.ObjectId(change.targetTaskId),
            eventId: eventDoc._id,
            userId: eventDoc.userId,
          });
          if (taskToDelete) {
            deletedTaskBackups.push(taskToDelete.toObject());
            await Task.deleteOne({ _id: taskToDelete._id });
          }
        }
      }
    }

    // 3c. Save event first (enforces optimisticConcurrency)
    await eventDoc.save();

    // 3d. Mark proposal applied ONLY after event save succeeds
    claimedProposal.status = 'applied';
    claimedProposal.isApplying = false;
    claimedProposal.reviewedAt = new Date();
    await claimedProposal.save();

    return {
      event: toEventEntity(eventDoc),
      proposal: toProposalEntity(claimedProposal),
    };
  } catch (err: unknown) {
    // Compensating rollback: Revert all task mutations
    if (createdTaskIds.length > 0) {
      await Task.deleteMany({ _id: { $in: createdTaskIds } });
    }
    if (deletedTaskBackups.length > 0) {
      await Task.insertMany(deletedTaskBackups);
    }

    // Release concurrency lock on proposal
    try {
      claimedProposal.isApplying = false;
      await claimedProposal.save();
    } catch {
      // ignore
    }

    if (err && typeof err === 'object' && (err as { name?: string }).name === 'VersionError') {
      throw new ProposalServiceError(
        409,
        'Conflict: Event was updated concurrently by another operation while applying proposal.',
        { currentEventVersion: eventDoc.__v }
      );
    }

    throw err;
  }
}

/**
 * Creates a raw proposal record (used in testing or programmatic seeding).
 */
export async function createProposal(
  userId: string,
  eventId: string,
  userPrompt: string,
  proposedChanges: ProposedChangesPayload
): Promise<PlanProposalEntity> {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ProposalServiceError(404, 'Event not found');
  }

  const event = await Event.findOne({
    _id: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!event) {
    throw new ProposalServiceError(404, 'Event not found');
  }

  const proposal = await PlanProposal.create({
    eventId: event._id,
    userId: new mongoose.Types.ObjectId(userId),
    baseEventVersion: event.__v,
    userPrompt: userPrompt.trim(),
    proposedChanges,
    status: 'pending',
  });

  return toProposalEntity(proposal);
}
