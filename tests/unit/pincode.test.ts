import { describe, it, expect } from 'vitest';
import { isValidPincode, pincodePrefix } from '@/lib/validation/pincode';

describe('isValidPincode', () => {
  it('accepts valid Indian pincode', () => {
    expect(isValidPincode('834001')).toBe(true);
    expect(isValidPincode('110001')).toBe(true);
  });

  it('rejects pincodes starting with 0', () => {
    expect(isValidPincode('034001')).toBe(false);
  });

  it('rejects 5-digit pincode', () => {
    expect(isValidPincode('83400')).toBe(false);
  });

  it('rejects 7-digit pincode', () => {
    expect(isValidPincode('8340011')).toBe(false);
  });

  it('rejects non-numeric', () => {
    expect(isValidPincode('8340XX')).toBe(false);
  });
});

describe('pincodePrefix', () => {
  it('returns the first 3 digits', () => {
    expect(pincodePrefix('834001')).toBe('834');
  });
});
