/**
 * nail-svg.ts — pure SVG path generator for nail shapes.
 * nailPath(shape, length) → SVG path d string.
 * Coordinate system: width=24, y=0 at tip (top), y=H at cuticle (bottom).
 * All paths start at bottom-left and trace clockwise.
 */

export type NailShape =
  | 'square'
  | 'squoval'
  | 'round'
  | 'oval'
  | 'almond'
  | 'coffin'
  | 'stiletto';

export type NailLength = 'short' | 'medium' | 'long' | 'xl';

export const NAIL_SHAPES: NailShape[] = [
  'square', 'squoval', 'round', 'oval', 'almond', 'coffin', 'stiletto',
];
export const NAIL_LENGTHS: NailLength[] = ['short', 'medium', 'long', 'xl'];

/** Width of the nail plate (constant across all shapes) */
export const NAIL_WIDTH = 24;

/** Total heights by length */
const HEIGHTS: Record<NailLength, number> = {
  short:  36,
  medium: 48,
  long:   60,
  xl:     74,
};

/**
 * Returns the viewBox height for a given length, so components can set
 * viewBox="0 0 24 H" correctly.
 */
export function nailHeight(length: NailLength): number {
  return HEIGHTS[length];
}

/**
 * Returns the SVG path `d` attribute string for the given shape + length.
 * The path is a single closed shape (ends with Z).
 * Coordinate origin: top-left of the viewBox (0, 0 = tip top-left).
 *
 * Cuticle convention: a subtle convex curve at the very bottom, ≈ +2 px
 * below y=H, keeps the nail silhouette natural. Callers should clip to
 * the viewBox or use overflow="visible".
 */
export function nailPath(shape: NailShape, length: NailLength): string {
  const H = HEIGHTS[length];
  return BUILDERS[shape](H);
}

/* ── Path builders ─────────────────────────────────────────────── */

/**
 * square: straight sides, flat top with 2 px radius corners,
 * gentle cuticle arc at base.
 */
function square(H: number): string {
  return [
    `M 2 ${H}`,
    `Q 0 ${H} 0 ${H - 2}`,
    `L 0 2`,
    `Q 0 0 2 0`,
    `L 22 0`,
    `Q 24 0 24 2`,
    `L 24 ${H - 2}`,
    `Q 24 ${H} 22 ${H}`,
    `Q 12 ${H + 2} 2 ${H}`,
    `Z`,
  ].join(' ');
}

/**
 * squoval: square base with distinctly rounded top corners (r≈6).
 */
function squoval(H: number): string {
  return [
    `M 2 ${H}`,
    `Q 0 ${H} 0 ${H - 2}`,
    `L 0 7`,
    `Q 0 0 7 0`,
    `L 17 0`,
    `Q 24 0 24 7`,
    `L 24 ${H - 2}`,
    `Q 24 ${H} 22 ${H}`,
    `Q 12 ${H + 2} 2 ${H}`,
    `Z`,
  ].join(' ');
}

/**
 * round: a semicircular tip; sides are straight below the arc.
 * Arc radius = 12 (half of nail width), centred at (12, 12).
 */
function round(H: number): string {
  return [
    `M 2 ${H}`,
    `Q 0 ${H} 0 ${H - 2}`,
    `L 0 12`,
    `C 0 0 24 0 24 12`,
    `L 24 ${H - 2}`,
    `Q 24 ${H} 22 ${H}`,
    `Q 12 ${H + 2} 2 ${H}`,
    `Z`,
  ].join(' ');
}

/**
 * oval: elongated oval tip; sides taper slightly inward as they rise.
 * Arc top centred at (12, 4).
 */
function oval(H: number): string {
  return [
    `M 2 ${H}`,
    `Q 0 ${H} 0 ${H - 2}`,
    `L 2 16`,
    `C 2 2 22 2 22 16`,
    `L 24 ${H - 2}`,
    `Q 24 ${H} 22 ${H}`,
    `Q 12 ${H + 2} 2 ${H}`,
    `Z`,
  ].join(' ');
}

/**
 * almond: sides taper significantly toward a soft rounded point at the tip.
 */
function almond(H: number): string {
  return [
    `M 2 ${H}`,
    `Q 0 ${H} 0 ${H - 2}`,
    `L 3 20`,
    `C 3 8 12 0 12 0`,
    `C 12 0 21 8 21 20`,
    `L 24 ${H - 2}`,
    `Q 24 ${H} 22 ${H}`,
    `Q 12 ${H + 2} 2 ${H}`,
    `Z`,
  ].join(' ');
}

/**
 * coffin (ballerina): sides taper then flatten into a squared-off tip
 * that is narrower than the base (~58% of width, centred).
 * Flat top width = 14, starts at x=5, ends at x=19.
 */
function coffin(H: number): string {
  return [
    `M 2 ${H}`,
    `Q 0 ${H} 0 ${H - 2}`,
    `C 0 ${H - 10} 5 14 5 10`,
    `L 5 0`,
    `L 19 0`,
    `L 19 10`,
    `C 19 14 24 ${H - 10} 24 ${H - 2}`,
    `Q 24 ${H} 22 ${H}`,
    `Q 12 ${H + 2} 2 ${H}`,
    `Z`,
  ].join(' ');
}

/**
 * stiletto: extreme taper from full width to a sharp central point.
 */
function stiletto(H: number): string {
  return [
    `M 2 ${H}`,
    `Q 0 ${H} 0 ${H - 2}`,
    `C 0 ${H - 14} 12 0 12 0`,
    `C 12 0 24 ${H - 14} 24 ${H - 2}`,
    `Q 24 ${H} 22 ${H}`,
    `Q 12 ${H + 2} 2 ${H}`,
    `Z`,
  ].join(' ');
}

const BUILDERS: Record<NailShape, (H: number) => string> = {
  square,
  squoval,
  round,
  oval,
  almond,
  coffin,
  stiletto,
};

/* ── Chrome / cat-eye finish helpers ───────────────────────────── */

/** Returns an SVG `<defs>` block with chrome and cat-eye gradient definitions. */
export function nailFinishDefs(idPrefix: string): string {
  return `<defs>
  <linearGradient id="${idPrefix}-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#EEF0F3"/>
    <stop offset="40%" stop-color="#C8CDD6"/>
    <stop offset="100%" stop-color="#A3A9B3"/>
  </linearGradient>
  <linearGradient id="${idPrefix}-chrome-dark" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#F2F3F5"/>
    <stop offset="45%" stop-color="#A7ADB8"/>
    <stop offset="100%" stop-color="#E4E6EA"/>
  </linearGradient>
  <linearGradient id="${idPrefix}-cat-eye" x1="50%" y1="0%" x2="50%" y2="100%">
    <stop offset="0%" stop-color="#9B8FA8" stop-opacity="0.2"/>
    <stop offset="45%" stop-color="#C8B8D5" stop-opacity="0.9"/>
    <stop offset="55%" stop-color="#E0D0EC" stop-opacity="1"/>
    <stop offset="100%" stop-color="#9B8FA8" stop-opacity="0.2"/>
  </linearGradient>
</defs>`;
}

/* ── NailPreview component ─────────────────────────────────────── */

export type NailFinish = 'solid' | 'chrome' | 'cat-eye';

export interface NailPreviewProps {
  shape: NailShape;
  length: NailLength;
  /** Up to 3 fill colours; wraps if fewer than 5 */
  colours: string[];
  finish?: NailFinish;
  /** Gap between nails in px */
  gap?: number;
  /** className for the outer <svg> */
  className?: string;
}

/**
 * NailPreview — five nails side by side.
 * Pure function → string (usable server-side). The React component below
 * renders this as dangerouslySetInnerHTML.
 */
export function renderNailPreviewSVG(props: NailPreviewProps): string {
  const {
    shape,
    length,
    colours,
    finish = 'solid',
    gap = 4,
  } = props;

  const W = NAIL_WIDTH;
  const H = nailHeight(length);
  const COUNT = 5;
  const totalW = COUNT * W + (COUNT - 1) * gap;
  const idPfx = `np-${shape}-${length}`;

  const fills = colours.length > 0 ? colours : ['#F2C4CE'];

  const nails = Array.from({ length: COUNT }, (_, i) => {
    const x = i * (W + gap);
    const colour = fills[i % fills.length] ?? fills[0];
    let fillAttr: string;
    if (finish === 'chrome') {
      fillAttr = `url(#${idPfx}-chrome)`;
    } else if (finish === 'cat-eye') {
      fillAttr = `url(#${idPfx}-cat-eye)`;
    } else {
      fillAttr = colour ?? '#F2C4CE';
    }
    const d = nailPath(shape, length);
    return `<path d="${d}" fill="${fillAttr}" transform="translate(${x},0)"/>`;
  }).join('\n  ');

  const defs = (finish !== 'solid') ? nailFinishDefs(idPfx) : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${H + 2}" width="${totalW}" height="${H + 2}" role="img" aria-label="${shape} ${length} nails">${defs}
  ${nails}
</svg>`;
}
