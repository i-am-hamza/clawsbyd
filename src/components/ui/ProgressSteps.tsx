interface ProgressStepsProps {
  steps: string[];
  current: number;
}

export function ProgressSteps({ steps, current }: ProgressStepsProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 ${done ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--btn-primary-text)]' : active ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${active ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-muted)]'}`}>
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
