import React, { type ReactNode } from 'react';
import type { BadgeVariant, BadgeSize } from '../../types/index.js';
import './Badge.css';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  withDot?: boolean;
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  withDot = false,
  className = '',
  id,
}) => {
  return (
    <span
      id={id}
      className={`celebrate-badge celebrate-badge--${variant} celebrate-badge--${size} ${className}`}
    >
      {withDot && <span className="celebrate-badge__dot" aria-hidden="true" />}
      {icon && <span style={{ display: 'inline-flex' }} aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
