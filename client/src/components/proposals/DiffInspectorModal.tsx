import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  DollarSign,
  Calendar,
  Layers,
} from 'lucide-react';
import type { EventEntity, PlanProposalEntity, ProposedBudgetDelta, ProposedTaskChange } from '@celebrateos/shared';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { api, ApiError } from '../../services/api.js';
import './DiffInspectorModal.css';

export interface DiffInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventEntity;
  proposal: (PlanProposalEntity & { diffSnapshot?: Record<string, unknown> }) | null;
  onApproved: (updatedEvent: EventEntity, updatedProposal: PlanProposalEntity) => void;
  onRejected: (updatedProposal: PlanProposalEntity) => void;
  onRequestNewRevision?: () => void;
}

type DiffTab = 'budget' | 'tasks' | 'vendors';

export const DiffInspectorModal: React.FC<DiffInspectorModalProps> = ({
  isOpen,
  onClose,
  event,
  proposal,
  onApproved,
  onRejected,
  onRequestNewRevision,
}) => {
  const [activeTab, setActiveTab] = useState<DiffTab>('budget');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  if (!proposal) return null;

  const currentStatus = localStatus || proposal.status;
  const isStale = currentStatus === 'stale' || event.version !== proposal.baseEventVersion;
  const isPending = currentStatus === 'pending' && !isStale;

  const budgetDeltas: ProposedBudgetDelta[] = proposal.proposedChanges.budgetDeltas || [];
  const taskChanges: ProposedTaskChange[] = proposal.proposedChanges.taskChanges || [];
  const vendorRecommendations: string[] = proposal.proposedChanges.vendorRecommendations || [];

  const addedTasks = taskChanges.filter((t) => t.action === 'add');
  const removedTasks = taskChanges.filter((t) => t.action === 'remove');
  const modifiedBudgetCount = budgetDeltas.filter((b) => b.deltaAmount !== 0).length;

  const netBudgetDelta = budgetDeltas.reduce((acc, curr) => acc + curr.deltaAmount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: event.currency || 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    setActionError(null);

    try {
      const result = await api.ai.approveProposal(event.id, proposal.id, event.version);
      onApproved(result.event, result.proposal);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setLocalStatus('stale');
          setActionError(
            err.message ||
              'Conflict: The event was modified concurrently. This proposal is now stale and cannot be applied.'
          );
        } else {
          setActionError(err.message || 'Failed to approve proposal. Please try again.');
        }
      } else if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('An unexpected error occurred during approval.');
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setActionError(null);

    try {
      const result = await api.ai.rejectProposal(event.id, proposal.id);
      setLocalStatus('rejected');
      onRejected(result.proposal);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setActionError(err.message || 'Failed to reject proposal.');
      } else if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('An unexpected error occurred during rejection.');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isApproving && !isRejecting) onClose();
      }}
      title="AI Proposal Diff Inspector"
      description="Compare proposed adjustments with your active event plan before approving."
      maxWidth="780px"
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 'var(--space-2)' }}>
          {isPending && (
            <div className="diff-footer-consequence">
              <span>
                Approving will apply all budget items and task changes to <strong>v{event.version}</strong>.
                Rejecting keeps your active event 100% untouched.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isApproving || isRejecting}
              id="diff-close-btn"
            >
              Close
            </Button>

            {isPending && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleReject}
                  isLoading={isRejecting}
                  disabled={isApproving}
                  leftIcon={<XCircle size={16} />}
                  id="diff-reject-proposal-btn"
                  title="Discard this proposal without modifying active event"
                >
                  Reject Proposal
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApprove}
                  isLoading={isApproving}
                  disabled={isRejecting}
                  leftIcon={<CheckCircle2 size={16} />}
                  id="diff-approve-proposal-btn"
                  title="Apply proposed budget deltas and tasks to event"
                >
                  Approve & Apply Plan
                </Button>
              </>
            )}

            {isStale && onRequestNewRevision && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  onRequestNewRevision();
                }}
                leftIcon={<Sparkles size={16} />}
                id="diff-request-fresh-revision-btn"
              >
                Request Fresh Revision
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="diff-inspector-container">
        {/* Version Anchor & Status Header */}
        <div className="diff-meta-bar">
          <div className="diff-version-info">
            <Layers size={14} />
            <span>Proposal Base:</span>
            <span className="diff-version-pill">v{proposal.baseEventVersion}</span>
            <span>Current Event:</span>
            <span className="diff-version-pill">v{event.version}</span>
          </div>

          <div>
            {currentStatus === 'pending' && !isStale && (
              <Badge variant="gold">Pending Review</Badge>
            )}
            {currentStatus === 'applied' && (
              <Badge variant="emerald">Applied to Event</Badge>
            )}
            {currentStatus === 'rejected' && (
              <Badge variant="neutral">Rejected</Badge>
            )}
            {isStale && (
              <Badge variant="rose">Stale Proposal</Badge>
            )}
          </div>
        </div>

        {/* Stale Version Alert */}
        {isStale && (
          <div className="diff-stale-banner" role="alert">
            <AlertTriangle size={20} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Event Version Conflict:</strong> The active event was modified (current v{event.version})
              after this proposal was generated (based on v{proposal.baseEventVersion}).
              To protect your active data from stale overwrites, this proposal cannot be applied.
              Please request a fresh revision based on your latest event state.
            </div>
          </div>
        )}

        {/* Action Error Alert */}
        {actionError && (
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
            {actionError}
          </div>
        )}

        {/* Executive Summary Card */}
        <div className="diff-summary-card">
          <div className="diff-summary-prompt">
            Revision Request: <span>"{proposal.userPrompt}"</span>
          </div>
          <p className="diff-summary-text">{proposal.proposedChanges.summary}</p>
        </div>

        {/* Metric Summary Counters */}
        <div className="diff-metrics-grid">
          <div className="diff-metric-card">
            <div className={`diff-metric-value ${modifiedBudgetCount > 0 ? 'positive' : 'neutral'}`}>
              {modifiedBudgetCount}
            </div>
            <div className="diff-metric-label">Categories Adjusted</div>
          </div>

          <div className="diff-metric-card">
            <div className={`diff-metric-value ${netBudgetDelta === 0 ? 'neutral' : netBudgetDelta > 0 ? 'positive' : 'negative'}`}>
              {netBudgetDelta === 0 ? '$0' : formatCurrency(netBudgetDelta)}
            </div>
            <div className="diff-metric-label">Net Budget Delta</div>
          </div>

          <div className="diff-metric-card">
            <div className="diff-metric-value positive">+{addedTasks.length}</div>
            <div className="diff-metric-label">Tasks to Add</div>
          </div>

          <div className="diff-metric-card">
            <div className={`diff-metric-value ${removedTasks.length > 0 ? 'negative' : 'neutral'}`}>
              -{removedTasks.length}
            </div>
            <div className="diff-metric-label">Tasks to Remove</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="diff-tab-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'budget'}
            className={`diff-tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
            id="diff-tab-budget"
          >
            <DollarSign size={16} />
            Budget Changes ({budgetDeltas.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tasks'}
            className={`diff-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
            id="diff-tab-tasks"
          >
            <Calendar size={16} />
            Timeline Tasks ({taskChanges.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'vendors'}
            className={`diff-tab-btn ${activeTab === 'vendors' ? 'active' : ''}`}
            onClick={() => setActiveTab('vendors')}
            id="diff-tab-vendors"
          >
            <Lightbulb size={16} />
            Vendor Ideas ({vendorRecommendations.length})
          </button>
        </div>

        {/* Tab 1: Budget Changes */}
        {activeTab === 'budget' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="diff-budget-table" aria-label="Budget changes comparison">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Current</th>
                    <th>Proposed</th>
                    <th>Delta</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetDeltas.map((item, idx) => {
                    const isIncreased = item.deltaAmount > 0;
                    const isDecreased = item.deltaAmount < 0;
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{item.category}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {formatCurrency(item.currentAmount)}
                        </td>
                        <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                          {formatCurrency(item.proposedAmount)}
                        </td>
                        <td>
                          {isIncreased && (
                            <span className="diff-delta-badge increased">
                              <TrendingUp size={12} />
                              +{formatCurrency(item.deltaAmount)}
                            </span>
                          )}
                          {isDecreased && (
                            <span className="diff-delta-badge decreased">
                              <TrendingDown size={12} />
                              {formatCurrency(item.deltaAmount)}
                            </span>
                          )}
                          {!isIncreased && !isDecreased && (
                            <span className="diff-delta-badge unchanged">
                              No Change ($0)
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '11px', maxWidth: '240px' }}>
                          {item.rationale || 'Maintained allocation'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--surface-base)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Total Budget: <strong>{formatCurrency(event.totalBudget)}</strong></span>
              <span>Authoritative Invariant: <strong>Verified by Server Budget Engine</strong></span>
            </div>
          </div>
        )}

        {/* Tab 2: Timeline Tasks */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {taskChanges.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-6)',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                No task additions or removals proposed.
              </div>
            ) : (
              <div className="diff-task-list" role="list">
                {taskChanges.map((change, idx) => (
                  <div
                    key={idx}
                    role="listitem"
                    className={`diff-task-item ${change.action === 'add' ? 'added' : change.action === 'remove' ? 'removed' : 'modified'}`}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className="diff-task-title">{change.title}</span>
                        <Badge
                          variant={change.action === 'add' ? 'emerald' : change.action === 'remove' ? 'rose' : 'gold'}
                          size="sm"
                        >
                          {change.action === 'add' ? '+ ADDED' : change.action === 'remove' ? '- REMOVED' : '~ MODIFIED'}
                        </Badge>
                      </div>
                      {change.description && (
                        <div className="diff-task-desc">{change.description}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                      <Badge variant="neutral" size="sm">
                        {change.phase.replace('_', ' ')}
                      </Badge>
                      {change.priority && (
                        <Badge
                          variant={change.priority === 'high' ? 'rose' : change.priority === 'medium' ? 'gold' : 'neutral'}
                          size="sm"
                        >
                          {change.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Vendor Recommendations */}
        {activeTab === 'vendors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--accent-purple-soft)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Lightbulb size={16} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
              <div>
                <strong>Planning Suggestions:</strong> These are AI-suggested categories and ideas to explore.
                They are not verified commercial vendors, real phone numbers, or contracted quotes.
              </div>
            </div>

            {vendorRecommendations.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-6)',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                No specific vendor ideas in this revision.
              </div>
            ) : (
              <div className="diff-vendor-ideas">
                {vendorRecommendations.map((idea, idx) => (
                  <div key={idx} className="diff-vendor-idea-item">
                    <Sparkles size={14} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
                    <span>{idea}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
