import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import { WELCOME_NOTE } from '@/content/welcome-note';

const EXPECTED_HASH = '332749b475b4bebda6aa99ae25beceac8764596f2a801eafa418231177c9bb32';

describe('WELCOME_NOTE', () => {
  it('SHA-256 hash matches the frozen value (§15)', () => {
    const hash = createHash('sha256').update(WELCOME_NOTE, 'utf8').digest('hex');
    expect(hash).toBe(EXPECTED_HASH);
  });

  it('is 675 bytes, 13 lines', () => {
    const bytes = Buffer.byteLength(WELCOME_NOTE, 'utf8');
    const lines = WELCOME_NOTE.split('\n').length;
    expect(bytes).toBe(675);
    expect(lines).toBe(13);
  });
});
