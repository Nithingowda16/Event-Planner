import React, { useState, useMemo } from 'react';
import { Search, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { DashboardOverview } from './DashboardOverview.js';
import { EmptyState } from './EmptyState.js';
import { EventCard } from './EventCard.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { Button } from '../ui/Button.js';
import { Spinner } from '../ui/Spinner.js';
import type { EventEntity } from '@celebrateos/shared';
import './DashboardView.css';

export interface DashboardViewProps {
  events: EventEntity[];
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void;
  onCreateEvent: () => void;
  onSelectEvent: (event: EventEntity) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  events,
  isLoading,
  error,
  onRetry,
  onCreateEvent,
  onSelectEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Filter events based on search and type
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || ev.eventType === filterType;
      return matchesSearch && matchesType;
    });
  }, [events, searchQuery, filterType]);

  // Aggregate metrics
  const totalBudgetUSD = useMemo(() => {
    const sum = events.reduce((acc, ev) => acc + (ev.currency === 'USD' ? ev.totalBudget : 0), 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(sum);
  }, [events]);

  const filterOptions = [
    { value: 'all', label: 'All Celebration Types' },
    { value: 'wedding', label: 'Weddings' },
    { value: 'birthday', label: 'Birthdays' },
    { value: 'anniversary', label: 'Anniversaries' },
    { value: 'community', label: 'Community Festivals' },
    { value: 'corporate', label: 'Corporate Events' },
    { value: 'baby_shower', label: 'Baby Showers' },
    { value: 'graduation', label: 'Graduations' },
  ];

  return (
    <div className="celebrate-dashboard">
      {/* Page Header */}
      <div className="celebrate-dashboard__header">
        <div className="celebrate-dashboard__title-group">
          <h2 className="celebrate-dashboard__title">Celebration Dashboard</h2>
          <p className="celebrate-dashboard__subtitle">
            Plan weddings, birthdays, and community gatherings with generative AI and deterministic budgeting.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={18} />}
          onClick={onCreateEvent}
          id="dashboard-create-event-btn"
        >
          New Celebration
        </Button>
      </div>

      {/* Metrics Overview */}
      <DashboardOverview
        totalEvents={events.length}
        totalBudgetFormatted={totalBudgetUSD}
        activeProposalsCount={0}
        completedTasksCount={0}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="celebrate-loading-state" role="status" aria-live="polite">
          <Spinner size="lg" label="Loading celebrations..." color="#f59e0b" />
          <p>Retrieving your celebrations securely...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="celebrate-error-state" role="alert">
          <AlertCircle size={32} aria-hidden="true" />
          <div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0, color: 'inherit' }}>
              Failed to load celebrations
            </h3>
            <p style={{ margin: 'var(--space-1) 0 0 0', color: 'inherit', opacity: 0.9 }}>
              {error}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={16} />}
            onClick={onRetry}
            id="retry-fetch-btn"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Content State: Empty vs Populated */}
      {!isLoading && !error && events.length === 0 && (
        <EmptyState onCreateEvent={onCreateEvent} />
      )}

      {!isLoading && !error && events.length > 0 && (
        <>
          {/* Toolbar: Search & Filter */}
          <section aria-label="Celebration Search and Filters" className="celebrate-toolbar">
            <div className="celebrate-toolbar__search">
              <Input
                id="search-events-input"
                aria-label="Search celebrations by title or location"
                placeholder="Search celebrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>

            <div className="celebrate-toolbar__filters">
              <Select
                id="filter-type-select"
                aria-label="Filter celebrations by type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={filterOptions}
              />
            </div>
          </section>

          {/* Grid of Event Cards */}
          {filteredEvents.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-10)',
                color: 'var(--text-secondary)',
              }}
            >
              <p>No celebrations match the search or filter criteria.</p>
            </div>
          ) : (
            <div className="celebrate-event-grid">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} onSelect={onSelectEvent} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
