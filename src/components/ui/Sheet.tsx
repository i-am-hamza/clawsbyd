'use client';

import { useEffect, useRef } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Bottom sheet on mobile, dialog on ≥768px (default true) */
  adaptive?: boolean;
}

export function Sheet({ open, onClose, title, children, adaptive = true }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  // Close on backdrop click
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      onCancel={onClose}
      className={`fixed inset-0 bg-transparent p-0 m-0 max-w-none max-h-none w-full h-full backdrop:bg-black/40 ${adaptive ? 'md:items-center md:justify-center' : ''}`}
      style={{ display: open ? 'flex' : undefined, alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        className={`w-full bg-[var(--ground)] border border-[var(--border)] ${adaptive ? 'rounded-t-[var(--radius-card)] md:rounded-[var(--radius-card)] md:max-w-lg' : 'rounded-t-[var(--radius-card)]'} p-6 max-h-[90dvh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-[var(--tap-target)] h-[var(--tap-target)] flex items-center justify-center rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)]"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
