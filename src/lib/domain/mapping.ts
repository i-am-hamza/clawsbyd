// §7.5 Look → service / tier mapping — pure function, no DB calls.

export type LookInput = {
  glamLevel: number; // 1–5
  occasions: string[];
  shape?: string;
  length?: string;
  adminServiceOverride?: string | null;
  adminTierOverride?: string | null;
};

export type MappingResult = {
  suggestedServiceSlug: string;
  suggestedTier: string;
};

/**
 * §7.5 Admin overrides win. Defaults:
 * - occasion includes bridal → bridal set / bridal tier
 * - glam 5 → Glam set / Glam tier
 * - glam 4 → Signature set / Glam tier
 * - glam 3 → Signature set / Signature tier
 * - glam 1–2 → Gel with finish / Classic tier
 */
export function mapLookToServiceAndTier(look: LookInput): MappingResult {
  if (look.adminServiceOverride && look.adminTierOverride) {
    return {
      suggestedServiceSlug: look.adminServiceOverride,
      suggestedTier: look.adminTierOverride,
    };
  }

  const isBridal = look.occasions.includes('bridal');

  if (isBridal) {
    return {
      suggestedServiceSlug: look.adminServiceOverride ?? 'bridal-set',
      suggestedTier: look.adminTierOverride ?? 'bridal',
    };
  }

  if (look.glamLevel === 5) {
    return {
      suggestedServiceSlug: look.adminServiceOverride ?? 'glam-set',
      suggestedTier: look.adminTierOverride ?? 'glam',
    };
  }

  if (look.glamLevel === 4) {
    return {
      suggestedServiceSlug: look.adminServiceOverride ?? 'signature-set',
      suggestedTier: look.adminTierOverride ?? 'glam',
    };
  }

  if (look.glamLevel === 3) {
    return {
      suggestedServiceSlug: look.adminServiceOverride ?? 'signature-set',
      suggestedTier: look.adminTierOverride ?? 'signature',
    };
  }

  // glam 1–2
  return {
    suggestedServiceSlug:
      look.adminServiceOverride ?? 'gel-polish-french-chrome-cat-eye',
    suggestedTier: look.adminTierOverride ?? 'classic',
  };
}
