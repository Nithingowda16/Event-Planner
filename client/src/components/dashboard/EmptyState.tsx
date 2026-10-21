import React from 'react';
import { Sparkles, Plus, ShieldCheck, Wallet, GitCompare } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import './EmptyState.css';

export interface EmptyStateProps {
  onCreateEvent: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateEvent }) => {
  return (
    <section aria-labelledby="empty-state-heading" className="celebrate-empty-state">
      <div className="celebrate-empty-icon" aria-hidden="true">
        <Sparkles size={36} />
      </div>

      <h2 id="empty-state-heading" className="celebrate-empty-title">
        No Celebrations Created Yet
      </h2>

      <p className="celebrate-empty-description">
        Welcome to <strong>Swakarya</strong>. Your journey starts by defining an event.
        Our Gemini 2.5 Flash AI integration creates comprehensive timeline milestones,
        conceptual vendor ideas, and deterministic multi-currency budget allocations with zero floating-point drift.
      </p>

      <div className="celebrate-empty-features" aria-label="Key Platform Capabilities">
        <Badge variant="gold" size="md" icon={<Sparkles size={14} />}>
          Gemini Structured Plans
        </Badge>
        <Badge variant="emerald" size="md" icon={<Wallet size={14} />}>
          Authoritative Backend Math
        </Badge>
        <Badge variant="purple" size="md" icon={<GitCompare size={14} />}>
          Proposal Diff Engine
        </Badge>
        <Badge variant="blue" size="md" icon={<ShieldCheck size={14} />}>
          100% IDOR & Tenant Isolation
        </Badge>
      </div>

      <Button
        variant="primary"
        size="lg"
        leftIcon={<Plus size={20} />}
        onClick={onCreateEvent}
        id="empty-state-create-btn"
      >
        Create Your First Celebration
      </Button>
    </section>
  );
};
