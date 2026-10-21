import type { ReactNode } from 'react';
import type { EventType } from '@celebrateos/shared';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type BadgeVariant = 'gold' | 'emerald' | 'purple' | 'rose' | 'blue' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export type CardElevation = 'flat' | 'elevated' | 'glass';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  dismissToast: (id: string) => void;
}

export interface DashboardEventItem {
  id: string;
  title: string;
  eventType: EventType;
  eventDate: string;
  location?: string;
  totalBudget: number;
  currency: string;
  guestCount: number;
  status?: string;
  version: number;
  createdAt?: string;
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  accentColor?: string;
}
