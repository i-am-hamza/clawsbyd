// §7.1 Booking pricing — pure function, no DB calls.

export type PricingServiceInput = {
  id: string;
  name: string;
  pricePaise: number;
  priceIsFrom: boolean;
  perNail: boolean;
  quantity: number;        // 1 for non-per-nail; 1–20 for per-nail add-ons
  isNewSet: boolean;
  freeWithNewSet: boolean;
  isExtensionSet: boolean;
  depositKind: 'none' | 'standard' | 'bridal';
};

export type PricingArea = {
  band: 'within_4km' | 'km_4_to_8' | 'on_request';
  travelFeePaise: number | null; // null when on_request
};

export type PricingCoupon = {
  amountPaise: number;
  appliesTo: 'booking' | 'press_on' | 'any';
};

export type PricingSettings = {
  homeVisitMinBookingPaise: number;
  bandFees: { within_4km: number; km_4_to_8: number };
  launchOffer: { enabled: boolean; amountPaise: number; spotsLeft: number };
  depositsStandardPaise: number;
  depositsBridalPaise: number;
};

export type PricingLine = {
  serviceId: string;
  name: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
  priceIsFrom: boolean;
  note?: string;
};

export type PricingResult = {
  lines: PricingLine[];
  subtotal: number;
  travelFee: number | null;
  discount: number;
  discountSource: 'launch_offer' | 'coupon' | 'none';
  estimate: number;
  hasFromPrices: boolean;
  deposit: number;
  minimumMet: boolean;
  warnings: string[];
};

/**
 * §7.1 Order of operations:
 * 1. Compute lines (per-nail × quantity, free_with_new_set when any is_new_set).
 * 2. subtotal = sum of lines.
 * 3. Home-visit minimum check.
 * 4. Travel fee from area band.
 * 5. Best discount: launch offer vs coupon (larger wins; one per booking).
 * 6. estimate = max(0, subtotal + travelFee − discount).
 * 7. Deposit based on service flags and location.
 * 8. hasFromPrices.
 */
export function priceBooking(
  services: PricingServiceInput[],
  location: 'studio' | 'home',
  settings: PricingSettings,
  opts?: {
    area?: PricingArea;
    coupon?: PricingCoupon;
    launchOfferPhoneEligible?: boolean; // server re-validates; client passes true optimistically
  },
): PricingResult {
  const warnings: string[] = [];
  const hasNewSet = services.some((s) => s.isNewSet);

  // Step 1: lines
  const lines: PricingLine[] = services.map((s) => {
    const isFree = hasNewSet && s.freeWithNewSet;
    const unit = isFree ? 0 : s.pricePaise;
    const total = unit * s.quantity;
    return {
      serviceId: s.id,
      name: s.name,
      unitPricePaise: unit,
      quantity: s.quantity,
      lineTotalPaise: total,
      priceIsFrom: s.priceIsFrom,
      note: isFree ? 'Free with your new set' : undefined,
    };
  });

  // Step 2: subtotal
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalPaise, 0);

  // Step 3: home-visit minimum
  const minimumMet =
    location !== 'home' || subtotal >= settings.homeVisitMinBookingPaise;
  if (location === 'home' && !minimumMet) {
    warnings.push('Home visits start at ₹999. Add a service or choose the studio.');
  }

  // Step 4: travel fee
  let travelFee: number | null = 0;
  if (location === 'home') {
    if (!opts?.area) {
      travelFee = null;
    } else if (opts.area.band === 'on_request') {
      travelFee = null;
      warnings.push('Travel fee confirmed on WhatsApp');
    } else if (opts.area.band === 'within_4km') {
      travelFee = settings.bandFees.within_4km;
    } else {
      travelFee = settings.bandFees.km_4_to_8;
    }
  }

  // Step 5: best discount
  let launchOfferAmount = 0;
  const hasExtension = services.some((s) => s.isExtensionSet);
  if (
    settings.launchOffer.enabled &&
    settings.launchOffer.spotsLeft > 0 &&
    hasExtension &&
    (opts?.launchOfferPhoneEligible ?? false)
  ) {
    launchOfferAmount = settings.launchOffer.amountPaise;
  }

  let couponAmount = 0;
  if (opts?.coupon && (opts.coupon.appliesTo === 'booking' || opts.coupon.appliesTo === 'any')) {
    couponAmount = opts.coupon.amountPaise;
  }

  let discount = 0;
  let discountSource: PricingResult['discountSource'] = 'none';
  if (launchOfferAmount > 0 || couponAmount > 0) {
    if (launchOfferAmount >= couponAmount) {
      discount = launchOfferAmount;
      discountSource = 'launch_offer';
    } else {
      discount = couponAmount;
      discountSource = 'coupon';
    }
  }

  // Step 6: estimate
  const travelForCalc = travelFee ?? 0;
  const estimate = Math.max(0, subtotal + travelForCalc - discount);

  // Step 7: deposit
  const hasBridal = services.some((s) => s.depositKind === 'bridal');
  const hasStandard = services.some(
    (s) => s.depositKind === 'standard' || s.isExtensionSet,
  );
  let deposit = 0;
  if (hasBridal) {
    deposit = settings.depositsBridalPaise;
  } else if (hasStandard || location === 'home') {
    deposit = settings.depositsStandardPaise;
  }

  // Step 8: hasFromPrices
  const hasFromPrices = lines.some((l) => l.priceIsFrom);

  return {
    lines,
    subtotal,
    travelFee,
    discount,
    discountSource,
    estimate,
    hasFromPrices,
    deposit,
    minimumMet,
    warnings,
  };
}
