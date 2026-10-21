import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastItem } from '../../types/index.js';
import './Toast.css';

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { id, type, message, durationMs = 4000 } = toast;

  useEffect(() => {
    if (durationMs <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [id, durationMs, onDismiss]);

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle size={18} aria-hidden="true" />;
      case 'error':
        return <AlertCircle size={18} aria-hidden="true" />;
      case 'info':
      default:
        return <Info size={18} aria-hidden="true" />;
    }
  };

  const ariaRole = type === 'error' ? 'alert' : 'status';

  return (
    <div
      role={ariaRole}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`celebrate-toast celebrate-toast--${type}`}
      id={`toast-${id}`}
    >
      <span className="celebrate-toast__icon">{renderIcon()}</span>
      <div className="celebrate-toast__content">{message}</div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="celebrate-toast__close"
        aria-label="Dismiss notification"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
};
