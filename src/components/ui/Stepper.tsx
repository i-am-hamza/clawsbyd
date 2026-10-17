'use client';

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}

export function Stepper({ value, onChange, min = 0, max = 99, label }: StepperProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-[var(--tap-target)] h-[var(--tap-target)] flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)] disabled:opacity-40 hover:border-[var(--accent)] transition-colors"
      >
        −
      </button>
      <output aria-live="polite" className="min-w-[2ch] text-center font-medium text-[var(--text)]">
        {value}
      </output>
      <button
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-[var(--tap-target)] h-[var(--tap-target)] flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)] disabled:opacity-40 hover:border-[var(--accent)] transition-colors"
      >
        +
      </button>
    </div>
  );
}
