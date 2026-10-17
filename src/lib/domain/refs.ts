import { randomBytes } from 'crypto';

// Crockford base32 without I, L, O, U  →  32 chars
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomBase32(len: number): string {
  const bytes = randomBytes(len * 2); // oversample for safety
  let result = '';
  for (let i = 0; result.length < len; i++) {
    const byte = bytes[i % bytes.length]!;
    result += ALPHABET[byte % ALPHABET.length];
  }
  return result;
}

/** CBD-B-XXXX — booking reference */
export function generateBookingRef(): string {
  return `CBD-B-${randomBase32(4)}`;
}

/** CBD-P-XXXX — press-on order reference */
export function generateOrderRef(): string {
  return `CBD-P-${randomBase32(4)}`;
}

/** Parse the prefix from a reference string. Returns null if unrecognised. */
export function refPrefix(ref: string): 'B' | 'P' | null {
  if (ref.startsWith('CBD-B-')) return 'B';
  if (ref.startsWith('CBD-P-')) return 'P';
  return null;
}
