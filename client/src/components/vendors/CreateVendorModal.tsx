import React, { useState } from 'react';
import type { VendorStatus, CreateVendorInput, VendorQuotationEntity } from '@celebrateos/shared';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { Button } from '../ui/Button.js';
import { api, ApiError } from '../../services/api.js';

export interface CreateVendorModalProps {
  isOpen: boolean;
  eventId: string;
  currency: string;
  onClose: () => void;
  onVendorCreated: (vendor: VendorQuotationEntity) => void;
}

export const CreateVendorModal: React.FC<CreateVendorModalProps> = ({
  isOpen,
  eventId,
  currency,
  onClose,
  onVendorCreated,
}) => {
  const [category, setCategory] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [status, setStatus] = useState<VendorStatus>('inquired');
  const [deliverablesNotes, setDeliverablesNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parsedAmount = parseFloat(quotedAmount);

    if (!vendorName.trim() || vendorName.trim().length < 2) {
      setServerError('Vendor name must be at least 2 characters.');
      return;
    }
    if (!category.trim() || category.trim().length < 2) {
      setServerError('Category must be at least 2 characters.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setServerError('Quoted amount cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateVendorInput = {
        category: category.trim(),
        vendorName: vendorName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        quotedAmount: parsedAmount,
        status,
        deliverablesNotes: deliverablesNotes.trim() || undefined,
      };

      const result = await api.vendors.create(eventId, payload);
      onVendorCreated(result.vendor);
      onClose();
      // Reset
      setCategory('');
      setVendorName('');
      setContactEmail('');
      setQuotedAmount('');
      setDeliverablesNotes('');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save vendor quote on server';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'inquired', label: 'Inquired (Contacted)' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'hired', label: 'Hired & Confirmed' },
    { value: 'rejected', label: 'Declined' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Vendor Quotation"
      description="Track genuine vendor estimates and contract commitments. AI suggestions are separate conceptual ideas."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="create-vendor-form"
            isLoading={isSubmitting}
            loadingText="Saving Quote..."
            id="submit-create-vendor-btn"
          >
            Save Quotation
          </Button>
        </>
      }
    >
      <form id="create-vendor-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Input
            id="vendor-name-input"
            label="Vendor / Business Name"
            placeholder="e.g. Blossom & Vine Floral Studio"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Input
            id="vendor-category-input"
            label="Service Category"
            placeholder="e.g. Flowers & Decor"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Input
            id="vendor-amount-input"
            label={`Quoted Amount (${currency === 'INR' || !currency ? '₹ INR' : currency})`}
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={quotedAmount}
            onChange={(e) => setQuotedAmount(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Select
            id="vendor-status-select"
            label="Engagement Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as VendorStatus)}
            options={statusOptions}
            required
            disabled={isSubmitting}
          />
        </div>

        <Input
          id="vendor-email-input"
          label="Contact Email (Optional)"
          type="email"
          placeholder="contact@blossomandvine.com"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          disabled={isSubmitting}
        />

        <Input
          id="vendor-notes-input"
          label="Deliverables & Contract Notes (Optional)"
          placeholder="e.g. Includes bridal bouquet, 10 table centerpieces, and arch installation"
          value={deliverablesNotes}
          onChange={(e) => setDeliverablesNotes(e.target.value)}
          disabled={isSubmitting}
        />
      </form>
    </Modal>
  );
};
