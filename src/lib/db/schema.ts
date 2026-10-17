import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  smallint,
  timestamp,
  date,
  time,
  jsonb,
  index,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Enums (§5)
// ---------------------------------------------------------------------------

export const nailShapeEnum = pgEnum('nail_shape', [
  'square', 'squoval', 'round', 'oval', 'almond', 'coffin', 'stiletto',
]);

export const nailLengthEnum = pgEnum('nail_length', [
  'short', 'medium', 'long', 'xl',
]);

export const occasionEnum = pgEnum('occasion', [
  'everyday', 'party', 'bridal', 'festive', 'college',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'requested', 'awaiting_deposit', 'confirmed', 'completed',
  'declined', 'cancelled', 'no_show', 'expired',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'new', 'paid', 'making', 'shipped', 'delivered', 'cancelled',
]);

export const paymentPurposeEnum = pgEnum('payment_purpose', [
  'booking_deposit', 'order',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'upi', 'cash', 'other',
]);

export const pressOnTierEnum = pgEnum('press_on_tier', [
  'classic', 'signature', 'glam', 'custom', 'bridal', 'sizing_kit',
]);

export const locationTypeEnum = pgEnum('location_type', [
  'studio', 'home',
]);

export const distanceBandEnum = pgEnum('distance_band', [
  'within_4km', 'km_4_to_8', 'on_request',
]);

export const depositKindEnum = pgEnum('deposit_kind', [
  'none', 'standard', 'bridal',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending', 'approved', 'hidden',
]);

export const couponKindEnum = pgEnum('coupon_kind', [
  'sizing_kit_credit', 'referral', 'manual',
]);

export const fulfilmentEnum = pgEnum('fulfilment', [
  'ship', 'pickup',
]);

// Additional enums for columns described inline in §5
export const mediaKindEnum = pgEnum('media_kind', [
  'portfolio', 'product', 'inspiration', 'review', 'brand',
]);

export const discountSourceEnum = pgEnum('discount_source', [
  'launch_offer', 'coupon', 'none',
]);

export const reviewKindEnum = pgEnum('review_kind', [
  'in_person', 'press_on',
]);

export const reviewSourceEnum = pgEnum('review_source', [
  'admin', 'customer',
]);

export const entityKindEnum = pgEnum('entity_kind', [
  'booking', 'order', 'payment',
]);

export const sizeModeEnum = pgEnum('size_mode', [
  'per_finger', 'preset', 'later',
]);

export const couponTargetEnum = pgEnum('coupon_target', [
  'booking', 'press_on', 'any',
]);

// ---------------------------------------------------------------------------
// Tables (§5)
// ---------------------------------------------------------------------------

export const owner = pgTable('owner', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  welcomeSeenAt: timestamp('welcome_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const passwordResets = pgTable('password_resets', {
  tokenHash: text('token_hash').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const media = pgTable('media', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  url: text('url').notNull(),
  pathname: text('pathname').notNull(),
  width: integer('width'),
  height: integer('height'),
  blurDataUrl: text('blur_data_url'),
  alt: text('alt').notNull().default(''),
  kind: mediaKindEnum('kind').notNull(),
  isPlaceholder: boolean('is_placeholder').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const lookbookItems = pgTable('lookbook_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  title: text('title'),
  caption: text('caption'),
  glamLevel: smallint('glam_level').notNull(),
  shape: nailShapeEnum('shape').notNull(),
  length: nailLengthEnum('length').notNull(),
  occasions: occasionEnum('occasions').array().notNull().default(sql`ARRAY[]::occasion[]`),
  colours: text('colours').array().notNull().default(sql`ARRAY[]::text[]`),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  isPlaceholder: boolean('is_placeholder').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  suggestedServiceId: uuid('suggested_service_id'),
  pressOnTier: pressOnTierEnum('press_on_tier'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => [
  check('lookbook_items_glam_level_check', sql`${t.glamLevel} BETWEEN 1 AND 5`),
]);

export const lookbookItemMedia = pgTable('lookbook_item_media', {
  itemId: uuid('item_id').notNull(),
  mediaId: uuid('media_id').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isCover: boolean('is_cover').notNull().default(false),
}, (t) => [
  primaryKey({ columns: [t.itemId, t.mediaId] }),
]);

export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

export const services = pgTable('services', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid('category_id').notNull(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  pricePaise: integer('price_paise').notNull(),
  priceIsFrom: boolean('price_is_from').notNull().default(false),
  perNail: boolean('per_nail').notNull().default(false),
  durationMin: integer('duration_min').notNull(),
  perNailDurationMin: integer('per_nail_duration_min'),
  isAddon: boolean('is_addon').notNull().default(false),
  isNewSet: boolean('is_new_set').notNull().default(false),
  freeWithNewSet: boolean('free_with_new_set').notNull().default(false),
  isExtensionSet: boolean('is_extension_set').notNull().default(false),
  depositKind: depositKindEnum('deposit_kind').notNull().default('none'),
  minLeadDays: smallint('min_lead_days').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const availabilityRules = pgTable('availability_rules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  weekday: smallint('weekday').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isActive: boolean('is_active').notNull().default(true),
}, (t) => [
  check('availability_rules_weekday_check', sql`${t.weekday} BETWEEN 0 AND 6`),
]);

export const blockedPeriods = pgTable('blocked_periods', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  startsOn: date('starts_on').notNull(),
  endsOn: date('ends_on').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  reason: text('reason').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const homeVisitAreas = pgTable('home_visit_areas', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  band: distanceBandEnum('band').notNull(),
  travelFeePaise: integer('travel_fee_paise'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const designDrafts = pgTable('design_drafts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shape: nailShapeEnum('shape'),
  length: nailLengthEnum('length'),
  glamLevel: smallint('glam_level'),
  colours: text('colours').array().notNull().default(sql`ARRAY[]::text[]`),
  occasion: occasionEnum('occasion'),
  inspirationMediaId: uuid('inspiration_media_id'),
  notes: text('notes'),
  sourceLookbookItemId: uuid('source_lookbook_item_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ref: text('ref').notNull().unique(),
  status: bookingStatusEnum('status').notNull().default('requested'),
  customerName: text('customer_name').notNull(),
  phoneE164: text('phone_e164').notNull(),
  locationType: locationTypeEnum('location_type').notNull(),
  areaId: uuid('area_id'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  durationMin: integer('duration_min').notNull(),
  flexibleByHour: boolean('flexible_by_hour').notNull().default(false),
  subtotalPaise: integer('subtotal_paise').notNull(),
  travelFeePaise: integer('travel_fee_paise'),
  discountPaise: integer('discount_paise').notNull().default(0),
  discountSource: discountSourceEnum('discount_source').notNull().default('none'),
  couponId: uuid('coupon_id'),
  offerApplied: boolean('offer_applied').notNull().default(false),
  estimatePaise: integer('estimate_paise').notNull(),
  hasFromPrices: boolean('has_from_prices').notNull().default(false),
  finalTotalPaise: integer('final_total_paise'),
  depositPaise: integer('deposit_paise').notNull().default(0),
  depositDueBy: timestamp('deposit_due_by', { withTimezone: true }),
  inspirationMediaId: uuid('inspiration_media_id'),
  lookbookItemId: uuid('lookbook_item_id'),
  designId: uuid('design_id'),
  referredBy: text('referred_by'),
  customerNote: text('customer_note'),
  adminNote: text('admin_note'),
  rescheduleCount: smallint('reschedule_count').notNull().default(0),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  depositForfeited: boolean('deposit_forfeited').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => [
  index('bookings_status_starts_at_idx').on(t.status, t.startsAt),
  index('bookings_phone_e164_idx').on(t.phoneE164),
]);

export const bookingItems = pgTable('booking_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid('booking_id').notNull(),
  serviceId: uuid('service_id'),
  nameSnapshot: text('name_snapshot').notNull(),
  unitPricePaise: integer('unit_price_paise').notNull(),
  quantity: integer('quantity').notNull().default(1),
  lineTotalPaise: integer('line_total_paise').notNull(),
  priceIsFrom: boolean('price_is_from').notNull().default(false),
  note: text('note'),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tier: pressOnTierEnum('tier').notNull(),
  description: text('description'),
  pricePaise: integer('price_paise').notNull(),
  priceIsFrom: boolean('price_is_from').notNull().default(false),
  shapesAllowed: nailShapeEnum('shapes_allowed').array().notNull().default(sql`ARRAY[]::nail_shape[]`),
  lengthsAllowed: nailLengthEnum('lengths_allowed').array().notNull().default(sql`ARRAY[]::nail_length[]`),
  needsSizing: boolean('needs_sizing').notNull().default(true),
  leadMinDays: integer('lead_min_days'),
  leadMaxDays: integer('lead_max_days'),
  isActive: boolean('is_active').notNull().default(true),
  isPlaceholder: boolean('is_placeholder').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const productMedia = pgTable('product_media', {
  productId: uuid('product_id').notNull(),
  mediaId: uuid('media_id').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isCover: boolean('is_cover').notNull().default(false),
}, (t) => [
  primaryKey({ columns: [t.productId, t.mediaId] }),
]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ref: text('ref').notNull().unique(),
  status: orderStatusEnum('status').notNull().default('new'),
  customerName: text('customer_name').notNull(),
  phoneE164: text('phone_e164').notNull(),
  fulfilment: fulfilmentEnum('fulfilment').notNull(),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  landmark: text('landmark'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  subtotalPaise: integer('subtotal_paise').notNull(),
  discountPaise: integer('discount_paise').notNull().default(0),
  couponId: uuid('coupon_id'),
  shippingPaise: integer('shipping_paise').notNull().default(0),
  totalPaise: integer('total_paise').notNull(),
  leadMinDays: integer('lead_min_days').notNull(),
  leadMaxDays: integer('lead_max_days').notNull(),
  sizesPending: boolean('sizes_pending').notNull().default(false),
  courier: text('courier'),
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  adminNote: text('admin_note'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  makingAt: timestamp('making_at', { withTimezone: true }),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => [
  index('orders_status_created_at_idx').on(t.status, t.createdAt),
  index('orders_phone_e164_idx').on(t.phoneE164),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull(),
  productId: uuid('product_id'),
  nameSnapshot: text('name_snapshot').notNull(),
  tier: pressOnTierEnum('tier').notNull(),
  unitPricePaise: integer('unit_price_paise').notNull(),
  quantity: integer('quantity').notNull().default(1),
  shape: nailShapeEnum('shape'),
  length: nailLengthEnum('length'),
  sizeMode: sizeModeEnum('size_mode').notNull().default('later'),
  sizes: jsonb('sizes'),
  designId: uuid('design_id'),
  lookbookItemId: uuid('lookbook_item_id'),
  note: text('note'),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  purpose: paymentPurposeEnum('purpose').notNull(),
  bookingId: uuid('booking_id'),
  orderId: uuid('order_id'),
  amountPaise: integer('amount_paise').notNull(),
  method: paymentMethodEnum('method').notNull(),
  reference: text('reference'),
  note: text('note'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().default(sql`now()`),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  refundNote: text('refund_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => [
  check(
    'payments_exactly_one_ref',
    sql`(${t.bookingId} IS NULL) != (${t.orderId} IS NULL)`,
  ),
  index('payments_reference_notnull_idx')
    .on(t.reference)
    .where(sql`${t.reference} IS NOT NULL`),
]);

export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').notNull().unique(),
  kind: couponKindEnum('kind').notNull(),
  amountPaise: integer('amount_paise').notNull(),
  phoneE164: text('phone_e164'),
  appliesTo: couponTargetEnum('applies_to').notNull().default('any'),
  maxUses: integer('max_uses').notNull().default(1),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  sourceOrderId: uuid('source_order_id'),
  sourceBookingId: uuid('source_booking_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const couponRedemptions = pgTable('coupon_redemptions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  couponId: uuid('coupon_id').notNull(),
  bookingId: uuid('booking_id'),
  orderId: uuid('order_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  customerName: text('customer_name').notNull(),
  body: text('body').notNull(),
  rating: smallint('rating'),
  kind: reviewKindEnum('kind').notNull(),
  mediaId: uuid('media_id'),
  bookingId: uuid('booking_id'),
  orderId: uuid('order_id'),
  status: reviewStatusEnum('status').notNull().default('pending'),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPlaceholder: boolean('is_placeholder').notNull().default(false),
  source: reviewSourceEnum('source').notNull().default('customer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const faqs = pgTable('faqs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  category: text('category').notNull().default(''),
  question: text('question').notNull(),
  answerMd: text('answer_md').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
});

export const pages = pgTable('pages', {
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  bodyMd: text('body_md').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const statusEvents = pgTable('status_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  entity: entityKindEnum('entity').notNull(),
  entityId: uuid('entity_id').notNull(),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const rateLimits = pgTable('rate_limits', {
  key: text('key').notNull(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  count: integer('count').notNull().default(1),
}, (t) => [
  primaryKey({ columns: [t.key, t.windowStart] }),
]);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Owner = typeof owner.$inferSelect;
export type NewOwner = typeof owner.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Media = typeof media.$inferSelect;
export type LookbookItem = typeof lookbookItems.$inferSelect;
export type LookbookItemMedia = typeof lookbookItemMedia.$inferSelect;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type Service = typeof services.$inferSelect;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type BlockedPeriod = typeof blockedPeriods.$inferSelect;
export type HomeVisitArea = typeof homeVisitAreas.$inferSelect;
export type DesignDraft = typeof designDrafts.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookingItem = typeof bookingItems.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type StatusEvent = typeof statusEvents.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
