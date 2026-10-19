import { describe, it, expect } from 'vitest';
import { sanitizeNextPath } from '@/lib/gate/sanitize-next';

describe('sanitizeNextPath', () => {
  it('returns / for null', () => {
    expect(sanitizeNextPath(null)).toBe('/');
  });

  it('returns / for undefined', () => {
    expect(sanitizeNextPath(undefined)).toBe('/');
  });

  it('returns / for empty string', () => {
    expect(sanitizeNextPath('')).toBe('/');
  });

  it('passes through a normal relative path', () => {
    expect(sanitizeNextPath('/')).toBe('/');
    expect(sanitizeNextPath('/looks')).toBe('/looks');
    expect(sanitizeNextPath('/looks?page=2')).toBe('/looks?page=2');
  });

  it('rejects paths that start with //', () => {
    expect(sanitizeNextPath('//evil.com')).toBe('/');
    expect(sanitizeNextPath('//evil.com/steal')).toBe('/');
  });

  it('rejects paths that do not start with /', () => {
    expect(sanitizeNextPath('https://evil.com')).toBe('/');
    expect(sanitizeNextPath('evil.com')).toBe('/');
    expect(sanitizeNextPath('javascript:alert(1)')).toBe('/');
  });

  it('rejects paths starting with /preview to prevent redirect loops', () => {
    expect(sanitizeNextPath('/preview')).toBe('/');
    expect(sanitizeNextPath('/preview?next=%2F')).toBe('/');
    expect(sanitizeNextPath('/preview/anything')).toBe('/');
  });

  it('rejects paths that contain next= to prevent double-encoding loops', () => {
    expect(sanitizeNextPath('/?next=/preview')).toBe('/');
    expect(sanitizeNextPath('/page?next=%2F')).toBe('/');
  });
});
