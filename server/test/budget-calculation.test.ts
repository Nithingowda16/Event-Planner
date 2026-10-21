import { describe, it, expect } from 'vitest';
import {
  calculateAuthoritativeBudget,
  calculateDeterministicAllocations,
  formatCurrency,
  toMinorUnits,
  fromMinorUnits,
  getCurrencyPrecision,
  BudgetRebalanceInputSchema,
  BudgetItemAllocationInputSchema,
  CreateEventInputSchema,
  AIGeneratedPlanOutputSchema,
} from '@celebrateos/shared';

describe('Authoritative Deterministic Budget Engine', () => {
  describe('1. Ordinary & Even Budgets', () => {
    it('allocates exact amounts when percentages divide evenly', () => {
      const result = calculateAuthoritativeBudget({
        totalBudget: 10000,
        currency: 'USD',
        categories: [
          { category: 'Venue', percentage: 40 },
          { category: 'Catering', percentage: 30 },
          { category: 'Photography', percentage: 20 },
          { category: 'Contingency & Miscellaneous', percentage: 10 },
        ],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.totalAllocated).toBe(10000);
      expect(result.totalAllocatedMinor).toBe(1000000); // 10000 * 100 cents
      expect(result.items).toHaveLength(4);
      expect(result.items.find((i) => i.category === 'Venue')?.allocatedAmount).toBe(4000);
      expect(result.items.find((i) => i.category === 'Catering')?.allocatedAmount).toBe(3000);
      expect(result.items.find((i) => i.category === 'Photography')?.allocatedAmount).toBe(2000);
      expect(result.items.find((i) => i.category === 'Contingency & Miscellaneous')?.allocatedAmount).toBe(1000);
    });
  });

  describe('2. Prime Numbers & Rounding Residual Absorption', () => {
    it('guarantees sum strictly equals total budget for prime budgets with contingency category', () => {
      const totalBudget = 7333.33;
      const result = calculateAuthoritativeBudget({
        totalBudget,
        currency: 'USD',
        contingencyCategoryName: 'Contingency & Miscellaneous',
        categories: [
          { category: 'Venue', percentage: 28.57 },
          { category: 'Catering', percentage: 21.43 },
          { category: 'Music', percentage: 14.29 },
          { category: 'Floral', percentage: 14.29 },
          { category: 'Photo', percentage: 7.14 },
          { category: 'Attire', percentage: 7.14 },
          { category: 'Contingency & Miscellaneous', percentage: 7.14 },
        ],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Exact floating point and minor units equality
      expect(result.totalAllocated).toBe(totalBudget);
      expect(result.totalAllocatedMinor).toBe(toMinorUnits(totalBudget, 2));

      // Sum of all items must match total budget
      const sum = result.items.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
      expect(Math.round(sum * 100) / 100).toBe(totalBudget);

      // Minor units sum must be exact integer equality
      const sumMinor = result.items.reduce((acc, curr) => acc + curr.allocatedAmountMinor, 0);
      expect(sumMinor).toBe(result.totalBudgetMinor);
    });

    it('absorbs rounding residual into largest unlocked category when NO contingency category exists', () => {
      // 100 split 3 ways (33.333... each) without contingency category
      const totalBudget = 100;
      const result = calculateAuthoritativeBudget({
        totalBudget,
        currency: 'USD',
        categories: [
          { category: 'Venue', percentage: 33.33 },
          { category: 'Catering', percentage: 33.33 },
          { category: 'Music', percentage: 33.34 },
        ],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.totalAllocated).toBe(100);
      const sumMinor = result.items.reduce((acc, curr) => acc + curr.allocatedAmountMinor, 0);
      expect(sumMinor).toBe(10000); // 100.00 USD in cents

      // The largest category ('Music' at 33.34%) absorbs any residual cent
      const music = result.items.find((i) => i.category === 'Music');
      expect(music?.allocatedAmount).toBeDefined();
    });
  });

  describe('3. Multi-Currency Minor Unit Precision', () => {
    it('handles INR (2 decimal places / paise)', () => {
      expect(getCurrencyPrecision('INR')).toBe(2);
      expect(toMinorUnits(50000.75, 2)).toBe(5000075);
      expect(fromMinorUnits(5000075, 2)).toBe(50000.75);

      const result = calculateAuthoritativeBudget({
        totalBudget: 500000,
        currency: 'INR',
        categories: [
          { category: 'Mandap & Venue', percentage: 45 },
          { category: 'Feast & Sweets', percentage: 35 },
          { category: 'Contingency', percentage: 20 },
        ],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.currency).toBe('INR');
      expect(result.totalAllocated).toBe(500000);
      expect(result.totalAllocatedMinor).toBe(50000000); // 500,000 * 100 paise
    });

    it('handles JPY (0 decimal places / no minor units)', () => {
      expect(getCurrencyPrecision('JPY')).toBe(0);
      expect(toMinorUnits(150000, 0)).toBe(150000);

      const result = calculateAuthoritativeBudget({
        totalBudget: 150000,
        currency: 'JPY',
        categories: [
          { category: 'Venue', percentage: 50 },
          { category: 'Dinner', percentage: 50 },
        ],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.precision).toBe(0);
      expect(result.totalAllocated).toBe(150000);
      expect(result.totalAllocatedMinor).toBe(150000);
    });

    it('handles BHD (3 decimal places / fils)', () => {
      expect(getCurrencyPrecision('BHD')).toBe(3);
      expect(toMinorUnits(120.555, 3)).toBe(120555);

      const result = calculateAuthoritativeBudget({
        totalBudget: 120.555,
        currency: 'BHD',
        categories: [
          { category: 'Hall', percentage: 60 },
          { category: 'Buffet', percentage: 40 },
        ],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.totalAllocated).toBe(120.555);
      expect(result.totalAllocatedMinor).toBe(120555);
    });
  });

  describe('4. Locked Category Constraints & Boundary Conditions', () => {
    it('preserves locked amounts and distributes remainder across unlocked categories', () => {
      const result = calculateAuthoritativeBudget({
        totalBudget: 10000,
        currency: 'USD',
        categories: [
          { category: 'Venue', allocatedAmount: 4500, isLocked: true },
          { category: 'Catering', percentage: 60, isLocked: false },
          { category: 'Decor', percentage: 40, isLocked: false },
        ],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.totalAllocated).toBe(10000);
      expect(result.lockedTotal).toBe(4500);
      expect(result.unlockedTotal).toBe(5500);

      const venue = result.items.find((i) => i.category === 'Venue');
      expect(venue?.allocatedAmount).toBe(4500);
      expect(venue?.isLocked).toBe(true);

      const catering = result.items.find((i) => i.category === 'Catering');
      expect(catering?.allocatedAmount).toBe(3300); // 60% of remaining 5500

      const decor = result.items.find((i) => i.category === 'Decor');
      expect(decor?.allocatedAmount).toBe(2200); // 40% of remaining 5500
    });

    it('rejects with LOCKED_EXCEEDS_BUDGET when locked allocations exceed total budget', () => {
      const result = calculateAuthoritativeBudget({
        totalBudget: 5000,
        currency: 'USD',
        categories: [
          { category: 'Venue', allocatedAmount: 4000, isLocked: true },
          { category: 'Catering', allocatedAmount: 1500, isLocked: true },
          { category: 'Music', percentage: 100, isLocked: false },
        ],
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.code).toBe('LOCKED_EXCEEDS_BUDGET');
      expect(result.message).toContain('exceed total budget');
      expect(result.details?.['excess']).toBe(500);
    });

    it('succeeds when ALL categories are locked and exactly equal total budget', () => {
      const result = calculateAuthoritativeBudget({
        totalBudget: 8000,
        currency: 'USD',
        categories: [
          { category: 'Venue', allocatedAmount: 5000, isLocked: true },
          { category: 'Catering', allocatedAmount: 3000, isLocked: true },
        ],
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.totalAllocated).toBe(8000);
      expect(result.lockedTotal).toBe(8000);
      expect(result.unlockedTotal).toBe(0);
    });

    it('rejects with ALL_LOCKED_MISMATCH when ALL categories are locked and sum does not equal total budget', () => {
      const result = calculateAuthoritativeBudget({
        totalBudget: 8000,
        currency: 'USD',
        categories: [
          { category: 'Venue', allocatedAmount: 5000, isLocked: true },
          { category: 'Catering', allocatedAmount: 2000, isLocked: true },
        ],
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.code).toBe('ALL_LOCKED_MISMATCH');
      expect(result.message).toContain('All categories are locked, but their sum');
    });

    it('rejects with INVALID_AMOUNT when a locked category is missing allocatedAmount', () => {
      const result = calculateAuthoritativeBudget({
        totalBudget: 5000,
        currency: 'USD',
        categories: [
          { category: 'Venue', isLocked: true }, // Missing allocatedAmount
          { category: 'Catering', percentage: 100, isLocked: false },
        ],
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.code).toBe('INVALID_AMOUNT');
    });
  });

  describe('5. Input Validation & Error Handling', () => {
    it('rejects negative or zero total budget with INVALID_TOTAL_BUDGET', () => {
      const zeroResult = calculateAuthoritativeBudget({
        totalBudget: 0,
        categories: [{ category: 'Venue', percentage: 100 }],
      });
      expect(zeroResult.success).toBe(false);
      if (!zeroResult.success) {
        expect(zeroResult.code).toBe('INVALID_TOTAL_BUDGET');
      }

      const negativeResult = calculateAuthoritativeBudget({
        totalBudget: -500,
        categories: [{ category: 'Venue', percentage: 100 }],
      });
      expect(negativeResult.success).toBe(false);
      if (!negativeResult.success) {
        expect(negativeResult.code).toBe('INVALID_TOTAL_BUDGET');
      }
    });

    it('rejects empty categories array with EMPTY_ALLOCATIONS', () => {
      const result = calculateAuthoritativeBudget({
        totalBudget: 1000,
        categories: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('EMPTY_ALLOCATIONS');
      }
    });

    it('rejects duplicate category names with DUPLICATE_CATEGORIES', () => {
      const result = calculateAuthoritativeBudget({
        totalBudget: 5000,
        categories: [
          { category: 'Venue', percentage: 50 },
          { category: 'venue', percentage: 50 }, // Duplicate (case-insensitive)
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('DUPLICATE_CATEGORIES');
        expect(result.message).toContain('Duplicate budget category detected');
      }
    });

    it('rejects negative percentages with INVALID_PERCENTAGES', () => {
      const result = calculateAuthoritativeBudget({
        totalBudget: 5000,
        categories: [
          { category: 'Venue', percentage: -20 },
          { category: 'Catering', percentage: 120 },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_PERCENTAGES');
      }
    });
  });

  describe('6. Backward-Compatible Preview Calculation', () => {
    it('calculateDeterministicAllocations returns formatted array for valid input', () => {
      const allocations = calculateDeterministicAllocations(1000, [
        { category: 'Venue', percentage: 50 },
        { category: 'Catering', percentage: 50 },
      ]);
      expect(allocations).toHaveLength(2);
      expect(allocations[0]?.allocatedAmount).toBe(500);
      expect(allocations[1]?.allocatedAmount).toBe(500);
    });

    it('calculateDeterministicAllocations returns empty array for invalid totalBudget', () => {
      const allocations = calculateDeterministicAllocations(-100, [
        { category: 'Venue', percentage: 100 },
      ]);
      expect(allocations).toEqual([]);
    });

    it('formatCurrency correctly formats Indian Rupees (INR) with en-IN numbering', () => {
      // Prompt examples: ₹500, ₹12,500, ₹1,25,000
      expect(formatCurrency(500, 'INR')).toBe('₹500');
      expect(formatCurrency(12500, 'INR')).toBe('₹12,500');
      expect(formatCurrency(125000, 'INR')).toBe('₹1,25,000');
      // Defaults to INR when currency is omitted
      expect(formatCurrency(125000)).toBe('₹1,25,000');
      expect(formatCurrency(0)).toBe('₹0');
    });

    it('formatCurrency supports other currencies if encountered in legacy data', () => {
      expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });
  });

  describe('7. Zod Schema Verification', () => {
    it('BudgetRebalanceInputSchema accepts valid unique categories and defaults to INR', () => {
      const parsed = BudgetRebalanceInputSchema.safeParse({
        totalBudget: 150000,
        categories: [
          { category: 'Venue', percentage: 50 },
          { category: 'Catering', percentage: 50 },
        ],
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.currency).toBe('INR');
      }
    });

    it('BudgetRebalanceInputSchema rejects duplicate categories', () => {
      const parsed = BudgetRebalanceInputSchema.safeParse({
        totalBudget: 15000,
        categories: [
          { category: 'Catering', percentage: 50 },
          { category: ' catering ', percentage: 50 },
        ],
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain('Duplicate budget categories detected');
      }
    });

    it('BudgetItemAllocationInputSchema requires allocatedAmount when isLocked is true', () => {
      const invalid = BudgetItemAllocationInputSchema.safeParse({
        category: 'Venue',
        isLocked: true,
      });
      expect(invalid.success).toBe(false);

      const valid = BudgetItemAllocationInputSchema.safeParse({
        category: 'Venue',
        isLocked: true,
        allocatedAmount: 2500,
      });
      expect(valid.success).toBe(true);
    });

    it('CreateEventInputSchema rejects non-positive budgets', () => {
      const invalid = CreateEventInputSchema.safeParse({
        title: 'Wedding Gala',
        eventType: 'wedding',
        eventDate: new Date().toISOString(),
        location: 'Grand Ballroom',
        guestCount: 150,
        totalBudget: 0, // Must be positive
      });
      expect(invalid.success).toBe(false);
    });

    it('AIGeneratedPlanOutputSchema rejects duplicate categories in AI response', () => {
      const invalid = AIGeneratedPlanOutputSchema.safeParse({
        themeConcept: 'Rustic Autumn',
        executiveSummary: 'An intimate autumn wedding',
        budgetBreakdown: [
          { category: 'Floral', percentage: 20, rationale: 'Centerpieces' },
          { category: 'floral', percentage: 15, rationale: 'Bouquets' },
        ],
        timelinePhases: [
          {
            phase: 'pre_event',
            tasks: [{ title: 'Book Florist', priority: 'high', category: 'Floral', description: 'Source flowers' }],
          },
        ],
        vendorChecklist: [
          { category: 'Florist', estimatedCostPercentage: 35, keyDeliverables: 'Bouquets and decor' },
        ],
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toContain('duplicate');
      }
    });
  });
});
