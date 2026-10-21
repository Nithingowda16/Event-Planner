import React, { useState } from 'react';
import type { EventType } from '@celebrateos/shared';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { Button } from '../ui/Button.js';
import type { DashboardEventItem } from '../../types/index.js';

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: Omit<DashboardEventItem, 'id' | 'version'>) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventDate, setEventDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0] ?? '';
  });
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState('100');
  const [totalBudget, setTotalBudget] = useState('15000');
  const [currency, setCurrency] = useState<string>('USD');

  // Validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    eventDate?: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      eventType,
      eventDate,
      location: location.trim(),
      guestCount: parseInt(guestCount, 10),
      totalBudget: parseFloat(totalBudget),
      currency,
    });

    onClose();
  };

  const eventTypeOptions = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'community', label: 'Community Festival' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'baby_shower', label: 'Baby Shower' },
    { value: 'graduation', label: 'Graduation' },
    { value: 'other', label: 'Other Celebration' },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD ($) - US Dollar' },
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
      description="Define celebration parameters for local UI preview. Server persistence, AI generation, and authoritative budget sync will be connected in Milestone 6."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} id="cancel-create-event-btn">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="create-event-form"
            id="submit-create-event-btn"
          >
            Create Celebration (Preview)
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
        <Input
          id="event-title-input"
          label="Celebration Title"
          placeholder="e.g. Maya & Liam's Golden Wedding"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
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
          />

          <Input
            id="event-date-input"
            label="Event Date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            error={errors.eventDate}
          />
        </div>

        <Input
          id="event-location-input"
          label="Location or Venue (Optional)"
          placeholder="e.g. Botanical Gardens, San Francisco"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
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
            error={errors.guestCount}
          />

          <Select
            id="event-currency-select"
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={currencyOptions}
            required
          />
        </div>

        <Input
          id="event-budget-input"
          label="Total Budget"
          type="number"
          min="1"
          step="any"
          value={totalBudget}
          onChange={(e) => setTotalBudget(e.target.value)}
          required
          error={errors.totalBudget}
          helperText="Authoritative server calculations prevent floating-point drift"
        />
      </form>
    </Modal>
  );
};
