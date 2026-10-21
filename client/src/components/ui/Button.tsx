import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from './Spinner.js';
import type { ButtonVariant, ButtonSize } from '../../types/index.js';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      type = 'button',
      className = '',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading ? 'true' : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        className={`celebrate-btn celebrate-btn--${variant} celebrate-btn--${size} ${
          fullWidth ? 'celebrate-btn--full' : ''
        } ${className}`}
        {...rest}
      >
        {isLoading && (
          <Spinner
            size={size === 'lg' ? 'md' : 'sm'}
            label={loadingText || 'Loading...'}
            color={variant === 'primary' ? '#0a0e17' : 'currentColor'}
          />
        )}
        {!isLoading && leftIcon && (
          <span style={{ display: 'inline-flex' }} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span>{isLoading && loadingText ? loadingText : children}</span>
        {!isLoading && rightIcon && (
          <span style={{ display: 'inline-flex' }} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
