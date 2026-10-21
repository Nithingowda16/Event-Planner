import React from 'react';
import { Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import type { DashboardEventItem, BadgeVariant } from '../../types/index.js';
import './EventCard.css';

export interface EventCardProps {
  event: DashboardEventItem;
  onSelect?: (event: DashboardEventItem) => void;
}

const eventTypeBadgeMap: Record<string, { label: string; variant: BadgeVariant }> = {
  wedding: { label: 'Wedding', variant: 'purple' },
  birthday: { label: 'Birthday', variant: 'gold' },
  anniversary: { label: 'Anniversary', variant: 'rose' },
  community: { label: 'Community', variant: 'emerald' },
  corporate: { label: 'Corporate', variant: 'blue' },
  baby_shower: { label: 'Baby Shower', variant: 'rose' },
  graduation: { label: 'Graduation', variant: 'gold' },
  other: { label: 'Celebration', variant: 'neutral' },
};

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  const badgeInfo = eventTypeBadgeMap[event.eventType] || {
    label: event.eventType,
    variant: 'neutral' as BadgeVariant,
  };

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: event.currency,
    maximumFractionDigits: 0,
  }).format(event.totalBudget);

  return (
    <Card elevation="elevated" interactive className="celebrate-event-card">
      <CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1 }}>
          <CardTitle as="h3">{event.title}</CardTitle>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
            <Badge variant={badgeInfo.variant} size="sm">
              {badgeInfo.label}
            </Badge>
            <Badge variant="neutral" size="sm">
              v{event.version}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="celebrate-event-meta">
          <div className="celebrate-meta-item">
            <Calendar size={16} aria-hidden="true" />
            <span>Date: <strong>{formattedDate}</strong></span>
          </div>

          <div className="celebrate-meta-item">
            <Users size={16} aria-hidden="true" />
            <span>Guests: <strong>{event.guestCount} attendees</strong></span>
          </div>

          {event.location && (
            <div className="celebrate-meta-item">
              <MapPin size={16} aria-hidden="true" />
              <span>Location: <strong>{event.location}</strong></span>
            </div>
          )}
        </div>

        <div className="celebrate-event-budget-badge">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
            Total Budget:
          </span>
          <span className="celebrate-event-budget-amount">{formattedBudget}</span>
        </div>
      </CardBody>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          rightIcon={<ArrowRight size={16} />}
          onClick={() => onSelect?.(event)}
          id={`view-event-${event.id}-btn`}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
