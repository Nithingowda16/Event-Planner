import React from 'react';
import { Calendar, Wallet, CheckSquare, Sparkles } from 'lucide-react';
import { Card, CardBody } from '../ui/Card.js';
import './DashboardOverview.css';

export interface DashboardOverviewProps {
  totalEvents: number;
  totalBudgetFormatted: string;
  activeProposalsCount: number;
  completedTasksCount: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  totalEvents,
  totalBudgetFormatted,
  activeProposalsCount,
  completedTasksCount,
}) => {
  const stats = [
    {
      label: 'Total Celebrations',
      value: totalEvents,
      subtext: totalEvents === 0 ? 'No active events' : `${totalEvents} events in planning`,
      icon: <Calendar size={24} color="#f59e0b" aria-hidden="true" />,
      bg: 'var(--accent-gold-soft)',
    },
    {
      label: 'Authoritative Budget',
      value: totalBudgetFormatted,
      subtext: 'Server-calculated allocations',
      icon: <Wallet size={24} color="#34d399" aria-hidden="true" />,
      bg: 'var(--accent-emerald-soft)',
    },
    {
      label: 'AI Revision Proposals',
      value: activeProposalsCount,
      subtext: 'Pending user approval',
      icon: <Sparkles size={24} color="#a78bfa" aria-hidden="true" />,
      bg: 'var(--accent-purple-soft)',
    },
    {
      label: 'Actionable Tasks',
      value: completedTasksCount,
      subtext: 'Timeline milestones completed',
      icon: <CheckSquare size={24} color="#60a5fa" aria-hidden="true" />,
      bg: 'var(--accent-blue-soft)',
    },
  ];

  return (
    <section aria-label="Celebration Metrics Overview" className="celebrate-overview-grid">
      {stats.map((stat) => (
        <Card key={stat.label} elevation="glass">
          <CardBody className="celebrate-stat-card">
            <div className="celebrate-stat-icon" style={{ backgroundColor: stat.bg }}>
              {stat.icon}
            </div>
            <div className="celebrate-stat-content">
              <span className="celebrate-stat-label">{stat.label}</span>
              <span className="celebrate-stat-value">{stat.value}</span>
              <span className="celebrate-stat-subtext">{stat.subtext}</span>
            </div>
          </CardBody>
        </Card>
      ))}
    </section>
  );
};
