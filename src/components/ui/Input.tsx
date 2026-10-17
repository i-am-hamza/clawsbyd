'use client';

import { type InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id: propId, className = '', ...rest }: InputProps) {
  const generatedId = useId();
  const id = propId ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-[var(--text)]">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
        className={`w-full px-3 py-2.5 rounded-[var(--radius-input)] border bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${error ? 'border-red-500' : 'border-[var(--border)]'} ${className}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--text-muted)]">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
