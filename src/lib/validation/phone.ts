const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
const E164_INDIAN_RE = /^\+91[6-9]\d{9}$/;

/** Normalise a raw phone input to E.164 (+91XXXXXXXXXX). Returns null if invalid. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, '');
  let mobile = digits;

  if (mobile.startsWith('+91')) mobile = mobile.slice(3);
  else if (mobile.startsWith('91') && mobile.length === 12) mobile = mobile.slice(2);

  return INDIAN_MOBILE_RE.test(mobile) ? `+91${mobile}` : null;
}

/** Validate a string that is already expected to be E.164 (+91XXXXXXXXXX). */
export function isValidE164Indian(value: string): boolean {
  return E164_INDIAN_RE.test(value);
}

/** Extract the last 10 digits from an E.164 Indian number. Used for the /status form match. */
export function last10(e164: string): string {
  return e164.slice(-10);
}
