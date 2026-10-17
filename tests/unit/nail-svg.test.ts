import { describe, it, expect } from 'vitest';
import {
  nailPath,
  nailHeight,
  renderNailPreviewSVG,
  NAIL_SHAPES,
  NAIL_LENGTHS,
  type NailShape,
  type NailLength,
} from '@/lib/nail-svg';

describe('nailPath', () => {
  // 28 snapshot tests: 7 shapes × 4 lengths
  for (const shape of NAIL_SHAPES) {
    for (const length of NAIL_LENGTHS) {
      it(`${shape}/${length} matches snapshot`, () => {
        expect(nailPath(shape, length)).toMatchSnapshot();
      });
    }
  }

  it('returns a string', () => {
    expect(typeof nailPath('almond', 'medium')).toBe('string');
  });

  it('starts with M and ends with Z', () => {
    for (const shape of NAIL_SHAPES) {
      for (const length of NAIL_LENGTHS) {
        const d = nailPath(shape, length);
        expect(d).toMatch(/^M /);
        expect(d).toMatch(/Z$/);
      }
    }
  });

  it('all 28 paths are unique', () => {
    const paths = new Set<string>();
    for (const shape of NAIL_SHAPES) {
      for (const length of NAIL_LENGTHS) {
        paths.add(nailPath(shape, length));
      }
    }
    expect(paths.size).toBe(28);
  });
});

describe('nailHeight', () => {
  it('returns increasing heights for short→xl', () => {
    const heights = NAIL_LENGTHS.map(nailHeight);
    for (let i = 1; i < heights.length; i++) {
      const prev = heights[i - 1];
      const curr = heights[i];
      expect(curr).toBeGreaterThan(prev!);
    }
  });
});

describe('shapes differ meaningfully per length', () => {
  it('longer nails have more path content than shorter ones (same shape)', () => {
    for (const shape of NAIL_SHAPES) {
      const lengths = NAIL_LENGTHS.map(l => nailPath(shape, l));
      // The paths for different lengths must differ
      const unique = new Set(lengths);
      expect(unique.size).toBe(4);
    }
  });
});

describe('renderNailPreviewSVG', () => {
  it('produces a valid SVG string', () => {
    const svg = renderNailPreviewSVG({
      shape: 'almond',
      length: 'medium',
      colours: ['#F2C4CE'],
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
  });

  it('includes all 5 nail paths', () => {
    const svg = renderNailPreviewSVG({
      shape: 'oval',
      length: 'long',
      colours: ['#A3405A'],
    });
    expect((svg.match(/<path/g) ?? []).length).toBe(5);
  });

  it('uses chrome gradient fill for chrome finish', () => {
    const svg = renderNailPreviewSVG({
      shape: 'square',
      length: 'short',
      colours: ['#ffffff'],
      finish: 'chrome',
    });
    expect(svg).toContain('linearGradient');
    expect(svg).toContain('chrome');
  });

  it('uses cat-eye gradient fill for cat-eye finish', () => {
    const svg = renderNailPreviewSVG({
      shape: 'square',
      length: 'short',
      colours: ['#ffffff'],
      finish: 'cat-eye',
    });
    expect(svg).toContain('cat-eye');
  });

  it('wraps colours for 5 nails when fewer colours supplied', () => {
    const svg = renderNailPreviewSVG({
      shape: 'stiletto',
      length: 'xl',
      colours: ['#A3405A', '#8C1332'],
    });
    // Both colours should appear
    expect(svg).toContain('#A3405A');
    expect(svg).toContain('#8C1332');
  });

  it('snapshot: almond/medium/solid', () => {
    expect(renderNailPreviewSVG({ shape: 'almond', length: 'medium', colours: ['#F2C4CE'] })).toMatchSnapshot();
  });

  it('snapshot: coffin/long/chrome', () => {
    expect(renderNailPreviewSVG({ shape: 'coffin', length: 'long', colours: [], finish: 'chrome' })).toMatchSnapshot();
  });
});
