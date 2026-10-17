interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'li';
}

export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] overflow-hidden ${className}`}>
      {children}
    </Tag>
  );
}
