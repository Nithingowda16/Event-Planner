import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Edit2, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import type { BudgetSummary, BudgetItemEntity, EventEntity } from '@celebrateos/shared';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { Spinner } from '../ui/Spinner.js';
import { EditBudgetItemModal } from './EditBudgetItemModal.js';
import { api, ApiError } from '../../services/api.js';
import { useToast } from '../ui/ToastContext.js';
import { formatCurrency } from '../../utils/currency.js';
import './BudgetView.css';

export interface BudgetViewProps {
  eventId?: string;
  currency?: string;
  event?: EventEntity;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ eventId, currency, event }) => {
  const actualEventId = eventId || event?.id || '';
  const actualCurrency = currency || event?.currency || 'INR';
  const { showToast } = useToast();
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<BudgetItemEntity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [lockingItemId, setLockingItemId] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    if (!actualEventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.budget.get(actualEventId);
      setBudget(result.budget);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load authoritative budget';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [actualEventId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const handleToggleLock = async (item: BudgetItemEntity) => {
    setLockingItemId(item.id);
    try {
      const updatedLocked = !item.isLocked;
      const result = await api.budget.updateItem(actualEventId, item.id, {
        isLocked: updatedLocked,
      });
      setBudget(result.budget);
      showToast(
        updatedLocked
          ? `Locked ${item.category} (exempt from rebalancing)`
          : `Unlocked ${item.category}`,
        'info'
      );
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update category lock';
      showToast(msg, 'error');
    } finally {
      setLockingItemId(null);
    }
  };

  const formatAmount = (amt?: number | null) => {
    const safeAmt = typeof amt === 'number' && !isNaN(amt) ? amt : 0;
    return formatCurrency(safeAmt, actualCurrency);
  };

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center' }} role="status">
        <Spinner size="lg" label="Loading authoritative budget allocations..." color="#f59e0b" />
        <p style={{ marginTop: 'var(--space-3)', color: 'var(--text-secondary)' }}>
          Calculating multi-currency integer minor units...
        </p>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div
        role="alert"
        style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          backgroundColor: 'var(--accent-rose-soft)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--accent-rose)',
        }}
      >
        <AlertCircle size={32} style={{ marginBottom: 'var(--space-2)' }} aria-hidden="true" />
        <h3 style={{ margin: 0, color: 'inherit' }}>Failed to Load Budget</h3>
        <p style={{ margin: 'var(--space-2) 0', color: 'inherit', opacity: 0.9 }}>{error}</p>
        <Button variant="secondary" size="sm" onClick={fetchBudget} leftIcon={<RefreshCw size={16} />}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="celebrate-budget-view">
      {/* Authoritative Math Invariant Guarantee */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ShieldCheck size={18} color="var(--accent-emerald)" aria-hidden="true" />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            <strong>Authoritative Deterministic Engine:</strong> All budget allocations are computed in integer minor currency units.
          </span>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={fetchBudget}>
          Sync
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <section aria-label="Budget Financial Summary" className="celebrate-budget-summary-grid">
        <Card elevation="elevated" className="celebrate-budget-card">
          <span className="celebrate-budget-card-label">Total Event Budget</span>
          <span className="celebrate-budget-card-amount">{formatAmount(budget.totalBudget)}</span>
          <span className="celebrate-budget-card-subtext">Currency: {actualCurrency}</span>
        </Card>

        <Card elevation="elevated" className="celebrate-budget-card">
          <span className="celebrate-budget-card-label">Allocated to Categories</span>
          <span className="celebrate-budget-card-amount" style={{ color: 'var(--accent-gold)' }}>
            {formatAmount(budget.totalAllocated)}
          </span>
          <span className="celebrate-budget-card-subtext">
            {budget.totalBudget > 0 ? (((budget.totalAllocated || 0) / budget.totalBudget) * 100).toFixed(1) : '0.0'}% of total
          </span>
        </Card>

        <Card elevation="elevated" className="celebrate-budget-card">
          <span className="celebrate-budget-card-label">Actual Spent to Date</span>
          <span className="celebrate-budget-card-amount" style={{ color: 'var(--accent-purple)' }}>
            {formatAmount(budget.totalSpent)}
          </span>
          <span className="celebrate-budget-card-subtext">Verified vendor expenditures</span>
        </Card>

        <Card elevation="elevated" className="celebrate-budget-card">
          <span className="celebrate-budget-card-label">Remaining Contingency</span>
          <span
            className="celebrate-budget-card-amount"
            style={{
              color: budget.remainingUnallocated >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}
          >
            {formatAmount(budget.remainingUnallocated)}
          </span>
          <span className="celebrate-budget-card-subtext">Unallocated reserve buffer</span>
        </Card>
      </section>

      {/* Categories Breakdown Card */}
      <Card elevation="glass">
        <CardHeader>
          <CardTitle as="h3">Budget Categories & Allocations</CardTitle>
          <Badge variant="gold" size="sm">
            {(budget.items?.length || 0)} Categories
          </Badge>
        </CardHeader>

        <CardBody style={{ padding: 0, overflowX: 'auto' }}>
          <table className="celebrate-budget-table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Distribution</th>
                <th scope="col">Allocated</th>
                <th scope="col">Actual Spent</th>
                <th scope="col">Lock Status</th>
                <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(budget.items || []).map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{item.category}</span>
                      {item.rationale && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {item.rationale}
                        </span>
                      )}
                    </div>
                  </td>

                  <td style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                      <span>{item.percentageOfTotal.toFixed(1)}%</span>
                    </div>
                    <div className="celebrate-progress-bar-bg" aria-hidden="true">
                      <div
                        className="celebrate-progress-bar-fill"
                        style={{
                          width: `${Math.min(item.percentageOfTotal, 100)}%`,
                          backgroundColor: item.isLocked ? 'var(--accent-purple)' : 'var(--accent-gold)',
                        }}
                      />
                    </div>
                  </td>

                  <td>
                    <strong style={{ color: 'var(--accent-gold)' }}>{formatAmount(item.allocatedAmount)}</strong>
                  </td>

                  <td>{formatAmount(item.actualSpent)}</td>

                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleLock(item)}
                      disabled={lockingItemId === item.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                      }}
                      title={item.isLocked ? 'Click to unlock' : 'Click to lock'}
                      aria-label={`${item.category} is ${item.isLocked ? 'locked' : 'unlocked'}. Click to toggle.`}
                    >
                      {item.isLocked ? (
                        <Badge variant="purple" size="sm" icon={<Lock size={12} />}>
                          Locked
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm" icon={<Unlock size={12} />}>
                          Flexible
                        </Badge>
                      )}
                    </button>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Edit2 size={14} />}
                      onClick={() => {
                        setActiveItem(item);
                        setIsEditModalOpen(true);
                      }}
                      id={`edit-budget-item-${item.id}-btn`}
                      aria-label={`Edit ${item.category} budget`}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Edit Budget Item Modal */}
      <EditBudgetItemModal
        isOpen={isEditModalOpen}
        eventId={actualEventId}
        item={activeItem}
        currency={actualCurrency}
        onClose={() => setIsEditModalOpen(false)}
        onBudgetUpdated={(updatedBudget) => {
          setBudget(updatedBudget);
          showToast('Budget allocation updated and rebalanced authoritatively.', 'success');
        }}
      />
    </div>
  );
};
