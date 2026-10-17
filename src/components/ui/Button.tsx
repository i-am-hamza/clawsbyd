'use client';

import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[var(--tap-target)]',
  md: 'px-5 py-2.5 text-base min-h-[var(--tap-target)]',
  lg: 'px-6 py-3 text-lg min-h-[var(--tap-target)]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-pill)] transition-opacity select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  const variantStyle =
    variant === 'primary'
      ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 active:opacity-80'
      : variant === 'secondary'
      ? 'border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-border)] hover:bg-opacity-10 active:opacity-80'
      : 'text-[var(--text)] hover:opacity-70 active:opacity-50';

  return (
    <button
      disabled={disabled ?? loading}
      aria-busy={loading}
      className={`${base} ${variantStyle} ${sizeStyles[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          style={{
            width: '1em',
            height: '1em',
            borderRadius: '50%',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            display: 'inline-block',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
}
