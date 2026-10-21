import React, { useState } from 'react';
import type { EventType, CreateEventInput, EventEntity } from '@celebrateos/shared';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { Button } from '../ui/Button.js';
import { api, ApiError } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventEntity) => void;
  onRequireAuth?: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  onRequireAuth,
}) => {
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventDate, setEventDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0] ?? '';
  });
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState('100');
  const [totalBudget, setTotalBudget] = useState('500000');
  const [currency, setCurrency] = useState<string>('INR');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Client validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    eventDate?: string;
    location?: string;
    guestCount?: string;
    totalBudget?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!title.trim() || title.trim().length < 3) {
      newErrors.title = 'Event title must be at least 3 characters.';
    }
    if (!eventDate) {
      newErrors.eventDate = 'Event date is required.';
    }
    if (!location.trim() || location.trim().length < 2) {
      newErrors.location = 'Location is required (at least 2 characters).';
    }
    const parsedGuests = parseInt(guestCount, 10);
    if (isNaN(parsedGuests) || parsedGuests <= 0) {
      newErrors.guestCount = 'Guest count must be at least 1.';
    }
    const parsedBudget = parseFloat(totalBudget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      newErrors.totalBudget = 'Total budget must be greater than zero.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateEventInput = {
        title: title.trim(),
        eventType,
        eventDate: new Date(eventDate).toISOString(),
        location: location.trim(),
        guestCount: parseInt(guestCount, 10),
        totalBudget: parseFloat(totalBudget),
        currency,
        preferences: {},
      };

      const result = await api.events.create(payload);
      onEventCreated(result.event);
      onClose();
      // Reset form
      setTitle('');
      setLocation('');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create celebration on server';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventTypeOptions = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'community', label: 'Community Festival' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'other', label: 'Other Celebration' },
  ];

  const currencyOptions = [
    { value: 'INR', label: 'INR (₹) - Indian Rupee' },
    { value: 'EUR', label: 'EUR (€) - Euro' },
    { value: 'GBP', label: 'GBP (£) - British Pound' },
    { value: 'AED', label: 'AED (د.إ) - UAE Dirham' },
    { value: 'CAD', label: 'CAD ($) - Canadian Dollar' },
    { value: 'AUD', label: 'AUD ($) - Australian Dollar' },
    { value: 'JPY', label: 'JPY (¥) - Japanese Yen' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Celebration"
      description="Persist a new celebration to MongoDB with authoritative budget allocation and timeline initialization."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} id="cancel-create-event-btn">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="create-event-form"
            isLoading={isSubmitting}
            loadingText="Persisting..."
            id="submit-create-event-btn"
          >
            Create Celebration
          </Button>
        </>
      }
    >
      <form
        id="create-event-form"
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
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
          id="event-title-input"
          label="Celebration Title"
          placeholder="e.g. Maya & Liam's Golden Wedding"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
          error={errors.title}
          helperText="Give your celebration a memorable name"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Select
            id="event-type-select"
            label="Celebration Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            options={eventTypeOptions}
            required
            disabled={isSubmitting}
          />

          <Input
            id="event-date-input"
            label="Event Date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            disabled={isSubmitting}
            error={errors.eventDate}
          />
        </div>

        <Input
          id="event-location-input"
          label="Location or Venue"
          placeholder="e.g. Botanical Gardens, San Francisco"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          disabled={isSubmitting}
          error={errors.location}
          helperText="Where will this celebration take place?"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Input
            id="event-guest-count-input"
            label="Expected Guests"
            type="number"
            min="1"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            required
            disabled={isSubmitting}
            error={errors.guestCount}
          />

          <Select
            id="event-currency-select"
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={currencyOptions}
            required
            disabled={isSubmitting}
          />
        </div>

        <Input
          id="event-budget-input"
          label={currency === 'INR' ? 'Total Budget (₹ INR)' : `Total Budget (${currency})`}
          type="number"
          min="1"
          step="any"
          value={totalBudget}
          onChange={(e) => setTotalBudget(e.target.value)}
          required
          disabled={isSubmitting}
          error={errors.totalBudget}
          helperText="Authoritative server calculations guarantee exact total invariant (e.g. ₹5,00,000)"
        />
      </form>
    </Modal>
  );
};
