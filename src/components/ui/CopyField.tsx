'use client';

import { useState } from 'react';

interface CopyFieldProps {
  value: string;
  label: string;
}

export function CopyField({ value, label }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <span className="flex-1 truncate text-sm text-[var(--text)] font-mono">{value}</span>
      <button
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="shrink-0 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] min-h-[var(--tap-target)] px-2 transition-colors"
      >
        {copied ? '✓' : 'Copy'}
      </button>
    </div>
  );
}
