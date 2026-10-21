import React, { useEffect, useRef } from 'react';
import {
  Home,
  LayoutDashboard,
  Calendar,
  Wallet,
  CheckSquare,
  Plus,
  LogOut,
  PenSquare,
  ChevronLeft,
} from 'lucide-react';
import type { UserProfile } from '@celebrateos/shared';
import { SwakaryaLogo } from '../brand/SwakaryaLogo.js';
import { Button } from '../ui/Button.js';
import './Sidebar.css';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onToggle?: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onCreateEvent?: () => void;
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const getInitials = (user?: UserProfile | null): string => {
  if (!user || !user.fullName) return 'NR';
  const parts = user.fullName.trim().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (parts.length >= 2 && first && last && first[0] && last[0]) {
    return (first[0] + last[0]).toUpperCase();
  }
  return user.fullName.slice(0, 2).toUpperCase() || 'NR';
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpen,
  onToggle,
  activeTab,
  onSelectTab,
  onCreateEvent,
  user,
  onLogout,
}) => {
  const sidebarRef = useRef<HTMLElement>(null);

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
    } else if (onToggle) {
      onToggle();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'landing', label: 'Home', icon: Home },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Backdrop Overlay when Expanded */}
      <div
        className={`celebrate-sidebar-backdrop ${isOpen ? 'celebrate-sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Persistent Left Sidebar: Collapsed Icon Rail or Expanded Drawer */}
      <aside
        ref={sidebarRef}
        className={`celebrate-sidebar ${isOpen ? 'celebrate-sidebar--expanded' : 'celebrate-sidebar--collapsed'}`}
        aria-label="Sidebar Navigation"
      >
        {!isOpen ? (
          /* ==========================================================
             Collapsed Mini-Sidebar Rail (Exact Match to User Reference)
             ========================================================== */
          <div
            className="celebrate-sidebar-rail"
            onClick={handleOpen}
            role="region"
            aria-label="Collapsed Sidebar Rail — Tap to open"
          >
            {/* 1. Top Logo Button */}
            <button
              type="button"
              className="celebrate-sidebar-rail__logo-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
              aria-label="Open sidebar menu"
              title="Tap to open sidebar"
            >
              <SwakaryaLogo size={26} showWordmark={false} showTagline={false} />
            </button>

            {/* 2. New / Compose Event Icon */}
            {onCreateEvent && (
              <button
                type="button"
                className="celebrate-sidebar-rail__icon-btn celebrate-sidebar-rail__icon-btn--cta"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateEvent();
                }}
                aria-label="New Celebration"
                title="New Celebration"
              >
                <PenSquare size={20} />
              </button>
            )}

            {/* 3. Navigation Menu Icons */}
            <nav className="celebrate-sidebar-rail__nav" aria-label="Sidebar Quick Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`celebrate-sidebar-rail__icon-btn ${isActive ? 'celebrate-sidebar-rail__icon-btn--active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTab(item.id);
                    }}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon size={20} />
                    {isActive && <span className="celebrate-sidebar-rail__active-dot" />}
                  </button>
                );
              })}
            </nav>

            {/* Spacer */}
            <div className="celebrate-sidebar-rail__spacer" />

            {/* 4. Bottom User Profile Avatar: Purple "NR" Circle */}
            <div
              className="celebrate-sidebar-rail__footer"
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpen();
                }
              }}
              aria-label="User Profile — Tap to open sidebar"
              title={`${user?.fullName || 'Nithin Ram'} (Tap to expand)`}
            >
              <div className="celebrate-sidebar-rail__avatar">
                {getInitials(user)}
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================================
             Expanded Full Sidebar Drawer
             ========================================================== */
          <div className="celebrate-sidebar-expanded">
            {/* Header: Brand Wordmark + Collapse Button */}
            <div className="celebrate-sidebar__header">
              <div
                className="celebrate-sidebar__brand"
                onClick={() => handleNavClick('landing')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavClick('landing');
                  }
                }}
                aria-label="Swakarya Home"
              >
                <SwakaryaLogo size={30} showWordmark={true} showTagline={false} />
              </div>
              <button
                type="button"
                className="celebrate-sidebar__close-btn"
                onClick={onClose}
                aria-label="Close navigation sidebar"
                id="sidebar-close-btn"
                title="Collapse sidebar"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* Create Event CTA */}
            {onCreateEvent && (
              <div className="celebrate-sidebar__cta">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    onClose();
                    onCreateEvent();
                  }}
                  className="celebrate-sidebar__create-btn"
                  id="sidebar-create-event-btn"
                >
                  Create Event
                </Button>
              </div>
            )}

            {/* Navigation Menu with Full Labels */}
            <nav className="celebrate-sidebar__nav" aria-label="Sidebar Menu">
              <div className="celebrate-sidebar__section-label">Navigation Menu</div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`celebrate-sidebar__nav-item ${isActive ? 'celebrate-sidebar__nav-item--active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    id={`sidebar-nav-${item.id}`}
                  >
                    <Icon size={18} className="celebrate-sidebar__nav-icon" aria-hidden="true" />
                    <span className="celebrate-sidebar__nav-label">{item.label}</span>
                    {isActive && <span className="celebrate-sidebar__active-indicator" aria-hidden="true" />}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer with User Details & Theme/Logout */}
            <div className="celebrate-sidebar__footer">
              {user && (
                <div className="celebrate-sidebar__user">
                  <div className="celebrate-sidebar-rail__avatar" aria-hidden="true">
                    {getInitials(user)}
                  </div>
                  <div className="celebrate-sidebar__user-info">
                    <span className="celebrate-sidebar__user-name">{user.fullName}</span>
                    <span className="celebrate-sidebar__user-email">{user.email}</span>
                  </div>
                </div>
              )}

              {onLogout && (
                <div className="celebrate-sidebar__footer-actions">
                  <button
                    type="button"
                    className="celebrate-sidebar__logout-btn"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    aria-label="Sign out of account"
                    style={{ width: '100%' }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
