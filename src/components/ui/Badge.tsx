type BadgeVariant = 'default' | 'accent' | 'muted' | 'success' | 'warning' | 'error';

const STYLES: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]',
  accent: 'bg-[var(--accent)] text-[var(--btn-primary-text)]',
  muted: 'bg-[var(--surface)] text-[var(--text-muted)]',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-700',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-chip)] text-xs font-medium ${STYLES[variant]} ${className}`}>
      {children}
    </span>
  );
}
