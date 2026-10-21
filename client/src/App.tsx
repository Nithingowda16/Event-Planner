import React, { useState, useEffect, useCallback } from 'react';
import type { EventEntity } from '@celebrateos/shared';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { EventDetailsView } from './components/events/EventDetailsView.js';
import { CreateEventModal } from './components/dashboard/CreateEventModal.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { ToastProvider, useToast } from './components/ui/ToastContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { api, ApiError } from './services/api.js';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();

  const [events, setEvents] = useState<EventEntity[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventEntity | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Diagnostic Server Health Check
  const checkHealth = useCallback(async () => {
    setBackendStatus('checking');
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch {
      setBackendStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Fetch real authenticated events from server
  const loadEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setEvents([]);
      return;
    }

    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const res = await api.events.list({ limit: 50 });
      setEvents(res.data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to retrieve your celebrations';
      setEventsError(msg);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventCreated = (newEvent: EventEntity) => {
    setEvents((prev) => [newEvent, ...prev]);
    showToast(`"${newEvent.title}" successfully created and saved to server.`, 'success');
  };

  const handleEventUpdated = (updatedEvent: EventEntity) => {
    setEvents((prev) => prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev)));
    if (selectedEvent?.id === updatedEvent.id) {
      setSelectedEvent(updatedEvent);
    }
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null);
    }
  };

  const handleCreateEventClick = () => {
    if (!isAuthenticated) {
      showToast('Please sign in or use Demo Planner access to create a celebration.', 'info');
      setIsAuthModalOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  return (
    <>
      {/* WCAG 2.1 AA Keyboard Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header Landmark */}
      <Header
        onCreateEvent={handleCreateEventClick}
        backendStatus={backendStatus}
        onCheckHealth={checkHealth}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'dashboard' || tab === 'events') {
            setSelectedEvent(null);
          }
        }}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={logout}
      />

      {/* Main Content Landmark */}
      <main id="main-content" role="main" style={{ flex: 1 }}>
        <div className="container">
          {selectedEvent ? (
            <EventDetailsView
              event={selectedEvent}
              onBack={() => setSelectedEvent(null)}
              onEventUpdated={handleEventUpdated}
              onEventDeleted={handleEventDeleted}
            />
          ) : (
            <DashboardView
              events={events}
              isLoading={isLoadingEvents}
              error={eventsError}
              onRetry={loadEvents}
              onCreateEvent={handleCreateEventClick}
              onSelectEvent={(event) => setSelectedEvent(event)}
            />
          )}
        </div>
      </main>

      {/* Footer Landmark */}
      <Footer />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
        onRequireAuth={() => {
          setIsCreateModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
