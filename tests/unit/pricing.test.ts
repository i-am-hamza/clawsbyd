import { describe, it, expect } from 'vitest';
import { priceBooking, type PricingServiceInput, type PricingSettings } from '@/lib/domain/pricing';

const BASE_SETTINGS: PricingSettings = {
  homeVisitMinBookingPaise: 99900,
  bandFees: { within_4km: 10000, km_4_to_8: 20000 },
  launchOffer: { enabled: true, amountPaise: 20000, spotsLeft: 10 },
  depositsStandardPaise: 20000,
  depositsBridalPaise: 50000,
};

function svc(overrides: Partial<PricingServiceInput> = {}): PricingServiceInput {
  return {
    id: 'svc-1',
    name: 'Test Service',
    pricePaise: 49900,
    priceIsFrom: false,
    perNail: false,
    quantity: 1,
    isNewSet: true,
    freeWithNewSet: false,
    isExtensionSet: false,
    depositKind: 'none',
    ...overrides,
  };
}

describe('priceBooking', () => {
  // 1. Single gel polish at studio
  it('single gel polish at studio — no deposit, no discount', () => {
    const result = priceBooking([svc({ pricePaise: 49900 })], 'studio', BASE_SETTINGS);
    expect(result.subtotal).toBe(49900);
    expect(result.travelFee).toBe(0);
    expect(result.deposit).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.estimate).toBe(49900);
    expect(result.minimumMet).toBe(true);
  });

  // 2. Extension set at studio — standard deposit
  it('extension set at studio — standard deposit', () => {
    const result = priceBooking(
      [svc({ pricePaise: 119900, isExtensionSet: true, depositKind: 'standard' })],
      'studio',
      BASE_SETTINGS,
    );
    expect(result.deposit).toBe(20000);
    expect(result.discountSource).toBe('none'); // no eligible phone
  });

  // 3. Extension set with launch offer eligible
  it('extension set with launch offer eligible', () => {
    const result = priceBooking(
      [svc({ pricePaise: 119900, isExtensionSet: true, depositKind: 'standard' })],
      'studio',
      BASE_SETTINGS,
      { launchOfferPhoneEligible: true },
    );
    expect(result.discount).toBe(20000);
    expect(result.discountSource).toBe('launch_offer');
    expect(result.estimate).toBe(99900);
  });

  // 4. Extension set — coupon > launch offer
  it('extension set — coupon bigger than launch offer', () => {
    const result = priceBooking(
      [svc({ pricePaise: 119900, isExtensionSet: true, depositKind: 'standard' })],
      'studio',
      BASE_SETTINGS,
      {
        launchOfferPhoneEligible: true,
        coupon: { amountPaise: 30000, appliesTo: 'booking' },
      },
    );
    expect(result.discount).toBe(30000);
    expect(result.discountSource).toBe('coupon');
  });

  // 5. Extension set — launch offer wins over smaller coupon
  it('extension set — launch offer bigger than coupon', () => {
    const result = priceBooking(
      [svc({ pricePaise: 119900, isExtensionSet: true, depositKind: 'standard' })],
      'studio',
      BASE_SETTINGS,
      {
        launchOfferPhoneEligible: true,
        coupon: { amountPaise: 5000, appliesTo: 'booking' },
      },
    );
    expect(result.discount).toBe(20000);
    expect(result.discountSource).toBe('launch_offer');
  });

  // 6. Home visit below minimum — minimumMet=false
  it('home visit below ₹999 minimum', () => {
    const result = priceBooking(
      [svc({ pricePaise: 49900 })], // ₹499
      'home',
      BASE_SETTINGS,
      { area: { band: 'within_4km', travelFeePaise: 10000 } },
    );
    expect(result.minimumMet).toBe(false);
    expect(result.warnings).toContain(
      'Home visits start at ₹999. Add a service or choose the studio.',
    );
  });

  // 7. Home visit exactly at minimum — allowed
  it('home visit exactly at ₹999 minimum', () => {
    const result = priceBooking(
      [svc({ pricePaise: 99900 })], // ₹999
      'home',
      BASE_SETTINGS,
      { area: { band: 'within_4km', travelFeePaise: 10000 } },
    );
    expect(result.minimumMet).toBe(true);
    expect(result.travelFee).toBe(10000);
  });

  // 8. Home visit just below minimum
  it('home visit at ₹998 — below minimum', () => {
    const result = priceBooking(
      [svc({ pricePaise: 99800 })],
      'home',
      BASE_SETTINGS,
      { area: { band: 'within_4km', travelFeePaise: 10000 } },
    );
    expect(result.minimumMet).toBe(false);
  });

  // 9. Home visit on_request area — travelFee null
  it('home visit on_request area — travel fee null', () => {
    const result = priceBooking(
      [svc({ pricePaise: 149900, isExtensionSet: true, depositKind: 'standard' })],
      'home',
      BASE_SETTINGS,
      { area: { band: 'on_request', travelFeePaise: null } },
    );
    expect(result.travelFee).toBeNull();
    expect(result.warnings).toContain('Travel fee confirmed on WhatsApp');
  });

  // 10. Home visit within_4km — ₹100 fee
  it('home visit within_4km — ₹100 travel fee', () => {
    const result = priceBooking(
      [svc({ pricePaise: 149900 })],
      'home',
      BASE_SETTINGS,
      { area: { band: 'within_4km', travelFeePaise: 10000 } },
    );
    expect(result.travelFee).toBe(10000);
  });

  // 11. Home visit km_4_to_8 — ₹200 fee
  it('home visit km_4_to_8 — ₹200 travel fee', () => {
    const result = priceBooking(
      [svc({ pricePaise: 149900 })],
      'home',
      BASE_SETTINGS,
      { area: { band: 'km_4_to_8', travelFeePaise: 20000 } },
    );
    expect(result.travelFee).toBe(20000);
  });

  // 12. New set + removal (free_with_new_set) → removal is ₹0
  it('new set + removal — removal free with new set', () => {
    const result = priceBooking(
      [
        svc({ id: 'ext', pricePaise: 119900, isNewSet: true, isExtensionSet: true, depositKind: 'standard' }),
        svc({ id: 'rem', name: 'Gel removal', pricePaise: 19900, isNewSet: false, freeWithNewSet: true }),
      ],
      'studio',
      BASE_SETTINGS,
    );
    const remLine = result.lines.find((l) => l.serviceId === 'rem')!;
    expect(remLine.lineTotalPaise).toBe(0);
    expect(remLine.note).toBe('Free with your new set');
    expect(result.subtotal).toBe(119900); // only the extension set
  });

  // 13. Multiple free services with new set
  it('multiple free services with new set', () => {
    const result = priceBooking(
      [
        svc({ id: 'ext', pricePaise: 119900, isNewSet: true }),
        svc({ id: 'rem1', pricePaise: 19900, isNewSet: false, freeWithNewSet: true }),
        svc({ id: 'rem2', pricePaise: 29900, isNewSet: false, freeWithNewSet: true }),
      ],
      'studio',
      BASE_SETTINGS,
    );
    expect(result.subtotal).toBe(119900);
    result.lines.filter((l) => l.serviceId !== 'ext').forEach((l) => {
      expect(l.lineTotalPaise).toBe(0);
    });
  });

  // 14. Bridal service → bridal deposit
  it('bridal service — bridal deposit ₹500', () => {
    const result = priceBooking(
      [svc({ pricePaise: 249900, isExtensionSet: true, depositKind: 'bridal' })],
      'studio',
      BASE_SETTINGS,
    );
    expect(result.deposit).toBe(50000);
  });

  // 15. Extension set (no home, no bridal) → standard deposit
  it('extension set studio — standard deposit ₹200', () => {
    const result = priceBooking(
      [svc({ pricePaise: 119900, isExtensionSet: true, depositKind: 'standard' })],
      'studio',
      BASE_SETTINGS,
    );
    expect(result.deposit).toBe(20000);
  });

  // 16. Per-nail addon: 10 nails × ₹50 = ₹500
  it('per-nail addon: 10 × ₹50 = ₹500', () => {
    const result = priceBooking(
      [svc({ id: 'addon', pricePaise: 5000, perNail: true, quantity: 10, isNewSet: false })],
      'studio',
      BASE_SETTINGS,
    );
    const line = result.lines[0]!;
    expect(line.lineTotalPaise).toBe(50000);
    expect(result.subtotal).toBe(50000);
  });

  // 17. No services → empty
  it('no services → zero estimate', () => {
    const result = priceBooking([], 'studio', BASE_SETTINGS);
    expect(result.subtotal).toBe(0);
    expect(result.estimate).toBe(0);
    expect(result.deposit).toBe(0);
  });

  // 18. Launch offer — spots_left=0 → no offer
  it('launch offer with spots_left=0 — no discount', () => {
    const settings = { ...BASE_SETTINGS, launchOffer: { ...BASE_SETTINGS.launchOffer, spotsLeft: 0 } };
    const result = priceBooking(
      [svc({ pricePaise: 119900, isExtensionSet: true, depositKind: 'standard' })],
      'studio',
      settings,
      { launchOfferPhoneEligible: true },
    );
    expect(result.discount).toBe(0);
    expect(result.discountSource).toBe('none');
  });

  // 19. Launch offer disabled → no discount
  it('launch offer disabled — no discount', () => {
    const settings = { ...BASE_SETTINGS, launchOffer: { ...BASE_SETTINGS.launchOffer, enabled: false } };
    const result = priceBooking(
      [svc({ pricePaise: 119900, isExtensionSet: true, depositKind: 'standard' })],
      'studio',
      settings,
      { launchOfferPhoneEligible: true },
    );
    expect(result.discount).toBe(0);
  });

  // 20. No extension service → launch offer not applicable
  it('no extension service — launch offer not applicable', () => {
    const result = priceBooking(
      [svc({ pricePaise: 49900, isExtensionSet: false })],
      'studio',
      BASE_SETTINGS,
      { launchOfferPhoneEligible: true },
    );
    expect(result.discount).toBe(0);
    expect(result.discountSource).toBe('none');
  });

  // 21. hasFromPrices set when any service is 'from'
  it('hasFromPrices true when any service has priceIsFrom', () => {
    const result = priceBooking(
      [svc({ pricePaise: 119900, priceIsFrom: true })],
      'studio',
      BASE_SETTINGS,
    );
    expect(result.hasFromPrices).toBe(true);
  });

  // 22. Home visit with no area → travelFee null
  it('home visit with no area specified — travelFee null', () => {
    const result = priceBooking(
      [svc({ pricePaise: 149900 })],
      'home',
      BASE_SETTINGS,
    );
    expect(result.travelFee).toBeNull();
  });

  // 23. estimate clamps to 0 (discount > total)
  it('estimate does not go negative', () => {
    const settings = { ...BASE_SETTINGS, launchOffer: { ...BASE_SETTINGS.launchOffer, amountPaise: 999999 } };
    const result = priceBooking(
      [svc({ pricePaise: 49900, isExtensionSet: true, depositKind: 'standard' })],
      'studio',
      settings,
      { launchOfferPhoneEligible: true },
    );
    expect(result.estimate).toBe(0);
  });

  // 24. Home visit standard deposit when no bridal
  it('home visit non-bridal → standard deposit', () => {
    const result = priceBooking(
      [svc({ pricePaise: 149900, depositKind: 'none' })],
      'home',
      BASE_SETTINGS,
      { area: { band: 'within_4km', travelFeePaise: 10000 } },
    );
    expect(result.deposit).toBe(20000);
  });

  // 25. Coupon applies_to 'press_on' ignored for booking
  it('coupon applies_to press_on — not applied to booking', () => {
    const result = priceBooking(
      [svc({ pricePaise: 119900, isExtensionSet: true, depositKind: 'standard' })],
      'studio',
      BASE_SETTINGS,
      { coupon: { amountPaise: 30000, appliesTo: 'press_on' } },
    );
    expect(result.discount).toBe(0);
  });
});
