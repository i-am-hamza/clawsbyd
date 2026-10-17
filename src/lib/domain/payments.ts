// §7.6 / §13 — recordPayment is the ONLY code that marks a deposit received or an order paid.
// Full transaction implementation lives in the server action; this module defines the input/output types
// and re-exportable validation so client and server share the same schema.

import { z } from 'zod';

export const RecordPaymentSchema = z.object({
  purpose: z.enum(['booking_deposit', 'order']),
  bookingId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  amountPaise: z.number().int().positive(),
  method: z.enum(['upi', 'cash', 'other']),
  reference: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
});

export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

/**
 * Validates a payment instruction template. Only {amount}, {upiId}, {ref} are allowed.
 * Used in the admin settings save action.
 */
export function validatePaymentInstructions(template: string): boolean {
  const allowed = new Set(['{amount}', '{upiId}', '{ref}']);
  const found = template.match(/\{[a-zA-Z]+\}/g) ?? [];
  return found.every((v) => allowed.has(v));
}

/**
 * Fill a payment instructions template.
 */
export function fillPaymentInstructions(
  template: string,
  vars: { amount: string; upiId: string; ref: string },
): string {
  return template
    .replace('{amount}', vars.amount)
    .replace('{upiId}', vars.upiId)
    .replace('{ref}', vars.ref);
}
