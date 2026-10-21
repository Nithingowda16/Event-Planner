import React, { useState } from 'react';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import type { EventEntity, PlanProposalEntity } from '@celebrateos/shared';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { api, ApiError } from '../../services/api.js';

export interface RequestRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventEntity;
  onProposalCreated: (proposal: PlanProposalEntity) => void;
}

const quickPromptSuggestions = [
  'Shift 5% from decor to live entertainment and photography',
  'Add day-of rehearsal dinner and photo-session tasks',
  'Optimize for an intimate, relaxed, and eco-friendly celebration',
  'Reserve a larger contingency buffer for unexpected logistics',
  'Add pre-event vendor tastings and day-of setup checklist',
];

export const RequestRevisionModal: React.FC<RequestRevisionModalProps> = ({
  isOpen,
  onClose,
  event,
  onProposalCreated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError('Please provide instructions for the AI revision.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setLoadingStep('Consulting Gemini AI for structured revision...');

    try {
      // Step feedback simulated for responsive UI
      const timer = setTimeout(() => {
        setLoadingStep('Calculating authoritative budget and compiling plan diff...');
      }, 1800);

      const result = await api.ai.proposeRevision(event.id, {
        userPrompt: trimmed,
      });

      clearTimeout(timer);
      setPrompt('');
      onProposalCreated(result.proposal);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError('AI rate limit reached. Please wait a moment before requesting another revision.');
        } else if (err.status === 502) {
          setError(
            err.message ||
              'Gemini AI response could not be validated against Swakarya schema. Please try refining your prompt.'
          );
        } else if (err.status === 409) {
          setError(
            err.message ||
              'Conflict: Event version has changed. Please refresh the event before generating a revision.'
          );
        } else {
          setError(err.message || 'Failed to generate AI proposal. Please try again.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while requesting revision.');
      }
    } finally {
      setIsSubmitting(false);
      setLoadingStep('');
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title="Request AI Revision Proposal"
      description={`Generate an AI-optimized proposal for "${event.title}" without mutating your active plan.`}
      maxWidth="600px"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            id="cancel-request-revision-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="request-revision-form"
            isLoading={isSubmitting}
            loadingText={loadingStep || 'Generating Proposal...'}
            leftIcon={<Sparkles size={16} />}
            id="submit-request-revision-btn"
          >
            Generate Proposal
          </Button>
        </>
      }
    >
      <form
        id="request-revision-form"
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        {/* Anti-Hallucination & Safe State Banner */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--accent-purple-soft)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2)',
          }}
        >
          <Sparkles size={16} style={{ color: 'var(--accent-purple)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Safe Review Flow:</strong> This will produce
            a <em>Plan Proposal</em> with a complete side-by-side diff. Your active event budget and timeline
            tasks will <strong>not</strong> be modified until you explicitly approve the proposal.
          </div>
        </div>

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
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="revision-prompt-input"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            What adjustments would you like Gemini to make?
          </label>
          <textarea
            id="revision-prompt-input"
            rows={4}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            placeholder="e.g. Reduce decor budget to 8% and allocate the difference to a live band. Add milestone tasks for securing sound permits."
            maxLength={1000}
            required
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--surface-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
              marginTop: 'var(--space-1)',
            }}
          >
            <span>Target event baseline: v{event.version}</span>
            <span>{prompt.length}/1000 characters</span>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div>
          <span
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-2)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Quick Suggestions:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {quickPromptSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                disabled={isSubmitting}
                style={{
                  padding: 'var(--space-1) var(--space-2)',
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                }}
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>

        {isSubmitting && (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2)',
              color: 'var(--accent-purple)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            <RefreshCw size={14} className="spin-animation" />
            <span>{loadingStep || 'Processing AI request...'}</span>
          </div>
        )}
      </form>
    </Modal>
  );
};
