import React, { type InputHTMLAttributes, type ReactNode, useId } from 'react';
import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: customId,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      required,
      className = '',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const ariaDescribedBy = error
      ? errorId
      : helperText
      ? helperId
      : undefined;

    return (
      <div className={`celebrate-input-group ${className}`}>
        {label && (
          <label htmlFor={inputId} className="celebrate-input-label">
            <span>{label}</span>
            {required && (
              <span className="celebrate-input-required" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="celebrate-input-wrapper">
          {leftIcon && (
            <span className="celebrate-input-icon-left" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={ariaDescribedBy}
            className={`celebrate-input-control ${
              leftIcon ? 'celebrate-input-control--has-left-icon' : ''
            } ${rightIcon ? 'celebrate-input-control--has-right-icon' : ''} ${
              error ? 'celebrate-input-control--error' : ''
            }`}
            {...rest}
          />

          {rightIcon && (
            <span className="celebrate-input-icon-right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <span id={errorId} className="celebrate-input-error" role="alert">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="celebrate-input-helper">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
