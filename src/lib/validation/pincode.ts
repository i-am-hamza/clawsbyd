const PINCODE_RE = /^[1-9]\d{5}$/;

export function isValidPincode(value: string): boolean {
  return PINCODE_RE.test(value);
}

/** Returns the leading 3-digit prefix (used for pickup suggestion). */
export function pincodePrefix(value: string): string {
  return value.slice(0, 3);
}
