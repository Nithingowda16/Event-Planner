import React from 'react';
import { Sparkles, Plus, Calendar, LayoutDashboard, Wallet, CheckSquare, User, LogOut } from 'lucide-react';
import type { UserProfile } from '@celebrateos/shared';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import './Header.css';

export interface HeaderProps {
  onCreateEvent: () => void;
  backendStatus: 'checking' | 'connected' | 'disconnected';
  onCheckHealth: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  user?: UserProfile | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onCreateEvent,
  backendStatus,
  onCheckHealth,
  activeTab = 'dashboard',
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header role="banner" className="celebrate-header">
      <div className="container">
        <div className="celebrate-header__inner">
          {/* Brand */}
          <div className="celebrate-brand">
            <div className="celebrate-brand__logo" aria-hidden="true">
              <Sparkles size={22} />
            </div>
            <div className="celebrate-brand__text">
              <h1 className="celebrate-brand__title">CelebrateOS</h1>
              <p className="celebrate-brand__tagline">AI-Powered Celebration & Event Planner</p>
            </div>
          </div>

          {/* Navigation Landmark */}
          <nav aria-label="Main Navigation" className="celebrate-nav">
            <button
              type="button"
              onClick={() => onSelectTab?.('dashboard')}
              className={`celebrate-nav__link ${activeTab === 'dashboard' ? 'celebrate-nav__link--active' : ''}`}
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab?.('events')}
              className={`celebrate-nav__link ${activeTab === 'events' ? 'celebrate-nav__link--active' : ''}`}
            >
              <Calendar size={16} aria-hidden="true" />
              <span>Events</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab?.('budget')}
              className={`celebrate-nav__link ${activeTab === 'budget' ? 'celebrate-nav__link--active' : ''}`}
            >
              <Wallet size={16} aria-hidden="true" />
              <span>Budget</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab?.('tasks')}
              className={`celebrate-nav__link ${activeTab === 'tasks' ? 'celebrate-nav__link--active' : ''}`}
            >
              <CheckSquare size={16} aria-hidden="true" />
              <span>Tasks</span>
            </button>
          </nav>

          {/* Actions & Backend Diagnostic Indicator */}
          <div className="celebrate-header__actions">
            <button
              type="button"
              onClick={onCheckHealth}
              title="Click to check backend connectivity"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label={`Backend status: ${backendStatus}. Click to test connection.`}
            >
              <Badge
                variant={
                  backendStatus === 'connected'
                    ? 'emerald'
                    : backendStatus === 'checking'
                    ? 'gold'
                    : 'rose'
                }
                size="sm"
                withDot
              >
                {backendStatus === 'connected'
                  ? 'API Online'
                  : backendStatus === 'checking'
                  ? 'Connecting...'
                  : 'API Offline'}
              </Badge>
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  {user.fullName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<LogOut size={14} />}
                  onClick={onLogout}
                  id="header-logout-btn"
                  title="Sign Out"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<User size={14} />}
                onClick={onOpenAuth}
                id="header-signin-btn"
              >
                Sign In
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={18} />}
              onClick={onCreateEvent}
              id="create-event-header-btn"
            >
              Create Event
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
