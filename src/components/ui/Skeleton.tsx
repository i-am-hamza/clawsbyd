interface SkeletonProps {
  className?: string;
  /** Reserved height prevents CLS. Pass exact height or use className. */
  height?: number | string;
}

export function Skeleton({ className = '', height }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-[var(--border)] rounded-[var(--radius-input)] ${className}`}
      style={{ height }}
    />
  );
}
