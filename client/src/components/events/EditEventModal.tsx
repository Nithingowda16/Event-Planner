import React, { useState, useEffect } from 'react';
import type { EventEntity, UpdateEventWithVersionInput } from '@celebrateos/shared';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { api, ApiError } from '../../services/api.js';

export interface EditEventModalProps {
  isOpen: boolean;
  event: EventEntity | null;
  onClose: () => void;
  onEventUpdated: (updatedEvent: EventEntity) => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  event,
  onClose,
  onEventUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setLocation(event.location);
      setGuestCount(String(event.guestCount));
      setTotalBudget(String(event.totalBudget));
      setServerError(null);
    }
  }, [event]);

  if (!event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parsedGuests = parseInt(guestCount, 10);
    const parsedBudget = parseFloat(totalBudget);

    if (!title.trim() || title.trim().length < 3) {
      setServerError('Title must be at least 3 characters.');
      return;
    }
    if (isNaN(parsedGuests) || parsedGuests <= 0) {
      setServerError('Guest count must be at least 1.');
      return;
    }
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      setServerError('Total budget must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateEventWithVersionInput = {
        title: title.trim(),
        location: location.trim(),
        guestCount: parsedGuests,
        totalBudget: parsedBudget,
        expectedVersion: event.version,
      };

      const result = await api.events.update(event.id, payload);
      onEventUpdated(result.event);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setServerError('Conflict: This event was modified elsewhere. Please refresh to load the latest version.');
      } else {
        const msg = err instanceof ApiError ? err.message : 'Failed to update event';
        setServerError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Celebration Details"
      description={`Updating event v${event.version}. Optimistic concurrency guards prevent accidental overwrites.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="edit-event-form"
            isLoading={isSubmitting}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-event-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
          id="edit-title-input"
          label="Celebration Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <Input
          id="edit-location-input"
          label="Location or Venue"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Input
            id="edit-guest-count-input"
            label="Guest Count"
            type="number"
            min="1"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Input
            id="edit-budget-input"
            label={`Total Budget (${event.currency === 'INR' || !event.currency ? '₹ INR' : event.currency})`}
            type="number"
            min="1"
            step="any"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
};
