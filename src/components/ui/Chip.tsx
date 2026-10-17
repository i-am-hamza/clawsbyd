'use client';

import { type ButtonHTMLAttributes } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  onRemove?: () => void;
}

export function Chip({ selected, onRemove, children, className = '', ...rest }: ChipProps) {
  return (
    <button
      role="checkbox"
      aria-checked={selected}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-[var(--radius-chip)] text-sm border transition-colors min-h-[var(--tap-target)] cursor-pointer select-none ${selected ? 'bg-[var(--accent)] text-[var(--btn-primary-text)] border-[var(--accent)]' : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]'} ${className}`}
      {...rest}
    >
      {children}
      {onRemove && selected && (
        <span
          aria-hidden="true"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 opacity-70 hover:opacity-100"
        >
          ×
        </span>
      )}
    </button>
  );
}

export function ChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-[var(--text)] mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
