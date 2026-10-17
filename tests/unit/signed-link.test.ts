import { describe, it, expect, beforeAll } from 'vitest';

// Must set env before importing the module
beforeAll(() => {
  process.env.SIGNED_LINK_SECRET = 'test-secret-32-bytes-long-enough!!';
});

// Dynamic import to ensure env is set before module loads
const { signRef, verifyRef } = await import('@/lib/signed-link');

describe('signRef', () => {
  it('returns a 22-character base64url string', () => {
    const k = signRef('CBD-B-1234');
    expect(k).toHaveLength(22);
    expect(k).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('is deterministic for the same ref', () => {
    expect(signRef('CBD-B-1234')).toBe(signRef('CBD-B-1234'));
  });

  it('differs for different refs', () => {
    expect(signRef('CBD-B-1234')).not.toBe(signRef('CBD-B-5678'));
  });
});

describe('verifyRef', () => {
  it('returns true for a valid k', () => {
    const ref = 'CBD-B-TEST';
    const k = signRef(ref);
    expect(verifyRef(ref, k)).toBe(true);
  });

  it('returns false for a wrong k', () => {
    expect(verifyRef('CBD-B-TEST', 'wrongkwrongkwrongkwron')).toBe(false);
  });

  it('returns false for a tampered ref', () => {
    const k = signRef('CBD-B-ORIG');
    expect(verifyRef('CBD-B-TAMPERED', k)).toBe(false);
  });
});
