import { describe, it, expect } from 'vitest';
import { priceOrder, type OrderItem, type ShippingSettings } from '@/lib/domain/shipping';
import { getLeadTime, type LeadTimeSettings } from '@/lib/domain/leadtime';

const SETTINGS: ShippingSettings = {
  flatPaise: 7900,
  freeAbovePaise: 149900,
  pickupEnabled: true,
};

function item(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    pricePaise: 69900,
    priceIsFrom: false,
    quantity: 1,
    tier: 'classic',
    ...overrides,
  };
}

describe('priceOrder', () => {
  it('ship with subtotal below free threshold → flat shipping', () => {
    const r = priceOrder([item({ pricePaise: 69900 })], null, 'ship', SETTINGS);
    expect(r.subtotal).toBe(69900);
    expect(r.shipping).toBe(7900);
    expect(r.total).toBe(77800);
  });

  it('ship with subtotal exactly ₹1,499 → NOT free (strictly greater required)', () => {
    const r = priceOrder([item({ pricePaise: 149900 })], null, 'ship', SETTINGS);
    expect(r.shipping).toBe(7900);
  });

  it('ship with subtotal above ₹1,499 → free shipping', () => {
    const r = priceOrder([item({ pricePaise: 150000 })], null, 'ship', SETTINGS);
    expect(r.shipping).toBe(0);
    expect(r.total).toBe(150000);
  });

  it('pickup → no shipping', () => {
    const r = priceOrder([item({ pricePaise: 69900 })], null, 'pickup', SETTINGS);
    expect(r.shipping).toBe(0);
    expect(r.total).toBe(69900);
  });

  it('coupon reduces subtotal before shipping threshold', () => {
    // 160000 - 20000 = 140000 → still below threshold → pay shipping
    const r = priceOrder(
      [item({ pricePaise: 160000 })],
      { amountPaise: 20000, appliesTo: 'any' },
      'ship',
      SETTINGS,
    );
    expect(r.discount).toBe(20000);
    expect(r.shipping).toBe(7900);
    expect(r.total).toBe(147900);
  });

  it('coupon brings subtotal above free threshold → free shipping', () => {
    // 200000 - 10000 = 190000 > 149900 → free
    const r = priceOrder(
      [item({ pricePaise: 200000 })],
      { amountPaise: 10000, appliesTo: 'press_on' },
      'ship',
      SETTINGS,
    );
    expect(r.shipping).toBe(0);
  });

  it('sizing_kit_credit coupon does not apply to sizing_kit only order', () => {
    const r = priceOrder(
      [item({ tier: 'sizing_kit', pricePaise: 14900 })],
      { amountPaise: 14900, appliesTo: 'any' },
      'ship',
      SETTINGS,
    );
    // All items are sizing_kit → coupon not applied
    expect(r.discount).toBe(0);
    expect(r.shipping).toBe(7900); // sizing-kit-only pays shipping
  });

  it('sizing-kit-only order always pays flat shipping', () => {
    const r = priceOrder(
      [item({ tier: 'sizing_kit', pricePaise: 14900 })],
      null,
      'ship',
      SETTINGS,
    );
    expect(r.shipping).toBe(7900);
  });

  it('multiple items', () => {
    const r = priceOrder(
      [item({ pricePaise: 69900, quantity: 2 })],
      null,
      'ship',
      SETTINGS,
    );
    expect(r.subtotal).toBe(139800);
    expect(r.shipping).toBe(7900);
    expect(r.total).toBe(147700);
  });

  it('coupon applies_to booking — ignored for orders', () => {
    const r = priceOrder(
      [item({ pricePaise: 69900 })],
      { amountPaise: 20000, appliesTo: 'booking' },
      'ship',
      SETTINGS,
    );
    expect(r.discount).toBe(0);
  });

  it('hasFromPrices propagated', () => {
    const r = priceOrder([item({ priceIsFrom: true })], null, 'ship', SETTINGS);
    expect(r.hasFromPrices).toBe(true);
  });
});

describe('getLeadTime', () => {
  const BASE: LeadTimeSettings = {
    pressOnLeadDays: { min: 5, max: 7 },
    examMode: false,
    examLeadDays: { min: 10, max: 14 },
  };

  it('global lead time when no item overrides', () => {
    expect(getLeadTime([], BASE)).toEqual({ min: 5, max: 7 });
  });

  it('exam mode overrides everything', () => {
    expect(getLeadTime([], { ...BASE, examMode: true })).toEqual({ min: 10, max: 14 });
  });

  it('item with longer lead time overrides global', () => {
    expect(getLeadTime([{ leadMinDays: 7, leadMaxDays: 10 }], BASE)).toEqual({ min: 7, max: 10 });
  });

  it('max over multiple items', () => {
    expect(
      getLeadTime([{ leadMinDays: 6, leadMaxDays: 9 }, { leadMinDays: 7, leadMaxDays: 10 }], BASE),
    ).toEqual({ min: 7, max: 10 });
  });

  it('item with null override uses global', () => {
    expect(getLeadTime([{ leadMinDays: null, leadMaxDays: null }], BASE)).toEqual({ min: 5, max: 7 });
  });

  it('exam mode ignores item overrides', () => {
    expect(
      getLeadTime([{ leadMinDays: 3, leadMaxDays: 4 }], { ...BASE, examMode: true }),
    ).toEqual({ min: 10, max: 14 });
  });
});
