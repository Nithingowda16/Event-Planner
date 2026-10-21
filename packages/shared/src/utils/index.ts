import type {
  BudgetCalculationInputItem,
  BudgetCalculationResult,
  CalculatedBudgetItem,
} from '../types/index.js';

export interface PercentageAllocationInput {
  category: string;
  percentage: number;
  rationale?: string;
}

export interface CalculatedAllocationResult {
  category: string;
  percentage: number;
  allocatedAmount: number;
  rationale?: string;
}

/**
 * Currency precision mapping (number of decimal places / minor units)
 * - USD, EUR, GBP, INR, CAD, AUD: 2 (e.g. cents, paise)
 * - JPY, KRW: 0 (no fractional units)
 * - BHD, KWD: 3 (fils)
 */
export const CURRENCY_PRECISION_MAP: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  CAD: 2,
  AUD: 2,
  JPY: 0,
  KRW: 0,
  BHD: 3,
  KWD: 3,
};

/**
 * Returns the minor unit precision (decimal places) for a given currency code.
 * Defaults to 2 (e.g. cents/paise) if unknown.
 */
export function getCurrencyPrecision(currency = 'USD'): number {
  const normalized = currency.toUpperCase().trim();
  const precision = CURRENCY_PRECISION_MAP[normalized];
  return precision !== undefined ? precision : 2;
}

/**
 * Converts a major currency amount (e.g. $100.50 or ₹100.50) to integer minor units (e.g. 10050 cents or paise).
 * Eliminates IEEE 754 binary floating point precision drift.
 */
export function toMinorUnits(amount: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(amount * factor);
}

/**
 * Converts integer minor units back to standard major currency float.
 */
export function fromMinorUnits(minorUnits: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return minorUnits / factor;
}

export interface AuthoritativeBudgetOptions {
  totalBudget: number;
  currency?: string;
  categories: BudgetCalculationInputItem[];
  contingencyCategoryName?: string;
}

/**
 * Authoritative Deterministic Budget Calculation Engine
 *
 * Guarantees:
 * 1. Arithmetic is performed entirely in integer minor units (paise/cents).
 * 2. sum(allocatedAmountMinor) === totalBudgetMinor is strictly invariant.
 * 3. Locked category allocations are preserved without drift.
 * 4. Locked allocations exceeding total budget are rejected with LOCKED_EXCEEDS_BUDGET.
 * 5. All locked allocations summing != total budget are rejected with ALL_LOCKED_MISMATCH.
 * 6. Residual minor-unit discrepancies are deterministically absorbed into Contingency or largest unlocked category.
 * 7. Duplicate categories are rejected with DUPLICATE_CATEGORIES.
 */
export function calculateAuthoritativeBudget({
  totalBudget,
  currency = 'USD',
  categories,
  contingencyCategoryName = 'Contingency & Miscellaneous',
}: AuthoritativeBudgetOptions): BudgetCalculationResult {
  // 1. Validate Total Budget
  if (typeof totalBudget !== 'number' || isNaN(totalBudget) || totalBudget <= 0) {
    return {
      success: false,
      code: 'INVALID_TOTAL_BUDGET',
      message: 'Total budget must be a positive number greater than zero.',
      details: { totalBudget },
    };
  }

  // 2. Validate Category List Existence
  if (!Array.isArray(categories) || categories.length === 0) {
    return {
      success: false,
      code: 'EMPTY_ALLOCATIONS',
      message: 'At least one budget category is required.',
    };
  }

  // 3. Check for Duplicate Categories (case-insensitive)
  const seenCategories = new Set<string>();
  for (const item of categories) {
    const normalized = (item.category || '').trim().toLowerCase();
    if (!normalized) {
      return {
        success: false,
        code: 'EMPTY_ALLOCATIONS',
        message: 'Category names cannot be blank.',
      };
    }
    if (seenCategories.has(normalized)) {
      return {
        success: false,
        code: 'DUPLICATE_CATEGORIES',
        message: `Duplicate budget category detected: "${item.category.trim()}". Category names must be unique within an event.`,
        details: { category: item.category },
      };
    }
    seenCategories.add(normalized);
  }

  const precision = getCurrencyPrecision(currency);
  const totalBudgetMinor = toMinorUnits(totalBudget, precision);

  // 4. Validate Category Inputs (non-negative, percentage limits)
  for (const item of categories) {
    if (item.isLocked) {
      if (item.allocatedAmount === undefined || typeof item.allocatedAmount !== 'number' || isNaN(item.allocatedAmount) || item.allocatedAmount < 0) {
        return {
          success: false,
          code: 'INVALID_AMOUNT',
          message: `Locked category "${item.category}" must specify a non-negative allocatedAmount.`,
          details: { category: item.category, allocatedAmount: item.allocatedAmount },
        };
      }
    }
    if (item.percentage !== undefined) {
      if (typeof item.percentage !== 'number' || isNaN(item.percentage) || item.percentage < 0) {
        return {
          success: false,
          code: 'INVALID_PERCENTAGES',
          message: `Category "${item.category}" has an invalid negative or non-numeric percentage (${item.percentage}).`,
          details: { category: item.category, percentage: item.percentage },
        };
      }
    }
  }

  // 5. Partition into Locked vs. Flexible (Unlocked)
  const lockedCategories = categories.filter((c) => Boolean(c.isLocked));
  const unlockedCategories = categories.filter((c) => !c.isLocked);

  let lockedSumMinor = 0;
  for (const item of lockedCategories) {
    lockedSumMinor += toMinorUnits(item.allocatedAmount!, precision);
  }

  // 6. Check if Locked Allocations Exceed Total Budget
  if (lockedSumMinor > totalBudgetMinor) {
    const lockedTotal = fromMinorUnits(lockedSumMinor, precision);
    const excess = fromMinorUnits(lockedSumMinor - totalBudgetMinor, precision);
    return {
      success: false,
      code: 'LOCKED_EXCEEDS_BUDGET',
      message: `Total locked allocations (${lockedTotal} ${currency}) exceed total budget (${totalBudget} ${currency}) by ${excess} ${currency}.`,
      details: { lockedTotal, totalBudget, excess, currency },
    };
  }

  // 7. Check All Categories Locked Boundary Case
  if (unlockedCategories.length === 0) {
    if (lockedSumMinor !== totalBudgetMinor) {
      const lockedTotal = fromMinorUnits(lockedSumMinor, precision);
      const difference = fromMinorUnits(totalBudgetMinor - lockedSumMinor, precision);
      return {
        success: false,
        code: 'ALL_LOCKED_MISMATCH',
        message: `All categories are locked, but their sum (${lockedTotal} ${currency}) does not equal total budget (${totalBudget} ${currency}). Discrepancy of ${difference} ${currency}.`,
        details: { lockedTotal, totalBudget, difference, currency },
      };
    }

    // All categories locked and exactly equals total budget
    const items: CalculatedBudgetItem[] = lockedCategories.map((c) => {
      const minor = toMinorUnits(c.allocatedAmount!, precision);
      return {
        category: c.category.trim(),
        allocatedAmount: c.allocatedAmount!,
        allocatedAmountMinor: minor,
        percentageOfTotal: totalBudgetMinor > 0 ? Math.round((minor / totalBudgetMinor) * 10000) / 100 : 0,
        isLocked: true,
        rationale: c.rationale,
      };
    });

    return {
      success: true,
      totalBudget,
      totalBudgetMinor,
      totalAllocated: totalBudget,
      totalAllocatedMinor: totalBudgetMinor,
      currency,
      precision,
      items,
      lockedTotal: fromMinorUnits(lockedSumMinor, precision),
      unlockedTotal: 0,
      discrepancyMinor: 0,
    };
  }

  // 8. Distribute Remaining Flexible Budget across Unlocked Categories
  const remainingBudgetMinor = totalBudgetMinor - lockedSumMinor;

  // Determine weight distribution
  const explicitPercentages = unlockedCategories.map((c) => (typeof c.percentage === 'number' ? c.percentage : 0));
  const rawSumPercentages = explicitPercentages.reduce((acc, p) => acc + p, 0);

  const weights: number[] = unlockedCategories.map((_, idx) => {
    if (rawSumPercentages > 0) {
      return (explicitPercentages[idx] ?? 0) / rawSumPercentages;
    }
    // Equal distribution if no percentages provided or sum is zero
    return 1 / unlockedCategories.length;
  });

  // Calculate preliminary allocations in minor units
  let runningUnlockedMinor = 0;
  const calculatedUnlocked: CalculatedBudgetItem[] = unlockedCategories.map((c, idx) => {
    const weight = weights[idx] ?? 0;
    const allocatedMinor = Math.round(remainingBudgetMinor * weight);
    runningUnlockedMinor += allocatedMinor;
    return {
      category: c.category.trim(),
      allocatedAmount: fromMinorUnits(allocatedMinor, precision),
      allocatedAmountMinor: allocatedMinor,
      percentageOfTotal: totalBudgetMinor > 0 ? Math.round((allocatedMinor / totalBudgetMinor) * 10000) / 100 : 0,
      isLocked: false,
      rationale: c.rationale,
    };
  });

  // 9. Rounding Residual Discrepancy Absorption
  const discrepancyMinor = remainingBudgetMinor - runningUnlockedMinor;

  if (discrepancyMinor !== 0 && calculatedUnlocked.length > 0) {
    // Priority 1: Check for explicit contingency/misc category in unlocked
    const contingencyIndex = calculatedUnlocked.findIndex(
      (r) =>
        r.category.toLowerCase() === contingencyCategoryName.toLowerCase() ||
        r.category.toLowerCase().includes('contingency') ||
        r.category.toLowerCase().includes('misc')
    );

    // Priority 2: Absorb into largest unlocked category if no contingency category exists
    const targetIndex =
      contingencyIndex !== -1
        ? contingencyIndex
        : calculatedUnlocked.reduce(
            (maxIdx, curr, idx, arr) =>
              curr.allocatedAmountMinor > (arr[maxIdx]?.allocatedAmountMinor ?? 0) ? idx : maxIdx,
            0
          );

    const target = calculatedUnlocked[targetIndex];
    if (target) {
      target.allocatedAmountMinor += discrepancyMinor;
      target.allocatedAmount = fromMinorUnits(target.allocatedAmountMinor, precision);
      target.percentageOfTotal =
        totalBudgetMinor > 0 ? Math.round((target.allocatedAmountMinor / totalBudgetMinor) * 10000) / 100 : 0;
    }
  }

  // 10. Assemble Final Combined Item List & Verify Invariant
  const finalItems: CalculatedBudgetItem[] = [];

  // Preserve original ordering of categories from input
  for (const original of categories) {
    const origName = original.category.trim();
    if (original.isLocked) {
      const minor = toMinorUnits(original.allocatedAmount!, precision);
      finalItems.push({
        category: origName,
        allocatedAmount: original.allocatedAmount!,
        allocatedAmountMinor: minor,
        percentageOfTotal: totalBudgetMinor > 0 ? Math.round((minor / totalBudgetMinor) * 10000) / 100 : 0,
        isLocked: true,
        rationale: original.rationale,
      });
    } else {
      const unlockedMatch = calculatedUnlocked.find((u) => u.category.toLowerCase() === origName.toLowerCase());
      if (unlockedMatch) {
        finalItems.push(unlockedMatch);
      }
    }
  }

  // Exact Invariant Verification Check
  const finalAllocatedMinor = finalItems.reduce((acc, item) => acc + item.allocatedAmountMinor, 0);

  if (finalAllocatedMinor !== totalBudgetMinor) {
    // Defensive check: This branch should never theoretically trigger due to integer residual absorption
    return {
      success: false,
      code: 'ALL_LOCKED_MISMATCH',
      message: `Internal calculation error: Calculated total (${fromMinorUnits(finalAllocatedMinor, precision)}) does not match budget (${totalBudget}).`,
      details: { finalAllocatedMinor, totalBudgetMinor },
    };
  }

  return {
    success: true,
    totalBudget,
    totalBudgetMinor,
    totalAllocated: fromMinorUnits(finalAllocatedMinor, precision),
    totalAllocatedMinor: finalAllocatedMinor,
    currency,
    precision,
    items: finalItems,
    lockedTotal: fromMinorUnits(lockedSumMinor, precision),
    unlockedTotal: fromMinorUnits(remainingBudgetMinor, precision),
    discrepancyMinor,
  };
}

/**
 * Backward-compatible preview calculation helper.
 * Note: Frontend calculations are previews only; the backend is authoritative.
 */
export function calculateDeterministicAllocations(
  totalBudget: number,
  allocations: PercentageAllocationInput[],
  contingencyCategoryName = 'Contingency & Miscellaneous'
): CalculatedAllocationResult[] {
  const result = calculateAuthoritativeBudget({
    totalBudget,
    currency: 'USD',
    categories: allocations.map((a) => ({
      category: a.category,
      percentage: a.percentage,
      rationale: a.rationale,
      isLocked: false,
    })),
    contingencyCategoryName,
  });

  if (!result.success) {
    return [];
  }

  return result.items.map((item) => ({
    category: item.category,
    percentage: item.percentageOfTotal,
    allocatedAmount: item.allocatedAmount,
    rationale: item.rationale,
  }));
}

/**
 * Formats a currency amount according to localized currency standards.
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    const precision = getCurrencyPrecision(currency);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
