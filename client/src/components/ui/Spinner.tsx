import React from 'react';
import './Spinner.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
  className = '',
  color = 'currentColor',
}) => {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`celebrate-spinner-wrapper ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg
        className={`celebrate-spinner celebrate-spinner--${size}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeOpacity="0.25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
};
