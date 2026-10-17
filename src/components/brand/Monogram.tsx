/**
 * Monogram — "D" inside an almond nail silhouette.
 * Reuses the almond nail path from nail-svg.ts (medium length, W=24, H=48).
 * Used as admin header icon, favicon base, and brand mark.
 */

import { nailPath } from '@/lib/nail-svg';

interface MonogramProps {
  size?: number;
  fillColour?: string;
  textColour?: string;
  className?: string;
}

export function Monogram({
  size = 32,
  fillColour = 'var(--accent)',
  textColour = 'var(--btn-primary-text, #ffffff)',
  className = '',
}: MonogramProps) {
  const d = nailPath('almond', 'medium');
  // Scale: nail is 24×48 native → scale to `size` by height
  const scale = size / 48;
  const w = Math.round(24 * scale);

  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 24 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Claws by D monogram"
      className={className}
    >
      <path d={d} fill={fillColour} />
      <text
        x="12"
        y="34"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColour}
        fontFamily="var(--font-display, Georgia, serif)"
        fontSize="18"
        fontWeight="700"
        letterSpacing="-0.5"
      >
        D
      </text>
    </svg>
  );
}
