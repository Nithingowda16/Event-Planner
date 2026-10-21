import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { CreateEventModal } from './components/dashboard/CreateEventModal.js';
import { ToastProvider, useToast } from './components/ui/ToastContext.js';
import type { DashboardEventItem } from './types/index.js';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<DashboardEventItem[]>([]);
  const [isLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
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

  const handleCreateEvent = (newEventData: Omit<DashboardEventItem, 'id' | 'version'>) => {
    const newEvent: DashboardEventItem = {
      ...newEventData,
      id: `evt-${Date.now()}`,
      version: 0,
      createdAt: new Date().toISOString(),
    };

    setEvents((prev) => [newEvent, ...prev]);
    showToast(`"${newEvent.title}" added to local preview. Full server persistence will connect in Milestone 6.`, 'success');
  };

  const handleSelectEvent = (event: DashboardEventItem) => {
    showToast(`Selected "${event.title}". Event details and AI proposals will open in Milestone 6 & 7.`, 'info');
  };

  return (
    <>
      {/* WCAG 2.1 AA Keyboard Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header Landmark */}
      <Header
        onCreateEvent={() => setIsCreateModalOpen(true)}
        backendStatus={backendStatus}
        onCheckHealth={checkHealth}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Landmark */}
      <main id="main-content" role="main" style={{ flex: 1 }}>
        <div className="container">
          <DashboardView
            events={events}
            isLoading={isLoading}
            error={error}
            onRetry={checkHealth}
            onCreateEvent={() => setIsCreateModalOpen(true)}
            onSelectEvent={handleSelectEvent}
          />
        </div>
      </main>

      {/* Footer Landmark */}
      <Footer />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
