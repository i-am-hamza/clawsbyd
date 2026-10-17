import { describe, it, expect } from 'vitest';
import { REGISTRY, PUBLIC_KEYS } from '@/lib/settings/registry';

describe('settings registry', () => {
  it('no private.* key is in the public allow-list', () => {
    const privateKeys = Object.keys(REGISTRY).filter((k) => k.startsWith('private.'));
    for (const key of privateKeys) {
      expect(PUBLIC_KEYS.has(key)).toBe(false);
    }
  });

  it('every public key exists in the registry', () => {
    for (const key of PUBLIC_KEYS) {
      expect(REGISTRY[key]).toBeDefined();
      expect(REGISTRY[key]!.public).toBe(true);
    }
  });

  it('site.go_live is public', () => {
    expect(PUBLIC_KEYS.has('site.go_live')).toBe(true);
  });

  it('payments.upi_id is not public', () => {
    expect(PUBLIC_KEYS.has('payments.upi_id')).toBe(false);
  });

  it('private.studio_address is not public', () => {
    expect(PUBLIC_KEYS.has('private.studio_address')).toBe(false);
  });

  it('private.pickup_point is not public', () => {
    expect(PUBLIC_KEYS.has('private.pickup_point')).toBe(false);
  });

  it('all defaults pass their own zod schema', () => {
    for (const [key, def] of Object.entries(REGISTRY)) {
      expect(() => def.schema.parse(def.default)).not.toThrow();
    }
  });
});
