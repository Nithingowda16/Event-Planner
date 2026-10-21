import type {
  ProposedBudgetDelta,
  ProposedTaskChange,
  ProposedChangesPayload,
  CalculatedBudgetItem,
  TimelineTaskEntity,
} from '@celebrateos/shared';
import type { IBudgetItemSubdoc } from '../models/event.model.js';

export interface DiffComputationInput {
  currentBudgetItems: IBudgetItemSubdoc[];
  calculatedProposedBudget: CalculatedBudgetItem[];
  proposedTaskChanges: ProposedTaskChange[];
  proposedVendorRecommendations?: string[];
  summary: string;
}

/**
 * Computes deterministic budget deltas comparing current allocations with proposed allocations.
 */
export function computeBudgetDeltas(
  currentItems: IBudgetItemSubdoc[],
  proposedItems: CalculatedBudgetItem[]
): ProposedBudgetDelta[] {
  const currentMap = new Map<string, number>();
  for (const item of currentItems) {
    currentMap.set(item.category.trim().toLowerCase(), item.allocatedAmount);
  }

  const deltas: ProposedBudgetDelta[] = [];
  const processedCategories = new Set<string>();

  for (const proposed of proposedItems) {
    const key = proposed.category.trim().toLowerCase();
    processedCategories.add(key);

    const currentAmount = currentMap.get(key) ?? 0;
    const deltaAmount = Math.round((proposed.allocatedAmount - currentAmount) * 100) / 100;

    deltas.push({
      category: proposed.category.trim(),
      currentAmount,
      proposedAmount: proposed.allocatedAmount,
      deltaAmount,
      rationale: proposed.rationale || 'AI optimized allocation based on preferences',
    });
  }

  // Check for categories that exist in current budget but not in proposed
  for (const item of currentItems) {
    const key = item.category.trim().toLowerCase();
    if (!processedCategories.has(key)) {
      deltas.push({
        category: item.category.trim(),
        currentAmount: item.allocatedAmount,
        proposedAmount: 0,
        deltaAmount: -item.allocatedAmount,
        rationale: 'Category removed in proposed plan',
      });
    }
  }

  return deltas;
}

/**
 * Normalizes and deterministically verifies proposed task changes against existing tasks.
 */
export function computeTaskChanges(
  currentTasks: TimelineTaskEntity[],
  proposedChanges: ProposedTaskChange[]
): ProposedTaskChange[] {
  const currentTaskMap = new Map<string, TimelineTaskEntity>();
  for (const task of currentTasks) {
    currentTaskMap.set(task.id, task);
  }

  return proposedChanges.map((change) => {
    if (change.action === 'remove' || change.action === 'modify') {
      if (change.targetTaskId && !currentTaskMap.has(change.targetTaskId)) {
        // Fallback: If target task ID doesn't exist, treat as addition
        return {
          ...change,
          action: 'add',
          targetTaskId: undefined,
        };
      }
    }
    return change;
  });
}

/**
 * Compiles a comprehensive before-and-after diff snapshot.
 */
export function compileDeterministicDiff(input: DiffComputationInput): {
  proposedChanges: ProposedChangesPayload;
  diffSnapshot: Record<string, unknown>;
} {
  const budgetDeltas = computeBudgetDeltas(input.currentBudgetItems, input.calculatedProposedBudget);

  const proposedChanges: ProposedChangesPayload = {
    summary: input.summary,
    budgetDeltas,
    taskChanges: input.proposedTaskChanges,
    vendorRecommendations: input.proposedVendorRecommendations || [],
  };

  const totalDelta = budgetDeltas.reduce((acc, curr) => acc + curr.deltaAmount, 0);

  const diffSnapshot = {
    budgetSummary: {
      categoriesModifiedCount: budgetDeltas.filter((d) => d.deltaAmount !== 0).length,
      netBudgetDelta: Math.round(totalDelta * 100) / 100,
      deltas: budgetDeltas,
    },
    taskSummary: {
      addedCount: input.proposedTaskChanges.filter((t) => t.action === 'add').length,
      removedCount: input.proposedTaskChanges.filter((t) => t.action === 'remove').length,
      modifiedCount: input.proposedTaskChanges.filter((t) => t.action === 'modify').length,
      changes: input.proposedTaskChanges,
    },
    vendorRecommendations: input.proposedVendorRecommendations || [],
  };

  return { proposedChanges, diffSnapshot };
}
