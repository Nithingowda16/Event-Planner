import React, { type SelectHTMLAttributes, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id: customId,
      label,
      helperText,
      error,
      options = [],
      children,
      required,
      className = '',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = customId || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const ariaDescribedBy = error
      ? errorId
      : helperText
      ? helperId
      : undefined;

    return (
      <div className={`celebrate-select-group ${className}`}>
        {label && (
          <label htmlFor={selectId} className="celebrate-select-label">
            <span>{label}</span>
            {required && (
              <span className="celebrate-select-required" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="celebrate-select-wrapper">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={ariaDescribedBy}
            className={`celebrate-select-control ${
              error ? 'celebrate-select-control--error' : ''
            }`}
            {...rest}
          >
            {options.length > 0
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <span className="celebrate-select-chevron" aria-hidden="true">
            <ChevronDown size={18} />
          </span>
        </div>

        {error && (
          <span id={errorId} className="celebrate-select-error" role="alert">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="celebrate-select-helper">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
