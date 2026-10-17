import { z } from 'zod';

type SettingDef<T> = {
  schema: z.ZodType<T>;
  default: T;
  public: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySettingDef = SettingDef<any>;

export const REGISTRY: Record<string, AnySettingDef> = {
  'site.go_live': {
    schema: z.boolean(),
    default: false,
    public: true,
  },
  'site.launch_checklist': {
    schema: z.object({ testBookingDone: z.boolean(), testOrderDone: z.boolean() }),
    default: { testBookingDone: false, testOrderDone: false },
    public: false,
  },
  'brand.logo_media_id': {
    schema: z.string().uuid().nullable(),
    default: null,
    public: true,
  },
  'brand.monogram_media_id': {
    schema: z.string().uuid().nullable(),
    default: null,
    public: true,
  },
  'contact.whatsapp_e164': {
    schema: z.string(),
    default: '+919241099696',
    public: true,
  },
  'contact.whatsapp_wa': {
    schema: z.string(),
    default: '919241099696',
    public: true,
  },
  'contact.instagram_url': {
    schema: z.string().url(),
    default: 'https://www.instagram.com/clawsby_d/',
    public: true,
  },
  'contact.public_location': {
    schema: z.string(),
    default: 'Hindpiri, Ranchi',
    public: true,
  },
  'contact.owner_notify_email': {
    schema: z.union([z.string().email(), z.literal('')]),
    default: '',
    public: false,
  },
  // ⚠ private.* keys are NEVER public — the allow-list in read.ts enforces this
  'private.studio_address': {
    schema: z.string(),
    default: '',
    public: false,
  },
  'private.studio_directions': {
    schema: z.string(),
    default: '',
    public: false,
  },
  'private.pickup_point': {
    schema: z.string(),
    default: '',
    public: false,
  },
  'payments.upi_id': {
    schema: z.string(),
    default: 'daudshaima111@oksbi',
    public: false,
  },
  'payments.instructions': {
    schema: z.string(),
    default:
      'Please pay {amount} to UPI ID {upiId} with {ref} in the note, then send me the screenshot here.',
    public: false,
  },
  'deposits.standard_paise': {
    schema: z.number().int().positive(),
    default: 20000,
    public: true,
  },
  'deposits.bridal_paise': {
    schema: z.number().int().positive(),
    default: 50000,
    public: true,
  },
  'deposits.hold_hours': {
    schema: z.number().int().positive(),
    default: 12,
    public: true,
  },
  'home_visit.min_booking_paise': {
    schema: z.number().int().nonnegative(),
    default: 99900,
    public: true,
  },
  'home_visit.window': {
    schema: z.object({ start: z.string(), end: z.string() }),
    default: { start: '10:00', end: '18:00' },
    public: true,
  },
  'home_visit.travel_buffer_min': {
    schema: z.number().int().nonnegative(),
    default: 30,
    public: false,
  },
  'home_visit.band_fees': {
    schema: z.object({ within_4km: z.number().int(), km_4_to_8: z.number().int() }),
    default: { within_4km: 10000, km_4_to_8: 20000 },
    public: true,
  },
  'home_visit.note': {
    schema: z.string(),
    default: 'Home visits are for women clients only, between 10 AM and 6 PM.',
    public: true,
  },
  'booking.slot_step_min': {
    schema: z.number().int().positive(),
    default: 30,
    public: false,
  },
  'booking.min_notice_hours': {
    schema: z.number().int().nonnegative(),
    default: 12,
    public: true,
  },
  'booking.max_advance_days': {
    schema: z.number().int().positive(),
    default: 45,
    public: true,
  },
  'booking.bridal_min_lead_days': {
    schema: z.number().int().positive(),
    default: 14,
    public: true,
  },
  'press_on.lead_days': {
    schema: z.object({ min: z.number().int(), max: z.number().int() }),
    default: { min: 5, max: 7 },
    public: true,
  },
  'press_on.exam_mode': {
    schema: z.boolean(),
    default: false,
    public: true,
  },
  'press_on.exam_lead_days': {
    schema: z.object({ min: z.number().int(), max: z.number().int() }),
    default: { min: 10, max: 14 },
    public: true,
  },
  'press_on.exam_note': {
    schema: z.string(),
    default:
      "It's exam season, so press-ons are taking 10–14 days right now. Thank you for waiting for them.",
    public: true,
  },
  'shipping.flat_paise': {
    schema: z.number().int().nonnegative(),
    default: 7900,
    public: true,
  },
  'shipping.free_above_paise': {
    schema: z.number().int().nonnegative(),
    default: 149900,
    public: true,
  },
  'shipping.pickup_enabled': {
    schema: z.boolean(),
    default: true,
    public: true,
  },
  'shipping.pickup_pincode_prefixes': {
    schema: z.array(z.string()),
    default: ['834'],
    public: true,
  },
  'orders.unpaid_expiry_hours': {
    schema: z.number().int().positive(),
    default: 48,
    public: true,
  },
  'offers.launch': {
    schema: z.object({
      enabled: z.boolean(),
      amount_paise: z.number().int(),
      total: z.number().int(),
      spots_left: z.number().int(),
    }),
    default: { enabled: true, amount_paise: 20000, total: 25, spots_left: 25 },
    public: true,
  },
  'offers.referral_paise': {
    schema: z.number().int().nonnegative(),
    default: 10000,
    public: true,
  },
  'offers.sizing_kit_credit_paise': {
    schema: z.number().int().nonnegative(),
    default: 14900,
    public: true,
  },
  'messages.sign_off': {
    schema: z.string(),
    default: '— D',
    public: false,
  },
  'sizing.chart': {
    schema: z.record(z.string(), z.number()),
    default: {
      '0': 18, '1': 17, '2': 16, '3': 15, '4': 14,
      '5': 13, '6': 12, '7': 11, '8': 10, '9': 9, '10': 8, '11': 7,
    },
    public: true,
  },
  'sizing.presets': {
    schema: z.record(
      z.string(),
      z.object({
        thumb: z.number(), index: z.number(), middle: z.number(),
        ring: z.number(), pinky: z.number(),
      }),
    ),
    default: {
      S: { thumb: 3, index: 6, middle: 5, ring: 7, pinky: 9 },
      M: { thumb: 2, index: 5, middle: 4, ring: 6, pinky: 8 },
      L: { thumb: 1, index: 4, middle: 3, ring: 5, pinky: 7 },
    },
    public: true,
  },
  'social.links': {
    schema: z.array(z.object({ label: z.string(), url: z.string().url() })),
    default: [{ label: 'Instagram', url: 'https://www.instagram.com/clawsby_d/' }],
    public: true,
  },
};

export const PUBLIC_KEYS = new Set(
  Object.entries(REGISTRY)
    .filter(([, def]) => def.public)
    .map(([key]) => key),
);

export type SettingKey = keyof typeof REGISTRY;

export function getDefault<K extends SettingKey>(key: K): (typeof REGISTRY)[K]['default'] {
  return REGISTRY[key]!.default;
}

export function validateSetting(key: string, value: unknown): unknown {
  const def = REGISTRY[key];
  if (!def) throw new Error(`Unknown setting key: ${key}`);
  return def.schema.parse(value);
}
