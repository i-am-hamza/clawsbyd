import { describe, it, expect } from 'vitest';
import { normalisePhone, isValidE164Indian, last10 } from '@/lib/validation/phone';

describe('normalisePhone', () => {
  it('normalises a bare 10-digit mobile', () => {
    expect(normalisePhone('9876543210')).toBe('+919876543210');
  });

  it('normalises a +91 prefixed number', () => {
    expect(normalisePhone('+919876543210')).toBe('+919876543210');
  });

  it('normalises a 91-prefixed number (12 digits)', () => {
    expect(normalisePhone('919876543210')).toBe('+919876543210');
  });

  it('strips spaces and dashes', () => {
    expect(normalisePhone('98765 43210')).toBe('+919876543210');
    expect(normalisePhone('98765-43210')).toBe('+919876543210');
  });

  it('rejects a number starting with 5', () => {
    expect(normalisePhone('5876543210')).toBeNull();
  });

  it('rejects a landline-length number', () => {
    expect(normalisePhone('123456')).toBeNull();
  });

  it('accepts numbers starting 6–9', () => {
    for (const first of ['6', '7', '8', '9']) {
      expect(normalisePhone(`${first}876543210`)).not.toBeNull();
    }
  });
});

describe('isValidE164Indian', () => {
  it('accepts a valid E.164', () => {
    expect(isValidE164Indian('+919876543210')).toBe(true);
  });

  it('rejects without + prefix', () => {
    expect(isValidE164Indian('919876543210')).toBe(false);
  });

  it('rejects wrong country code', () => {
    expect(isValidE164Indian('+449876543210')).toBe(false);
  });
});

describe('last10', () => {
  it('extracts last 10 digits', () => {
    expect(last10('+919876543210')).toBe('9876543210');
  });
});
