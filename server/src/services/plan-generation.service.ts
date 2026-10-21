import mongoose from 'mongoose';
import { Event } from '../models/event.model.js';
import { Task } from '../models/task.model.js';
import { calculateAuthoritativeBudget, type EventEntity } from '@celebrateos/shared';
import * as geminiService from './gemini.service.js';
import { toEventEntity, EventServiceError } from './event.service.js';

export interface PlanGenerationResult {
  event: EventEntity;
  themeConcept: string;
  executiveSummary: string;
  tasksCreatedCount: number;
  vendorChecklist: Array<{
    category: string;
    estimatedCostPercentage: number;
    keyDeliverables: string;
  }>;
}

/**
 * Orchestrates initial personalized event plan generation using Gemini,
 * applies authoritative deterministic budget calculations, and persists timeline tasks.
 */
export async function generateAndApplyInitialPlan(
  userId: string,
  eventId: string,
  additionalNotes?: string
): Promise<PlanGenerationResult> {
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

  // 1. Generate plan using Gemini with strict schema enforcement
  const aiPlan = await geminiService.generatePlan(eventDoc, additionalNotes);

  // 2. Pass AI budget breakdown through authoritative deterministic budget engine
  const calcResult = calculateAuthoritativeBudget({
    totalBudget: eventDoc.totalBudget,
    currency: eventDoc.currency,
    categories: aiPlan.budgetBreakdown.map((b) => ({
      category: b.category,
      percentage: b.percentage,
      rationale: b.rationale,
      isLocked: false,
    })),
  });

  if (!calcResult.success) {
    throw new EventServiceError(
      502,
      `AI generated an unbalanceable budget breakdown: ${calcResult.message}`,
      calcResult.details
    );
  }

  // 3. Persist authoritative budget items on event
  eventDoc.budgetItems = calcResult.items.map((item) => ({
    category: item.category,
    percentageOfTotal: item.percentageOfTotal,
    allocatedAmount: item.allocatedAmount,
    allocatedAmountMinor: item.allocatedAmountMinor,
    actualSpent: 0,
    actualSpentMinor: 0,
    rationale: item.rationale,
    isLocked: item.isLocked,
  }));

  eventDoc.status = 'planned';
  await eventDoc.save();

  // 4. Persist generated timeline tasks into Task collection
  const taskDocs = [];
  for (const phaseGroup of aiPlan.timelinePhases) {
    for (const taskItem of phaseGroup.tasks) {
      taskDocs.push({
        eventId: eventDoc._id,
        userId: eventDoc.userId,
        phase: phaseGroup.phase,
        title: taskItem.title.trim(),
        description: taskItem.description,
        priority: taskItem.priority,
        category: taskItem.category,
        status: 'pending' as const,
      });
    }
  }

  if (taskDocs.length > 0) {
    await Task.insertMany(taskDocs);
  }

  return {
    event: toEventEntity(eventDoc),
    themeConcept: aiPlan.themeConcept,
    executiveSummary: aiPlan.executiveSummary,
    tasksCreatedCount: taskDocs.length,
    vendorChecklist: aiPlan.vendorChecklist,
  };
}
