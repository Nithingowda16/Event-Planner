import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Wallet,
  CheckSquare,
  Users2,
  Settings,
  Edit,
  Trash2,
} from 'lucide-react';
import type { EventEntity } from '@celebrateos/shared';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { BudgetView } from '../budget/BudgetView.js';
import { TimelineView } from '../timeline/TimelineView.js';
import { VendorsView } from '../vendors/VendorsView.js';
import { EditEventModal } from './EditEventModal.js';
import { api, ApiError } from '../../services/api.js';
import { useToast } from '../ui/ToastContext.js';
import './EventDetailsView.css';

export interface EventDetailsViewProps {
  event: EventEntity;
  onBack: () => void;
  onEventUpdated: (updatedEvent: EventEntity) => void;
  onEventDeleted: (eventId: string) => void;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
  event,
  onBack,
  onEventUpdated,
  onEventDeleted,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'budget' | 'timeline' | 'vendors' | 'overview'>('budget');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: event.currency,
    maximumFractionDigits: 0,
  }).format(event.totalBudget);

  const handleDeleteEvent = async () => {
    if (!window.confirm(`Are you sure you want to delete "${event.title}"? All associated budget items, tasks, and vendors will be removed.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.events.delete(event.id);
      showToast(`Deleted "${event.title}".`, 'info');
      onEventDeleted(event.id);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete event';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="celebrate-event-details">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={onBack}
          id="back-to-dashboard-btn"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Event Header Banner */}
      <section aria-label="Celebration Summary" className="celebrate-details-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', margin: 0 }}>{event.title}</h2>
            <Badge variant="purple" size="md">
              {event.eventType.toUpperCase()}
            </Badge>
            <Badge variant="neutral" size="sm">
              v{event.version}
            </Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Calendar size={15} aria-hidden="true" />
              <span>{formattedDate}</span>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <MapPin size={15} aria-hidden="true" />
              <span>{event.location}</span>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Users size={15} aria-hidden="true" />
              <span>{event.guestCount} Guests</span>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--accent-gold)' }}>
              <strong>{formattedBudget}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit size={15} />}
            onClick={() => setIsEditModalOpen(true)}
            id="edit-event-details-btn"
          >
            Edit Event
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 size={15} />}
            onClick={handleDeleteEvent}
            isLoading={isDeleting}
            id="delete-event-btn"
          >
            Delete
          </Button>
        </div>
      </section>

      {/* Tabs Navigation */}
      <nav aria-label="Event Workspace Tabs" className="celebrate-details-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className={`celebrate-details-tab-btn ${activeTab === 'budget' ? 'celebrate-details-tab-btn--active' : ''}`}
          id="tab-budget-btn"
        >
          <Wallet size={16} aria-hidden="true" />
          <span>Authoritative Budget</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`celebrate-details-tab-btn ${activeTab === 'timeline' ? 'celebrate-details-tab-btn--active' : ''}`}
          id="tab-timeline-btn"
        >
          <CheckSquare size={16} aria-hidden="true" />
          <span>Timeline & Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`celebrate-details-tab-btn ${activeTab === 'vendors' ? 'celebrate-details-tab-btn--active' : ''}`}
          id="tab-vendors-btn"
        >
          <Users2 size={16} aria-hidden="true" />
          <span>Vendors & Quotes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`celebrate-details-tab-btn ${activeTab === 'overview' ? 'celebrate-details-tab-btn--active' : ''}`}
          id="tab-overview-btn"
        >
          <Settings size={16} aria-hidden="true" />
          <span>Event Info</span>
        </button>
      </nav>

      {/* Tab Panels */}
      <div>
        {activeTab === 'budget' && (
          <BudgetView eventId={event.id} currency={event.currency} />
        )}

        {activeTab === 'timeline' && (
          <TimelineView eventId={event.id} />
        )}

        {activeTab === 'vendors' && (
          <VendorsView eventId={event.id} currency={event.currency} />
        )}

        {activeTab === 'overview' && (
          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <h3 style={{ margin: 0 }}>Celebration Specifications</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Created on {new Date(event.createdAt).toLocaleString()} (Database Version v{event.version})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <strong>Event Status:</strong> {event.status}
              </div>
              <div>
                <strong>Currency Precision:</strong> Multi-currency integer minor units math enforced
              </div>
              <div>
                <strong>Optimistic Version Guard:</strong> v{event.version}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={isEditModalOpen}
        event={event}
        onClose={() => setIsEditModalOpen(false)}
        onEventUpdated={(updated) => {
          onEventUpdated(updated);
          showToast('Celebration details updated successfully.', 'success');
        }}
      />
    </div>
  );
};
