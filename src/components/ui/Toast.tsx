'use client';

import { useEffect } from 'react';

type ToastVariant = 'info' | 'success' | 'error';

const ICONS: Record<ToastVariant, string> = {
  info: 'ℹ',
  success: '✓',
  error: '✕',
};

const COLOURS: Record<ToastVariant, string> = {
  info: 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]',
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-800',
};

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, variant = 'info', onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-card)] border shadow-lg text-sm ${COLOURS[variant]}`}
    >
      <span aria-hidden="true">{ICONS[variant]}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-current opacity-50 hover:opacity-100 min-w-[var(--tap-target)] min-h-[var(--tap-target)] flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
}
