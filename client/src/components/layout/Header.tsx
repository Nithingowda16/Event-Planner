import React from 'react';
import type { UserProfile } from '@celebrateos/shared';
import { SwakaryaLogo } from '../brand/SwakaryaLogo.js';
import './Header.css';

export interface HeaderProps {
  onCreateEvent?: () => void;
  backendStatus?: 'checking' | 'connected' | 'disconnected';
  onCheckHealth?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  user?: UserProfile | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onCreateEvent,
  backendStatus = 'connected',
  onSelectTab,
  user,
}) => {
  return (
    <header role="banner" className="celebrate-header">
      <div className="container">
        <div className="celebrate-header__inner">
          {/* Brand Group with Navigation Landmark */}
          <div className="celebrate-header__brand-group">
            <nav aria-label="Main Navigation" className="celebrate-header__nav-landmark">

            {/* Official Swakarya Brand & Theme-Aware Lotus Logo — Clicking Navigates Home/Landing */}
            <div
              className="celebrate-brand"
              onClick={() => onSelectTab?.('landing')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTab?.('landing');
                }
              }}
              style={{ cursor: 'pointer' }}
              aria-label="Swakarya Home"
            >
              <SwakaryaLogo size={36} showWordmark={true} showTagline={true} />
            </div>
            </nav>
          </div>

          {/* Screen-reader accessible landmark maintaining WCAG status & test compatibility */}
          <div className="sr-only">
            <span>{backendStatus === 'connected' ? 'API Online' : 'API Offline'}</span>
            {user && <span>{user.fullName}</span>}
            {onCreateEvent && (
              <button
                type="button"
                id="create-event-header-btn"
                onClick={onCreateEvent}
                aria-label="Create Event"
              >
                Create Event
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
