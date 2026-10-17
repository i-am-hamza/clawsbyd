// §7.3 Order pricing and shipping — pure function, no DB calls.

export type OrderItem = {
  pricePaise: number;
  priceIsFrom: boolean;
  quantity: number;
  tier: string;
};

export type OrderCoupon = {
  amountPaise: number;
  appliesTo: 'booking' | 'press_on' | 'any';
};

export type ShippingSettings = {
  flatPaise: number;
  freeAbovePaise: number;
  pickupEnabled: boolean;
};

export type OrderPricingResult = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  hasFromPrices: boolean;
};

/**
 * §7.3 priceOrder:
 * subtotal → coupon (sizing_kit_credit only on tiers other than sizing_kit)
 * → shipping: pickup → 0; subtotal after discount > free_above → 0; else flat
 * → total
 *
 * Sizing-kit-only orders pay flat shipping.
 */
export function priceOrder(
  items: OrderItem[],
  coupon: OrderCoupon | null,
  fulfilment: 'ship' | 'pickup',
  settings: ShippingSettings,
): OrderPricingResult {
  const subtotal = items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0);

  let discount = 0;
  if (coupon && (coupon.appliesTo === 'press_on' || coupon.appliesTo === 'any')) {
    // sizing_kit_credit cannot apply to a sizing_kit order
    const allSizingKit = items.every((i) => i.tier === 'sizing_kit');
    if (!allSizingKit) {
      discount = Math.min(coupon.amountPaise, subtotal);
    }
  }

  const afterDiscount = subtotal - discount;

  let shipping = 0;
  if (fulfilment === 'pickup') {
    shipping = 0;
  } else {
    const allSizingKit = items.every((i) => i.tier === 'sizing_kit');
    if (allSizingKit) {
      shipping = settings.flatPaise;
    } else if (afterDiscount > settings.freeAbovePaise) {
      shipping = 0;
    } else {
      shipping = settings.flatPaise;
    }
  }

  const total = afterDiscount + shipping;
  const hasFromPrices = items.some((i) => i.priceIsFrom);

  return { subtotal, discount, shipping, total, hasFromPrices };
}
