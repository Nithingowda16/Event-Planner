import React, { useEffect, useState } from 'react';
import { Sparkles, Eye } from 'lucide-react';
import type { EventEntity, PlanProposalEntity } from '@celebrateos/shared';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { Spinner } from '../ui/Spinner.js';
import { api, ApiError } from '../../services/api.js';

export interface ProposalsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventEntity;
  onSelectProposal: (proposal: PlanProposalEntity) => void;
  onRequestNewRevision: () => void;
}

export const ProposalsListModal: React.FC<ProposalsListModalProps> = ({
  isOpen,
  onClose,
  event,
  onSelectProposal,
  onRequestNewRevision,
}) => {
  const [proposals, setProposals] = useState<PlanProposalEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchProposals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.ai.listProposals(event.id);
        if (isMounted) {
          setProposals(res.proposals);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Failed to fetch event proposals');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProposals();
    return () => {
      isMounted = false;
    };
  }, [isOpen, event.id]);

  const getStatusBadge = (status: string, baseVersion: number) => {
    if (status === 'applied') return <Badge variant="emerald">Applied</Badge>;
    if (status === 'rejected') return <Badge variant="neutral">Rejected</Badge>;
    if (status === 'stale' || event.version !== baseVersion) return <Badge variant="rose">Stale</Badge>;
    return <Badge variant="gold">Pending Review</Badge>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Proposals & Revisions"
      description={`Proposal history for "${event.title}" (Active Event: v${event.version})`}
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              onRequestNewRevision();
            }}
            leftIcon={<Sparkles size={16} />}
            id="proposals-request-new-btn"
          >
            Request AI Revision
          </Button>
          <Button variant="ghost" onClick={onClose} id="proposals-close-btn">
            Close
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && (
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
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <Spinner size="lg" label="Loading proposals..." />
          </div>
        ) : proposals.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-8) var(--space-4)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <Sparkles size={32} style={{ color: 'var(--accent-purple)', margin: '0 auto var(--space-3)' }} />
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
              No AI Proposals Yet
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto var(--space-4)' }}>
              Request an AI revision to explore adjustments to your budget categories, timeline milestones, and planning ideas.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onRequestNewRevision();
              }}
              leftIcon={<Sparkles size={16} />}
              id="empty-proposals-request-btn"
            >
              Request AI Revision
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {proposals.map((proposal) => {
              const isStale = proposal.status === 'stale' || event.version !== proposal.baseEventVersion;
              return (
                <div
                  key={proposal.id}
                  style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--surface-card)',
                    border: isStale ? '1px solid rgba(251, 113, 133, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Base: <strong>v{proposal.baseEventVersion}</strong>
                      </span>
                      {getStatusBadge(proposal.status, proposal.baseEventVersion)}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {new Date(proposal.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {isStale && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-rose)' }}>
                      Note: Active event has advanced to v{event.version}. This proposal is stale and cannot be applied.
                    </div>
                  )}

                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                    "{proposal.userPrompt}"
                  </div>

                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                    {proposal.proposedChanges.summary}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Eye size={14} />}
                      onClick={() => {
                        onClose();
                        onSelectProposal(proposal);
                      }}
                      id={`inspect-proposal-${proposal.id}`}
                    >
                      Inspect Diff
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
