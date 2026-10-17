import { createHmac } from 'crypto';

/** k = base64url(HMAC-SHA256(ref, SIGNED_LINK_SECRET)).slice(0, 22) */
export function signRef(ref: string): string {
  const secret = process.env.SIGNED_LINK_SECRET;
  if (!secret) throw new Error('SIGNED_LINK_SECRET is not set');
  return createHmac('sha256', secret)
    .update(ref)
    .digest('base64url')
    .slice(0, 22);
}

export function verifyRef(ref: string, k: string): boolean {
  try {
    return signRef(ref) === k;
  } catch {
    return false;
  }
}
