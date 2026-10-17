/**
 * Wordmark — "Claws by D" in the direction's display font.
 * Weight shifts with --mood (400 dainty → 900 glam for A; 200→800 for B).
 */
interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  italic?: boolean;
}

const SIZES = {
  sm: '1rem',
  md: '1.5rem',
  lg: '2.25rem',
  xl: '3.5rem',
};

export function Wordmark({ size = 'md', className = '', italic = false }: WordmarkProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: SIZES[size],
        fontStyle: italic ? 'italic' : 'normal',
        fontVariationSettings: `"wght" var(--display-weight, 400)`,
        lineHeight: 1,
        letterSpacing: '-0.01em',
        color: 'var(--text)',
      }}
    >
      Claws by D
    </span>
  );
}
