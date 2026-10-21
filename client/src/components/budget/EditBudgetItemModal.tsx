import React, { useState, useEffect } from 'react';
import type { BudgetItemEntity, BudgetSummary } from '@celebrateos/shared';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { api, ApiError } from '../../services/api.js';

export interface EditBudgetItemModalProps {
  isOpen: boolean;
  eventId: string;
  item: BudgetItemEntity | null;
  currency: string;
  onClose: () => void;
  onBudgetUpdated: (budget: BudgetSummary) => void;
}

export const EditBudgetItemModal: React.FC<EditBudgetItemModalProps> = ({
  isOpen,
  eventId,
  item,
  currency,
  onClose,
  onBudgetUpdated,
}) => {
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [actualSpent, setActualSpent] = useState('');
  const [rationale, setRationale] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setAllocatedAmount(String(item.allocatedAmount));
      setActualSpent(String(item.actualSpent));
      setRationale(item.rationale || '');
      setIsLocked(item.isLocked);
      setServerError(null);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parsedAllocated = parseFloat(allocatedAmount);
    const parsedSpent = parseFloat(actualSpent);

    if (isNaN(parsedAllocated) || parsedAllocated < 0) {
      setServerError('Allocated amount cannot be negative.');
      return;
    }
    if (isNaN(parsedSpent) || parsedSpent < 0) {
      setServerError('Actual spent cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.budget.updateItem(eventId, item.id, {
        allocatedAmount: parsedAllocated,
        actualSpent: parsedSpent,
        rationale: rationale.trim() || undefined,
        isLocked,
      });

      onBudgetUpdated(result.budget);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update budget item on server';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Category: ${item.category}`}
      description="Allocations are recalculated authoritatively on the server using integer minor units."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="edit-budget-item-form"
            isLoading={isSubmitting}
            loadingText="Rebalancing..."
          >
            Update Allocation
          </Button>
        </>
      }
    >
      <form id="edit-budget-item-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {serverError && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--accent-rose-soft)',
              border: '1px solid rgba(251, 113, 133, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {serverError}
          </div>
        )}

        <Input
          id="budget-item-amount"
          label={`Allocated Amount (${currency === 'INR' || !currency ? '₹ INR' : currency})`}
          type="number"
          min="0"
          step="any"
          value={allocatedAmount}
          onChange={(e) => setAllocatedAmount(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <Input
          id="budget-item-spent"
          label={`Actual Spent to Date (${currency === 'INR' || !currency ? '₹ INR' : currency})`}
          type="number"
          min="0"
          step="any"
          value={actualSpent}
          onChange={(e) => setActualSpent(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <Input
          id="budget-item-rationale"
          label="Budget Rationale / Notes (Optional)"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="e.g. Venue booking deposit including tables & chairs"
          disabled={isSubmitting}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}>
          <input
            type="checkbox"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
            disabled={isSubmitting}
            style={{ width: 16, height: 16, accentColor: 'var(--accent-gold)' }}
          />
          <span><strong>Lock category amount</strong> (exempt from automatic AI or rebalance redistribution)</span>
        </label>
      </form>
    </Modal>
  );
};
