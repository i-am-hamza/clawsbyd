import { describe, it, expect } from 'vitest';
import {
  validatePaymentInstructions,
  fillPaymentInstructions,
  RecordPaymentSchema,
} from '@/lib/domain/payments';

describe('validatePaymentInstructions', () => {
  it('accepts a template with only allowed variables', () => {
    expect(
      validatePaymentInstructions(
        'Please pay {amount} to {upiId} with {ref} as note.',
      ),
    ).toBe(true);
  });

  it('rejects a template with an unknown variable', () => {
    expect(validatePaymentInstructions('Pay {amount} to {link}')).toBe(false);
  });

  it('accepts a template with no variables', () => {
    expect(validatePaymentInstructions('Send payment on WhatsApp.')).toBe(true);
  });

  it('accepts partial variable usage', () => {
    expect(validatePaymentInstructions('Pay {amount} to UPI.')).toBe(true);
  });
});

describe('fillPaymentInstructions', () => {
  it('fills all three variables', () => {
    const result = fillPaymentInstructions(
      'Pay {amount} to {upiId} with {ref}.',
      { amount: '₹200', upiId: 'test@upi', ref: 'CBD-B-1234' },
    );
    expect(result).toBe('Pay ₹200 to test@upi with CBD-B-1234.');
  });
});

describe('RecordPaymentSchema', () => {
  it('accepts a valid booking deposit', () => {
    expect(() =>
      RecordPaymentSchema.parse({
        purpose: 'booking_deposit',
        bookingId: '00000000-0000-0000-0000-000000000001',
        amountPaise: 20000,
        method: 'upi',
        reference: 'T123456789',
      }),
    ).not.toThrow();
  });

  it('rejects zero amount', () => {
    expect(() =>
      RecordPaymentSchema.parse({
        purpose: 'order',
        orderId: '00000000-0000-0000-0000-000000000001',
        amountPaise: 0,
        method: 'upi',
      }),
    ).toThrow();
  });

  it('rejects negative amount', () => {
    expect(() =>
      RecordPaymentSchema.parse({
        purpose: 'order',
        orderId: '00000000-0000-0000-0000-000000000001',
        amountPaise: -100,
        method: 'cash',
      }),
    ).toThrow();
  });
});
