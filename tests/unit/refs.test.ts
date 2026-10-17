import { describe, it, expect } from 'vitest';
import { generateBookingRef, generateOrderRef, refPrefix } from '@/lib/domain/refs';

describe('generateBookingRef', () => {
  it('has the correct prefix', () => {
    expect(generateBookingRef()).toMatch(/^CBD-B-[0-9A-HJ-KMN-PR-TVWXYZ]{4}$/);
  });

  it('generates unique refs', () => {
    const refs = new Set(Array.from({ length: 100 }, generateBookingRef));
    expect(refs.size).toBe(100);
  });
});

describe('generateOrderRef', () => {
  it('has the correct prefix', () => {
    expect(generateOrderRef()).toMatch(/^CBD-P-[0-9A-HJ-KMN-PR-TVWXYZ]{4}$/);
  });

  it('generates unique refs', () => {
    const refs = new Set(Array.from({ length: 100 }, generateOrderRef));
    expect(refs.size).toBe(100);
  });

  it('does not use excluded chars I, L, O, U', () => {
    for (let i = 0; i < 500; i++) {
      const ref = generateOrderRef();
      const suffix = ref.slice('CBD-P-'.length);
      expect(suffix).not.toMatch(/[ILOU]/);
    }
  });
});

describe('refPrefix', () => {
  it('extracts B from booking ref', () => {
    expect(refPrefix('CBD-B-1234')).toBe('B');
  });

  it('extracts P from order ref', () => {
    expect(refPrefix('CBD-P-1234')).toBe('P');
  });

  it('returns null for unknown format', () => {
    expect(refPrefix('UNKNOWN')).toBeNull();
  });
});
