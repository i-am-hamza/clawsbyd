import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      {icon && <div className="text-4xl text-[var(--text-muted)] mb-2">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] max-w-sm">{description}</p>}
      {action && (
        <Button variant="secondary" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
