import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar, getInitials } from '../src/components/layout/Sidebar.js';
import { Header } from '../src/components/layout/Header.js';
import { ThemeProvider } from '../src/context/ThemeContext.js';

describe('Left Collapsible Sidebar & Mini-Rail Navigation', () => {
  it('correctly calculates user initials with fallback to NR', () => {
    expect(getInitials(null)).toBe('NR');
    expect(getInitials({ id: '1', email: 'test@swakarya.com', fullName: 'Nithin Ram', role: 'planner', createdAt: '' })).toBe('NR');
    expect(getInitials({ id: '2', email: 'test@swakarya.com', fullName: 'Bhargav Ram', role: 'planner', createdAt: '' })).toBe('BR');
  });

  it('renders collapsed mini-rail with icons and purple NR avatar when isOpen is false', () => {
    const handleClose = vi.fn();
    const handleOpen = vi.fn();
    const handleSelectTab = vi.fn();
    const handleCreateEvent = vi.fn();

    render(
      <ThemeProvider>
        <Sidebar
          isOpen={false}
          onClose={handleClose}
          onOpen={handleOpen}
          activeTab="dashboard"
          onSelectTab={handleSelectTab}
          onCreateEvent={handleCreateEvent}
        />
      </ThemeProvider>
    );

    // Collapsed rail region is present
    const rail = screen.getByLabelText(/collapsed sidebar rail/i);
    expect(rail).toBeDefined();

    // Top logo button
    const logoBtn = screen.getByRole('button', { name: /open sidebar menu/i });
    expect(logoBtn).toBeDefined();

    // Compose / New celebration icon
    const composeBtn = screen.getByRole('button', { name: /new celebration/i });
    expect(composeBtn).toBeDefined();

    // Navigation icons
    expect(screen.getByRole('button', { name: /^dashboard$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^events$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^budget$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^tasks$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^home$/i })).toBeDefined();

    // Purple circular avatar with NR
    expect(screen.getByText('NR')).toBeDefined();

    // Tapping the rail or logo opens the sidebar
    fireEvent.click(logoBtn);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it('renders expanded sidebar drawer with all menu labels and brand when isOpen is true', () => {
    const handleClose = vi.fn();
    const handleOpen = vi.fn();
    const handleSelectTab = vi.fn();
    const handleCreateEvent = vi.fn();
    const handleLogout = vi.fn();

    render(
      <ThemeProvider>
        <Sidebar
          isOpen={true}
          onClose={handleClose}
          onOpen={handleOpen}
          activeTab="dashboard"
          onSelectTab={handleSelectTab}
          onCreateEvent={handleCreateEvent}
          user={{
            id: 'u1',
            email: 'bhargav@example.com',
            fullName: 'Bhargav Ram',
            role: 'planner',
            createdAt: new Date().toISOString(),
          }}
          onLogout={handleLogout}
        />
      </ThemeProvider>
    );

    // Sidebar navigation landmark
    const sidebar = screen.getByLabelText(/sidebar navigation/i);
    expect(sidebar).toBeDefined();

    // Navigation Menu section
    expect(screen.getByText(/Navigation Menu/i)).toBeDefined();

    // Menu buttons with labels
    expect(screen.getByRole('button', { name: /^home$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^dashboard$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^events$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^budget$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^tasks$/i })).toBeDefined();

    // Create event CTA button
    const createBtn = screen.getByRole('button', { name: /^create event$/i });
    expect(createBtn).toBeDefined();
    fireEvent.click(createBtn);
    expect(handleCreateEvent).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // User details & Logout
    expect(screen.getByText('Bhargav Ram')).toBeDefined();
    expect(screen.getByText('bhargav@example.com')).toBeDefined();
    const logoutBtn = screen.getByRole('button', { name: /sign out/i });
    expect(logoutBtn).toBeDefined();
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);

    // Close button
    const closeBtn = screen.getByRole('button', { name: /close navigation sidebar/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(3);
  });

  it('selects tab and closes sidebar when a nav item is clicked in expanded state', () => {
    const handleClose = vi.fn();
    const handleSelectTab = vi.fn();

    render(
      <ThemeProvider>
        <Sidebar
          isOpen={true}
          onClose={handleClose}
          activeTab="dashboard"
          onSelectTab={handleSelectTab}
        />
      </ThemeProvider>
    );

    const eventsBtn = screen.getByRole('button', { name: /^events$/i });
    fireEvent.click(eventsBtn);

    expect(handleSelectTab).toHaveBeenCalledWith('events');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes sidebar on Escape key press', () => {
    const handleClose = vi.fn();
    const handleSelectTab = vi.fn();

    render(
      <ThemeProvider>
        <Sidebar
          isOpen={true}
          onClose={handleClose}
          activeTab="dashboard"
          onSelectTab={handleSelectTab}
        />
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('taps the collapsed sidebar rail and triggers onOpen', () => {
    const handleOpen = vi.fn();
    const handleClose = vi.fn();

    render(
      <ThemeProvider>
        <Sidebar
          isOpen={false}
          onClose={handleClose}
          onOpen={handleOpen}
          activeTab="dashboard"
          onSelectTab={vi.fn()}
        />
      </ThemeProvider>
    );

    const rail = screen.getByLabelText(/collapsed sidebar rail/i);
    fireEvent.click(rail);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });
});
