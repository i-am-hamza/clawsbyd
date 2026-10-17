# Claws by D — Build Spec

Source of truth for the build. Session prompts in claude/clawsbyd.md point at
sections here by number (e.g. "SPEC §7.1"). Every price, policy and number below is a
starting value, editable from the admin panel, unless marked "fixed".

---

## 1. Product in one page

- **Business:** Claws by D (@clawsby_d). Nail artist in Hindpiri, Ranchi, who is also a
  fashion technology student. Works around classes and exams.
- **Revenue streams:** (1) in-person sets at her home studio in Hindpiri plus home
  visits within ~8 km, (2) custom press-ons made to order and shipped across India.
- **Customers:** young women and college students in Ranchi (in person), anyone in
  India (press-ons). Almost all arrive on a phone from her Instagram bio link, often
  on mobile data and budget Android phones (360px-wide viewports are common).
- **Brand:** her range runs from soft and dainty to bold and glam. The range is the brand.
- **Channel:** WhatsApp. Every key flow saves to the database AND ends with a pre-filled
  wa.me message. The database is the source of truth, because many customers won't
  press Send.
- **Payments:** none on the site. Deposits and press-on payments happen on WhatsApp
  (she sends her UPI details); she records each payment in the admin.
- **Owner:** one person, one login, phone-first admin.

---

## 2. Assumptions (made so the build doesn't stall — each is reversible)

| # | Assumption | Why |
|---|---|---|
| A1 | Database is **Neon Postgres via the Vercel Marketplace**, ORM **Drizzle**. | One-click from Vercel, env vars injected, branch per preview/test, typed schema in TS. No user accounts means Supabase RLS buys nothing here. |
| A2 | Use a driver that supports **interactive transactions** (Neon `Pool` via `drizzle-orm/neon-serverless`, or node-postgres on the pooled URL). Not `neon-http`. | Offer counter, status transitions and recording payments need transactions. |
| A3 | **The deposit is requested after she approves**, in her approval message on WhatsApp. Approval holds the slot for 12 h (`deposits.hold_hours`). | Asking before approval means refunds whenever she declines. |
| A4 | For bookings that need a deposit, **her exact address is sent only after she marks the deposit received**, not at approval. Bookings with no deposit get the address at approval. | Nobody gets her home address without a commitment. |
| A5 | Customers pick a **specific start time**, shown grouped under Morning / Afternoon / Evening, with an optional "I'm flexible by an hour" tick. | Precise slots make availability work; the grouping keeps the "time window" feel. |
| A6 | Requested (unapproved) bookings **do not block** slots. Approved-awaiting-deposit and confirmed bookings do. Admin is warned about overlapping requests. | Spam requests can't fill her calendar. |
| A7 | Service durations (not in the brief) are seeded in §16.1 and editable. | Slots need durations. |
| A8 | Home-visit minimum ₹999 applies to the **services subtotal after free removal, before discounts, excluding travel**. | Most natural reading. |
| A9 | Home-visit appointments must **start at or after 10:00 and finish by 18:00**, with a 30-min travel buffer either side (`home_visit.travel_buffer_min`). | "Between 10 AM and 6 PM". |
| A10 | One deposit per booking: bridal → ₹500, else extension set or home visit → ₹200, else none. | Avoids stacking. |
| A11 | **One discount per booking or order.** If several apply, the larger wins automatically. Launch offer: once per phone number. | Simple and fair. |
| A12 | Launch-offer counter **decrements when an offer booking becomes confirmed**, increments back if she cancels it, never on a no-show. She can override the number. | "First 25 clients" means clients who actually booked. |
| A13 | Referral is **admin-assisted**: booking form has an optional "Referred by" field; on completion she taps "Give referral credit", which issues two ₹100 single-use codes bound to each phone. Codes work on bookings and press-ons. | No accounts to hang automatic referrals on. |
| A14 | Sizing-kit credit: when a sizing-kit order is marked paid, a ₹149 code bound to that phone is issued, valid once on a press-on set. | "Comes back as a coupon on the first set." |
| A15 | Free shipping when the **order subtotal after discount is above ₹1,499** (strictly greater). Pickup in Hindpiri is offered to everyone but labelled "for Ranchi customers"; pincodes starting `834` are suggested pickup. | Brief says "above ₹1,499". |
| A16 | Unpaid press-on orders auto-cancel after 48 h (`orders.unpaid_expiry_hours`). Expired holds/orders are computed lazily on read and swept by a daily cron. | Vercel crons are limited; lazy evaluation keeps it correct. |
| A17 | WhatsApp message templates live in code; the policy lines and sign-off inside them come from settings. Editable templates are Phase 2. | Keeps her from breaking a variable on launch week. |
| A18 | No customer emails in Phase 1. Email (Resend) is only for notifying her. | WhatsApp is the customer channel. |
| A19 | One theme per design direction, no dark-mode toggle. | Halves design QA; a photo site needs one excellent theme, not two. |
| A20 | Pincode → city/state lookup is not used; customers type city and pick state. | External pincode APIs are unreliable. |
| A21 | Lookbook items can have several photos (Instagram carousels). | Matches how she posts. |
| A22 | "From" prices: totals show "Estimated total, from ₹X". She records the final bill on completion. Deposit amounts are fixed. | Brief uses "from" prices. |
| A23 | **Two Blob stores.** Public `clawsbyd-media` (portfolio, products, brand, review photos; `BLOB_READ_WRITE_TOKEN`) and private `clawsbyd-private` (customer inspiration uploads; `PRIVATE_BLOB_READ_WRITE_TOKEN`). Private blobs are shown only in the admin through an authenticated route that streams them — never via next/image or a public URL. | Inspiration photos may show the customer's hands, face or home. |
| A24 | **The site takes no payments.** No payment buttons, UPI links, QR codes, transaction-ID forms or gateways. Her WhatsApp messages tell customers how to pay (UPI ID from settings, ref as the note); she records each payment in the admin. | Removes the least reliable part of the build; payment conversations already happen on WhatsApp. |

---

## 3. Architecture

### 3.1 Stack
Next.js 16 (App Router, React 19.2, Turbopack) · TypeScript strict · Tailwind v4 ·
Drizzle ORM + drizzle-kit · Neon Postgres · Vercel Blob · Resend + React Email ·
zod · @date-fns/tz · browser-image-compression (or canvas) ·
@node-rs/argon2 · Vitest · Playwright · pnpm.

### 3.2 Request flow
```
phone ──> Vercel ──> src/proxy.ts
                      ├─ /admin/*   → session cookie present? else /admin/login
                      ├─ go_live=false and no preview cookie → /preview
                      └─ add X-Robots-Tag: noindex while not live
          Server Components ──> src/lib/db/queries/* ──> Neon
          Server Actions ──> zod ──> rate limit ──> domain/* ──> db (transaction)
                                    └─> email (Resend, non-blocking)
                                    └─> returns WhatsApp deep link for the UI
          Client uploads ──> compress+strip EXIF in browser ──> /api/blob/upload (token) ──> Vercel Blob
```

### 3.3 Repo layout
```
CLAUDE.md
docs/SPEC.md
claude/clawsbyd.md            ← session prompts (not app code)
design/instagram/             ← her Instagram screenshots (reference only)
seed/looks/                   ← optional real photos + looks.csv for the seed
drizzle/                      ← migrations
scripts/
  seed.ts                     ← idempotent seed
  owner-set-password.ts       ← prompts, hashes (argon2id), writes owner row
  welcome-arm.ts              ← sets owner.welcome_seen_at = null
src/
  proxy.ts
  app/
    (site)/                   ← public chrome (header, footer, floating WhatsApp)
      page.tsx                         Home
      lookbook/page.tsx                Lookbook
      lookbook/[slug]/page.tsx         Look detail
      services/page.tsx
      book/page.tsx, book/done/page.tsx
      build/page.tsx                   Build Your Set
      shop/page.tsx, shop/[slug]/page.tsx, shop/custom/page.tsx
      cart/page.tsx, checkout/page.tsx
      sizing-guide/page.tsx, care-guide/page.tsx
      about/page.tsx, faq/page.tsx, policies/[slug]/page.tsx
      status/page.tsx                  lookup form (ref + phone)
      s/[ref]/page.tsx                 status page (signed link)
      review/[ref]/page.tsx            leave a review (signed link)
    preview/page.tsx                   preview password gate
    admin/
      login, forgot, reset, welcome
      (shell)/page.tsx                 dashboard
      (shell)/bookings, bookings/[id]
      (shell)/orders, orders/[id]
      (shell)/payments                 payments log
      (shell)/calendar
      (shell)/lookbook, lookbook/[id]
      (shell)/services, (shell)/shop, shop/[id]
      (shell)/availability, (shell)/areas
      (shell)/reviews, (shell)/content, (shell)/settings
    api/blob/upload/route.ts           client-upload token route
    api/cron/daily/route.ts            CRON_SECRET-protected
    robots.ts, sitemap.ts, manifest.ts
  components/{ui,brand,site,lookbook,booking,build,shop,admin}/
  content/copy.ts, content/welcome-note.ts (frozen)
  lib/
    db/{client.ts,schema.ts,queries/}
    domain/{pricing.ts,slots.ts,offers.ts,shipping.ts,leadtime.ts,status.ts,refs.ts,mapping.ts,payments.ts}
    whatsapp/{templates.ts,link.ts}
    email/{send.ts,templates/}
    auth/{password.ts,session.ts,require-owner.ts}
    settings/{registry.ts,read.ts}
    images/{compress.ts,blur.ts}
    validation/{phone.ts,pincode.ts,schemas.ts}
    format/{inr.ts,dates.ts}
    rate-limit.ts, nail-svg.ts, signed-link.ts
  styles/tokens.css
tests/unit/, tests/e2e/
```

### 3.4 Environment variables
| Var | Notes |
|---|---|
| `DATABASE_URL` | Neon pooled (injected by the Marketplace integration) |
| `DATABASE_URL_UNPOOLED` | migrations |
| `DATABASE_URL_TEST` | separate Neon branch for e2e |
| `BLOB_READ_WRITE_TOKEN` | public store `clawsbyd-media` |
| `PRIVATE_BLOB_READ_WRITE_TOKEN` | private store `clawsbyd-private` (customer inspiration uploads) |
| `RESEND_API_KEY` | |
| `EMAIL_FROM` | e.g. `Claws by D <bookings@send.clawsbyd.one-sentient.one>` |
| `SESSION_SECRET` | 32+ random bytes |
| `SIGNED_LINK_SECRET` | 32+ random bytes, for `/s/[ref]?k=` and `/review/[ref]?k=` |
| `PREVIEW_PASSWORD` | the pre-launch password |
| `CRON_SECRET` | |
| `NEXT_PUBLIC_SITE_URL` | `https://clawsbyd.one-sentient.one` in production |

Never put a secret behind `NEXT_PUBLIC_`.

**Function region: `sin1` (Singapore)**, the same region as the Neon database. Set it in
Vercel → Settings → Functions and in `vercel.json` (`"regions": ["sin1"]`). Vercel's default
is Washington (`iad1`), which would add a round trip across the world to every query.

### 3.5 Auth (one owner)
- `owner` table, single row. Password hashed with argon2id, set via
  `pnpm owner:set-password` (interactive prompt, never a CLI argument, never in env).
- DB-backed sessions: random 32-byte token in an httpOnly, Secure, SameSite=Lax cookie;
  only its SHA-256 is stored. 30-day sliding expiry. "Sign out everywhere" deletes all rows.
- Login rate limit: 5 attempts / 15 min / IP, 20 / hour global.
- Forgot password: emails a one-time reset link (30 min) to `owner.email` via Resend.
- `requireOwner()` runs in the admin layout AND at the top of every admin server action
  and admin route handler.

### 3.6 Rate limiting
Postgres table `rate_limits` (key, window_start, count). Limits: booking submit 5/h/IP,
order submit 5/h/IP, status lookup 20/h/IP, review submit 3/day/ref,
upload token 30/h/IP, preview password 10/15min/IP. Honeypot field on every public form.

### 3.7 Signed links
`k = base64url(HMAC-SHA256(ref, SIGNED_LINK_SECRET)).slice(0, 22)`. `/s/[ref]?k=` opens
the status page without asking for the phone. `/status` is the fallback form
(ref + phone, last 10 digits must match).

### 3.8 References
`CBD-B-XXXX` (bookings), `CBD-P-XXXX` (press-on orders). XXXX = 4 chars of Crockford
base32 without I, L, O, U. Retry on collision. Customers are asked to put the ref in their payment note.

---

## 4. Design

### 4.1 Before designing
Read every image in `design/instagram/`. Sample her dominant colours, backgrounds and
the mood of her strongest posts, and adjust the palettes below toward what is actually
there. Report what you changed and why. If the folder is empty, use the palettes as
written and say so.

### 4.2 Direction A — "Lookbook" (chosen)
**Idea:** a fashion lookbook crossed with a garment tech pack — her vernacular as a
fashion-technology student. Her photos are the hero. Structure borrows from tech packs:
spec chips with a nail-shape glyph, colour swatches with names, a sizing guide that
reads like a real spec sheet.

| Token | Hex | Use |
|---|---|---|
| `--milk` | #FAF6F7 | page ground (warm-cool milky gel white — not cream; 16.7:1 on ink) |
| `--porcelain` | #F3E9EC | secondary surface |
| `--ink` | #2B0D16 | text (oxblood-black, 16.7:1 on milk) |
| `--ink-muted` | #6B5560 | secondary text (6.4:1 on milk) |
| `--blush` | #F0C0CB | surfaces and chips only, never text |
| `--accent-dainty` | #A3405A | accent at the dainty end (5.75:1 on milk, white on it 6.1:1) |
| `--accent-glam` | #851230 | accent at the glam end (9.2:1 on milk, white on it 9.8:1) |
| `--chrome` | gradient #EEF0F3 → #A3A9B3 | glam-end slider track and badges only |

Type: **Bodoni Moda** (variable, `opsz` + `wght` 400–900, italics) for display;
**Instrument Sans** (variable `wdth`, `wght`) for body and UI. The one bold move: the
wordmark and section headings change weight with the Dainty ↔ Glam slider — hairline
400 at dainty, fat-face 900 at glam.
Layout: left-aligned, editorial, photo-led. Lookbook is an uneven two-column grid of
4:5 images on mobile, three columns on desktop. Generous whitespace, large type, quiet UI.

### 4.3 Direction B — "Lacquer"
Not chosen.

### 4.4 Recommendation
A by default: everyday and dainty sets are the volume for college clients and look
truest on a light ground; light pages hold up in daylight on budget phones; Bodoni and
the tech-pack details tie straight to her fashion background. Choose B if her grid is
mostly glam work shot on dark backdrops. Build both as a `/design-preview` page in
session 1; Abraham picks; the loser is deleted.

### 4.5 Shared token rules (both directions)
- Radii: 4px chips, 12px inputs, 20px cards, full pills. Spacing on a 4px scale.
- Motion: 240ms, `cubic-bezier(.32,.72,0,1)`. One orchestrated moment only — the slider.
  No fade-up-on-scroll for every section. Respect reduced motion (slider still filters,
  colour and weight snap instead of animating).
- Set `color-scheme` explicitly to the direction's single theme.
- Avoid: ALL-CAPS eyebrow labels, accent-one-word headlines, numbered markers on
  things that aren't sequences, "→" glued onto every link.

### 4.6 Mood shift (Lookbook slider)
- One CSS custom property `--mood` (0 → 1) on the lookbook `<main>`, set from the slider.
- Accent: `color-mix(in oklch, var(--accent-dainty), var(--accent-glam) calc(var(--mood) * 100%))`.
  Every intermediate value is AA (checked: 5.75 → 8.77 on milk for A).
- Display weight: `font-variation-settings: "wght" calc(400 + var(--mood) * 500)`.
- Only CSS variables change on drag. No React re-render of the image grid per frame —
  filtering runs on a debounced value (120ms).
- Fallback where `color-mix` isn't supported: the static accent of the nearest end.

### 4.7 Brand marks (placeholders, swappable)
- Wordmark "Claws by D" in the chosen display font.
- Monogram: a "D" inside an almond nail silhouette (reuses `nail-svg.ts`). Favicon,
  apple-touch icon, admin header, manifest icons.
- Settings → Brand lets her upload her own logo and monogram (SVG or PNG); uploaded
  files replace the placeholders everywhere, including favicon and OG images.

---

## 5. Database schema (Drizzle, Postgres)

Conventions: `id uuid pk default gen_random_uuid()`, `created_at`/`updated_at
timestamptz default now()`, money `integer` paise, enums as pg enums.

**Enums**
```
nail_shape:     square | squoval | round | oval | almond | coffin | stiletto
nail_length:    short | medium | long | xl
occasion:       everyday | party | bridal | festive | college
booking_status: requested | awaiting_deposit | confirmed | completed | declined | cancelled | no_show | expired
order_status:   new | paid | making | shipped | delivered | cancelled
payment_purpose: booking_deposit | order
payment_method: upi | cash | other
press_on_tier:  classic | signature | glam | custom | bridal | sizing_kit
location_type:  studio | home
distance_band:  within_4km | km_4_to_8 | on_request
deposit_kind:   none | standard | bridal
review_status:  pending | approved | hidden
coupon_kind:    sizing_kit_credit | referral | manual
fulfilment:     ship | pickup
```

**owner** — id, email, password_hash, welcome_seen_at (null = armed), created_at, updated_at
**sessions** — id, token_hash unique, expires_at, user_agent, created_at
**password_resets** — token_hash pk, expires_at, used_at
**settings** — key text pk, value jsonb, updated_at (validated by registry, §6)
**media** — id, url, pathname, width, height, blur_data_url, alt, kind
  (`portfolio|product|inspiration|review|brand`), is_placeholder, created_at
**lookbook_items** — id, slug unique, title, caption, glam_level smallint 1–5 (check),
  shape nail_shape, length nail_length, occasions occasion[], colours text[],
  is_featured, is_published, is_placeholder, sort_order, suggested_service_id (fk, null),
  press_on_tier (null = derive), published_at, created_at, updated_at
**lookbook_item_media** — item_id, media_id, sort_order, is_cover (pk item_id+media_id)
**service_categories** — id, slug, name, description, sort_order, is_active
**services** — id, category_id, slug unique, name, description, price_paise,
  price_is_from bool, per_nail bool, duration_min, per_nail_duration_min,
  is_addon bool, is_new_set bool, free_with_new_set bool, is_extension_set bool,
  deposit_kind, min_lead_days smallint default 0, is_active, sort_order
**availability_rules** — id, weekday smallint 0–6 (0 = Sunday), start_time time,
  end_time time, is_active
**blocked_periods** — id, starts_on date, ends_on date, start_time time null,
  end_time time null (null = whole day), reason, created_at
**home_visit_areas** — id, name, band distance_band, travel_fee_paise (null when
  on_request), is_active, sort_order
**design_drafts** — id, shape, length, glam_level, colours text[], occasion,
  inspiration_media_id, notes, source_lookbook_item_id, created_at
**bookings** — id, ref unique, status, customer_name, phone_e164, location_type,
  area_id, starts_at, ends_at, duration_min, flexible_by_hour bool,
  subtotal_paise, travel_fee_paise (null = on request), discount_paise,
  discount_source (`launch_offer|coupon|none`), coupon_id, offer_applied bool,
  estimate_paise, has_from_prices bool, final_total_paise, deposit_paise,
  deposit_due_by, inspiration_media_id, lookbook_item_id, design_id,
  referred_by text, customer_note, admin_note, reschedule_count smallint,
  approved_at, confirmed_at, completed_at, cancelled_at, deposit_forfeited bool,
  created_at, updated_at
  indexes: (status, starts_at), (phone_e164)
**booking_items** — id, booking_id, service_id, name_snapshot, unit_price_paise,
  quantity, line_total_paise, price_is_from, note (e.g. "Free with your new set")
**products** — id, slug unique, name, tier, description, price_paise, price_is_from,
  shapes_allowed nail_shape[], lengths_allowed nail_length[], needs_sizing bool,
  lead_min_days, lead_max_days (null = global), is_active, is_placeholder, sort_order
**product_media** — product_id, media_id, sort_order, is_cover
**orders** — id, ref unique, status, customer_name, phone_e164, fulfilment,
  address_line1, address_line2, landmark, city, state, pincode,
  subtotal_paise, discount_paise, coupon_id, shipping_paise, total_paise,
  lead_min_days, lead_max_days (snapshots), sizes_pending bool,
  courier, tracking_number, tracking_url, admin_note,
  paid_at, making_at, shipped_at, delivered_at, cancelled_at, expires_at,
  created_at, updated_at
  indexes: (status, created_at), (phone_e164)
**order_items** — id, order_id, product_id, name_snapshot, tier, unit_price_paise,
  quantity, shape, length, size_mode (`per_finger|preset|later`),
  sizes jsonb (`{ left:[t,i,m,r,p], right:[...] }` or `{ preset:"S" }`),
  design_id, lookbook_item_id, note
**payments** — a ledger of money she has received, entered by her: id, purpose,
  booking_id, order_id, amount_paise, method, reference text null (UPI transaction ID
  if she wants to note it), note, received_at, refunded_at, refund_note, created_at
  check: exactly one of booking_id / order_id
  index on reference where reference is not null (admin warns on a repeated reference)
**coupons** — id, code unique, kind, amount_paise, phone_e164 (bound), applies_to
  (`booking|press_on|any`), max_uses default 1, used_count, expires_at,
  source_order_id, source_booking_id, is_active, created_at
**coupon_redemptions** — id, coupon_id, booking_id, order_id, created_at
**reviews** — id, customer_name, body, rating smallint null, kind (`in_person|press_on`),
  media_id, booking_id, order_id, status, is_featured, is_placeholder, source
  (`admin|customer`), created_at
**faqs** — id, category, question, answer_md, sort_order, is_published
**pages** — slug pk (`about|care-guide|sizing-guide|policy-booking|policy-home-visits|policy-press-ons|privacy`), title, body_md, updated_at
**status_events** — id, entity (`booking|order|payment`), entity_id, from_status,
  to_status, note, created_at (customer-visible timeline on /s/[ref])
**audit_log** — id, action, entity, entity_id, before jsonb, after jsonb, created_at
**rate_limits** — key, window_start, count (pk key+window_start)

---

## 6. Settings registry

Typed with zod in `src/lib/settings/registry.ts`. `public: true` keys are the only
ones `getPublicSettings()` can return.

| Key | Default | Public |
|---|---|---|
| site.go_live | false | yes |
| site.launch_checklist | { testBookingDone:false, testOrderDone:false } | no |
| brand.logo_media_id / brand.monogram_media_id | null | yes |
| contact.whatsapp_e164 | "+919241099696" | yes |
| contact.whatsapp_wa | "919241099696" | yes |
| contact.instagram_url | "https://www.instagram.com/clawsby_d/" | yes |
| contact.public_location | "Hindpiri, Ranchi" | yes |
| contact.owner_notify_email | «TO CONFIRM» | no |
| private.studio_address | "" (prod) / "SENTINEL-ADDR-4417, Hindpiri" (dev/test seed) | **no** |
| private.studio_directions | "" | **no** |
| private.pickup_point | "" (prod) / "SENTINEL-PICKUP-9902" (dev/test) | **no** |
| payments.upi_id | "daudshaima111@oksbi" (used only inside her WhatsApp messages) | no |
| payments.instructions | "Please pay {amount} to UPI ID {upiId} with {ref} in the note, then send me the screenshot here." | no |
| deposits.standard_paise | 20000 | yes |
| deposits.bridal_paise | 50000 | yes |
| deposits.hold_hours | 12 | yes |
| home_visit.min_booking_paise | 99900 | yes |
| home_visit.window | { start:"10:00", end:"18:00" } | yes |
| home_visit.travel_buffer_min | 30 | no |
| home_visit.band_fees | { within_4km:10000, km_4_to_8:20000 } | yes |
| home_visit.note | "Home visits are for women clients only, between 10 AM and 6 PM." | yes |
| booking.slot_step_min | 30 | no |
| booking.min_notice_hours | 12 | yes |
| booking.max_advance_days | 45 | yes |
| booking.bridal_min_lead_days | 14 | yes |
| press_on.lead_days | { min:5, max:7 } | yes |
| press_on.exam_mode | false | yes |
| press_on.exam_lead_days | { min:10, max:14 } | yes |
| press_on.exam_note | "It's exam season, so press-ons are taking 10–14 days right now. Thank you for waiting for them." | yes |
| shipping.flat_paise | 7900 | yes |
| shipping.free_above_paise | 149900 | yes |
| shipping.pickup_enabled | true | yes |
| shipping.pickup_pincode_prefixes | ["834"] | yes |
| orders.unpaid_expiry_hours | 48 | yes |
| offers.launch | { enabled:true, amount_paise:20000, total:25, spots_left:25 } | yes |
| offers.referral_paise | 10000 | yes |
| offers.sizing_kit_credit_paise | 14900 | yes |
| messages.sign_off | "— D" «TO CONFIRM» | no |
| sizing.chart | §16.6 | yes |
| sizing.presets | §16.6 | yes |
| social.links | [{ label:"Instagram", url:"https://www.instagram.com/clawsby_d/" }] | yes |

Changing any setting writes `audit_log` and calls `revalidateTag('settings')`.

---

## 7. Business rules (pure functions in src/lib/domain/)

### 7.1 Booking pricing — `priceBooking(input, settings, catalog)`
Returns `{ lines, subtotal, travelFee, discount, estimate, hasFromPrices,
deposit, minimumMet, warnings }`. Order of operations:
1. Lines = service price × quantity (add-ons are per nail, quantity 1–20).
2. If any selected service has `is_new_set`, every `free_with_new_set` line becomes ₹0
   with the note "Free with your new set".
3. `subtotal` = sum of lines.
4. Home visit: `minimumMet = subtotal ≥ home_visit.min_booking`. If false, block
   submit: "Home visits start at ₹999. Add a service or choose the studio."
5. Travel fee from the area's band. `on_request` → `travelFee = null`, show
   "Travel fee confirmed on WhatsApp", submission allowed.
6. Discount candidates: launch offer (enabled, spots_left > 0, booking contains an
   `is_extension_set` service, phone hasn't had it on a confirmed/completed booking)
   and a valid coupon. Take the larger. Server re-validates the phone check; the
   client shows "Launch offer applied (first visit only)".
7. `estimate = max(0, subtotal + (travelFee ?? 0) − discount)`.
8. Deposit: any `deposit_kind = bridal` → bridal; else any `standard` service or
   location = home → standard; else 0.
9. `hasFromPrices` if any line is "from" → UI says "Estimated total, from".
Tests: ≥ 20 cases covering each rule and combinations.

### 7.2 Slot engine — `getSlots(date, durationMin, location, ctx)`
- Candidate starts every `slot_step_min` from each availability window start (IST).
- A start is valid when: the block `[start − buffer, start + duration + buffer]` sits
  inside one availability window (buffer = travel buffer for home, 0 for studio);
  it doesn't intersect a blocked period; it doesn't overlap a holding booking
  (`awaiting_deposit` not past `deposit_due_by`, or `confirmed`) including that
  booking's own buffers; `start ≥ now + min_notice_hours`; date ≤ today +
  `max_advance_days`; bridal → date ≥ today + `bridal_min_lead_days`; home →
  start ≥ window.start and start + duration ≤ window.end.
- Duration = Σ service durations + Σ add-on per-nail minutes × quantity.
- Output grouped: Morning (< 12:00), Afternoon (12:00–15:59), Evening (≥ 16:00).
- `getOpenDates(range)` returns dates with at least one slot, for the date picker.
- Server re-runs the engine on submit and on approve; approve fails with a clear
  message if the slot is no longer free.

### 7.3 Order pricing — `priceOrder(items, coupon, fulfilment, settings)`
subtotal → coupon (one per order; `sizing_kit_credit` only on tiers other than
`sizing_kit`) → shipping: pickup → 0; else subtotal after discount > free_above → 0;
else flat → total. Sizing-kit-only orders pay flat shipping.

### 7.4 Lead time — `getLeadTime(items, settings)`
exam_mode → exam_lead_days; else max over items of product override or global.
Shown as "Made in 5–7 days, then shipped" and stored on the order. Estimated dispatch
window = paid date + lead range.

### 7.5 Look → service / tier mapping — `domain/mapping.ts`
Admin overrides win. Defaults: occasion includes bridal → bridal set / bridal
press-ons; glam 5 → Glam set / Glam tier; glam 4 → Signature set / Glam tier;
glam 3 → Signature set / Signature tier; glam 1–2 → Gel with French, chrome or cat-eye
finish / Classic tier. Shape and length carry over.

### 7.6 State machines — `domain/status.ts`
```
Booking:  requested ─approve(deposit>0)→ awaiting_deposit ─deposit recorded→ confirmed ─→ completed
          requested ─approve(deposit=0)→ confirmed
          requested ─decline→ declined
          awaiting_deposit ─hold passes→ expired
          awaiting_deposit | confirmed ─cancel→ cancelled (deposit refunded | forfeited)
          confirmed ─no-show→ no_show (deposit forfeited)
          reschedule: same status, new time, reschedule_count + 1
Order:    new ─payment recorded→ paid ─→ making ─→ shipped ─→ delivered
          new ─unpaid past expires_at→ cancelled;  any pre-shipped ─cancel→ cancelled
          labels for pickup: shipped = "Ready for pickup", delivered = "Picked up"
```
Every transition: one transaction, a `status_events` row, an `audit_log` row.
`recordPayment()` (§13) is the only code that marks a deposit received or an order paid.

### 7.7 Policies (text from settings/pages; enforced where noted)
- ₹200 deposit for any extension set or home visit, ₹500 for bridal; adjusted in the
  final bill.
- One free reschedule with ≥ 24 h notice (admin sees reschedule_count and hours to
  appointment when rescheduling).
- Cancellation within 24 h or no-show: deposit not refunded (admin defaults the
  forfeit toggle accordingly).
- More than 15 min late: design may be simplified or slot rescheduled (text only).
- Bridal ≥ 14 days ahead (enforced in the slot engine).
- Press-ons: custom, no returns. Damaged on arrival → unboxing photo/video on WhatsApp
  within 48 h → remake or repair.

---

## 8. Public pages

Every page: one h1, metadata, empty/loading/error states as listed. Loading = skeletons
with reserved height (CLS < 0.1). Error = a sentence saying what failed plus a WhatsApp
fallback button ("Message me on WhatsApp instead").

**Global chrome:** header (wordmark, Lookbook, Book, Shop, menu drawer on mobile);
footer (links, Instagram, WhatsApp, "Hindpiri, Ranchi", policies); floating WhatsApp
button bottom-right above the safe area, pre-filled "Hi Claws by D! I have a question
about my nails." Launch-offer banner (when enabled and spots_left > 0): "₹200 off
extension sets for my first 25 clients — {n} spots left". Exam-mode note on shop pages.

### 8.1 Home `/`
1. Hero: shows the whole range at a glance — a horizontal strip of featured looks
   ordered dainty → glam with the mood shift running across it (accent and wordmark
   weight change across the strip). H1 "Nails from dainty to glam, in Ranchi."
   «TO CONFIRM copy». Primary buttons: Book a set, Shop press-ons; text link: Lookbook.
2. Featured looks (featured, published). 3. "Two ways to get your nails": in person
   (studio + home visits) / press-ons shipped across India. 4. Reviews (approved;
   placeholders only while not live). 5. Instagram + WhatsApp block.
States: no featured looks → strip uses latest 6 published; none at all → hero falls back
to the brand wordmark on a blush/chrome field, sections without data render nothing.

### 8.2 Lookbook `/lookbook`
- Server-renders all published looks (expect < 300) with cover, glam, shape, length,
  occasions. Client leaf handles filtering.
- **Dainty ↔ Glam slider:** single thumb, 5 stops labelled Dainty · Soft · Statement ·
  Bold · Glam «TO CONFIRM labels», plus "All vibes" reset. Shows looks within ±1 of the
  position, sorted by closeness, then featured, then newest. URL `?mood=3`, kept in sync
  with `history.replaceState` (no navigation). Keyboard and screen-reader friendly
  (native range input styled).
- Filters: shape, length, occasion as chips in a bottom sheet on mobile, inline on desktop.
  Active filters shown as removable chips. URL params.
- Card: cover (4:5), small shape glyph + length + vibe chip; tap → look detail.
- Empty for current filters: show the 6 nearest looks under "Closest to this vibe" and a
  "Clear filters" button. Never a bare "No results".
- No looks at all: "New work is coming soon. Follow @clawsby_d for the latest." + Book button.
- Performance: images lazy below the fold, `sizes="(max-width:768px) 50vw, 33vw"`.

### 8.3 Look detail `/lookbook/[slug]`
Swipeable photos, title/caption, tags, two buttons: **Book this look**
(`/book?look=slug`) and **Get it as press-ons** (`/shop/custom?look=slug`). "More like
this" (same glam ±1). 404 for unpublished.

### 8.4 Services `/services`
Categories in order (Gel on natural nails, Extensions, Nail art add-ons, Maintenance),
each service with price ("from" where set), short description, duration. Offers block
(launch counter, refer a friend). Home-visit block (women only, 10–6, fees by band,
₹999 minimum, deposit). Deposit & cancellation policy summary with link. One CTA per
category → `/book?service=slug`.

### 8.5 Booking `/book` — five steps, progress bar, sticky running total
Prefill sources: `?service=`, `?look=` (mapping §7.5 + look attached as reference),
`?design=` (Build Your Set). State persists in sessionStorage (try/catch) so a refresh
doesn't lose it.
1. **Services & add-ons** — grouped list with quantity steppers for per-nail add-ons.
   Running total bar: services + add-ons + travel − offer = estimate.
2. **Date & time** — calendar of open dates (§7.2), then slots grouped by part of day,
   "I'm flexible by an hour" tick. No open dates → "No slots in the next 45 days. Message
   me on WhatsApp and I'll try to fit you in." Bridal shows the 2-week rule.
3. **Location** — Studio (Hindpiri) or Home visit. Home shows: area dropdown, travel fee,
   ₹999 minimum status, women-only note, deposit note. Changing location re-runs slots
   (home window and buffers) and warns if the chosen slot no longer fits.
4. **Inspiration (optional)** — upload one image (compressed, EXIF stripped) or keep the
   attached look/design. Optional note. Optional "Referred by a friend?" and "Have a code?".
5. **Your details** — name, WhatsApp number. Summary. Submit button "Send booking request".
Submit → server re-prices and re-validates the slot → `bookings` row `requested` →
email to her → `/book/done?ref=` showing: "Request sent. I'll confirm on WhatsApp." +
big **Send on WhatsApp** button (template §11.1) + what happens next (approval →
deposit if needed → address on WhatsApp) + status link.
Errors: slot taken → back to step 2 with message; rate limited → WhatsApp fallback.

### 8.6 Build Your Set `/build`
Playful single-column stepper: shape → length → vibe (same slider) → colours (up to 3
swatches from a curated palette + custom picker, each with a name) → occasion →
inspiration upload. A live SVG preview from `nail-svg.ts` shows five nails of the
chosen shape and length filled with the chosen colours (gradient for chrome, a soft
sheen for cat-eye). Final screen: summary card + two buttons, **Book this in person**
and **Order as press-ons**, both creating a `design_drafts` row then routing with
`?design=id`. `nail-svg.ts` is pure: `nailPath(shape, length) → d`, snapshot-tested.

### 8.7 Press-on shop `/shop`, `/shop/[slug]`, `/shop/custom`
- `/shop`: tiers as sections (Classic, Signature, Glam, Fully custom, Bridal), product
  cards with price and lead time. Sizing kit promoted: "Not sure of your size? Get the
  sizing kit for ₹149 — it comes back as credit on your first set." Exam note when on.
- Product page: photos, what's included (10 custom-sized nails + 2 spares, prep kit:
  adhesive tabs, glue, mini file, cuticle stick, alcohol pad), options:
  shape (chips with glyphs, limited to `shapes_allowed`), length, **size**:
  (a) "I know my sizes" → 5 inputs (thumb → pinky) with "Same on both hands" on by
  default, else 10; values from the chart; link to sizing guide;
  (b) S / M / L presets with the chart shown;
  (c) "I'll send my sizes on WhatsApp" → order flagged `sizes_pending`.
  Quantity, Add to cart.
- `/shop/custom`: Fully custom tier with the attached design or look summary, then the
  same options. Without `?design`/`?look` → prompt to Build Your Set first.
- Cart: localStorage `cbd_cart_v1` (try/catch), server re-prices at checkout. Empty
  cart → "Your cart is empty" + Shop and Build buttons. Inactive product in cart →
  line flagged, checkout blocked until removed.

### 8.8 Checkout `/checkout`
Name, WhatsApp number, fulfilment (Ship across India / Pickup in Hindpiri — "for Ranchi
customers, exact point shared on WhatsApp"), address (flat/house, street/area, landmark,
city, state dropdown, pincode), code field, summary (items, discount, shipping, total,
lead time, estimated dispatch window), policy tick ("Custom pieces can't be returned. If
a set arrives damaged, send an unboxing video on WhatsApp within 48 hours.").
"Place order" → order `new` → `/s/[ref]?k=` showing "Order placed! Send it to me on
WhatsApp and I'll share the payment details. Making starts once it's paid." and a big
**Send on WhatsApp** button (§11.9). No payment UI anywhere on the site (A24).

### 8.9 Payments
None on the site (A24). Customers are told payment details come on WhatsApp. See §13.

### 8.10 Status `/status` and `/s/[ref]`
`/status`: ref + phone form → redirect to signed link. `/s/[ref]`: timeline
(status_events), what happens next, payment status ("Waiting for payment — details on
WhatsApp" or "Payment received"),
booking date/time and "Studio, Hindpiri — address sent on WhatsApp after confirmation"
(never the address itself), order items and tracking, WhatsApp button. Invalid link →
"This link isn't valid. Check your reference on /status."

### 8.11 Content pages
`/sizing-guide` — how to measure each nail (tape method + kit), the size chart as a
tech-pack-style table, S/M/L presets, link to buy the kit. `/care-guide` — apply, remove,
reuse. `/about` — her story, placeholder copy «TO CONFIRM». `/faq` — grouped accordion
(§16.8) + contact block (WhatsApp, Instagram, "Hindpiri, Ranchi"). `/policies/[slug]` —
booking & cancellation, home visits, press-ons, privacy. All from `pages`/`faqs`.

### 8.12 Review `/review/[ref]?k=`
Name (prefilled), rating 1–5 optional, text, optional photo → `pending`. One per ref.

### 8.13 Preview `/preview`
Wordmark, one password field, "Enter". Correct → cookie `cbd_preview` (HMAC of the
password, 30 days) → back to the requested page.

---

## 9. Admin panel (mobile first)

**Shell:** bottom tab bar on mobile — Home · Bookings · Orders · Looks · More; sidebar on
desktop. More → Payments, Calendar, Availability, Areas, Services, Shop, Reviews,
Content, Settings. Footer: small heart icon → `/admin/welcome?again=1`. Site status pill
in the header (Preview / Live). Installable (manifest `start_url: /admin`).

**Action pattern:** every customer-facing action (approve, decline, payment received, ship…)
finishes by opening a bottom sheet with the WhatsApp message pre-filled in an editable
textarea and one big "Open WhatsApp" button (`https://wa.me/<customer>?text=`). The
action is saved before the sheet opens.

### 9.1 Home (dashboard)
"Needs you": new requests (count + oldest age), deposits awaiting (holds ending within
3 h highlighted), unpaid orders, orders to make (paid, sizes received), holds expired
today. "This week":
appointments by day with a one-tap reminder (§11.7). Quick controls: Exam mode toggle,
launch spots −/+ stepper, site status. Empty: "No requests yet. Share your booking link"
+ copy-link button.

### 9.2 Bookings
Tabs: Requests · Upcoming · Past · Closed. Card: name, date/time, services, estimate,
location/area, status chip, overlap warning. Detail: everything submitted, inspiration
image, linked look/design, slot conflict check, actions:
- **Approve** → deposit > 0: `awaiting_deposit`, due_by = now + hold_hours, sheet §11.2;
  deposit = 0: `confirmed`, sheet §11.3/§11.4.
- **Decline** → reason (slot not available / outside home-visit area / service not
  offered / other) + optional up to 3 alternative slots from the engine → §11.5.
- **Reschedule** → slot picker from the engine; shows reschedule_count and hours to
  appointment with the policy hint → §11.6.
- **Deposit received** → record-payment sheet (§9.4) → `confirmed` → §11.3/§11.4.
- **Payment reminder** while awaiting deposit → §11.11.
- **Complete** → final bill input (prefilled with estimate), "Give referral credit" when
  `referred_by` is set → §11.8 review request.
- **No-show**, **Cancel** (refund or forfeit toggle, defaulting from the 24 h rule).

### 9.3 Orders
Tabs: Unpaid · To make · Shipped · Done. Detail: items with a **making sheet** — sizes
in a finger grid (L/R × thumb→pinky), shape, length, design brief, colours, inspiration,
`sizes_pending` banner. Address with a copy button. While `new`: **Send payment
details** (§11.9b) and **Payment reminder** (§11.11). Status stepper: **Mark paid**
opens the record-payment sheet (§9.4), then making → shipped → delivered, each opening
its WhatsApp sheet; shipped asks for courier,
tracking number, tracking URL. Pickup orders show the pickup template instead.

### 9.4 Recording payments
She checks her UPI app or the customer's screenshot, then taps **Deposit received** or
**Mark paid**. The sheet: amount (prefilled with the deposit or order total, editable),
method (UPI / cash / other), optional reference (UPI transaction ID), note. Saving calls
`recordPayment` and then opens the next WhatsApp sheet. A reference already used on
another payment shows a warning. `/admin/payments` is a simple log: newest first,
filter by month, total received; a payment can be marked refunded with a note.

### 9.5 Calendar & availability
Week view list (phone-friendly, not a grid). Weekly hours editor: per weekday, multiple
windows, on/off. Slot step, min notice, max advance, bridal lead. **Block time off in two
taps:** "Block time off" → chips Today · Tomorrow · This week · Next week · Pick dates →
saved (optional reason). Blocking a range with confirmed bookings shows them first.

### 9.6 Home-visit areas
List with band and fee; add/edit/reorder/deactivate. Band sets the default fee
(₹100 / ₹200 / on request), fee editable per area.

### 9.7 Lookbook
Grid with draft/published/featured badges. **Upload:** multi-select from the phone
gallery → compressed in the browser (max 2000 px long edge, WebP q≈0.8, JPEG fallback,
HEIC decoded first) → EXIF gone → uploaded with progress → each becomes a draft.
**Tag sheet** per look: glam level (5 big chips), shape, length, occasions, colours,
title/caption (optional), featured, published, mapping overrides. Bulk select → set
shape/occasion/publish. Reorder by drag (touch) with up/down fallback. Delete asks to
confirm and removes the blobs.

### 9.8 Services
Grouped by category, drag to reorder, edit sheet (name, description, price, "from",
per nail, duration, per-nail minutes, flags: new set / free with new set / extension set
/ deposit kind / min lead days / active). Add category.

### 9.9 Shop (press-on products)
List, edit: name, tier, price, "from", photos, description, allowed shapes/lengths,
needs sizing, lead time override, active/hidden, placeholder flag, order.

### 9.10 Reviews
Pending / Approved / Hidden. Add manually (name, text, rating, photo, kind). Approve,
hide, feature. Placeholders labelled "Sample — hidden when live".

### 9.11 Content
About, FAQ (CRUD + reorder), policies, privacy, sizing guide intro + chart and presets
editor, care guide. Markdown editor with preview. Any «TO CONFIRM» is highlighted.

### 9.12 Settings (grouped, each group its own screen)
Site (Go live, preview info, brand uploads, social links), Contact (WhatsApp, Instagram,
public location, notification email), **Private** (studio address, directions, pickup
point — labelled "Only ever sent on WhatsApp"), Payments (UPI ID and the payment sentence used
only in her WhatsApp messages, hold hours, unpaid expiry), Deposits, Home visits, Bookings, Press-ons (lead time, exam mode + note),
Shipping, Offers (launch, referral, sizing credit), Messages (sign-off), Account (change
password, email, sign out everywhere).
**Go live:** turning it on opens a pre-flight list — a test booking and a test order done
end to end (manual ticks), placeholder looks/products still published, «TO CONFIRM» left in pages/FAQs/
settings, studio address and pickup point set, owner email set, launch counter. Warnings
don't block; she confirms "Go live". Turning it off puts the site back behind the
preview password.

### 9.13 Welcome note — §15

---

## 10. Flows

### 10.1 Studio booking (extension set)
Customer: Book → services → slot → Studio → inspiration → details → submit → done page →
Send on WhatsApp (§11.1). Her: email + WhatsApp → Approve → sheet §11.2 (deposit, UPI ID,
ref as note) → customer pays in their UPI app and sends the screenshot on WhatsApp → she
taps Deposit received → booking `confirmed` → sheet §11.3 with exact address →
appointment → Complete → review request §11.8.

### 10.2 Home visit
Same, with location Home + area. Below ₹999 can't submit. On-request area → fee TBD,
she sets it before approving (admin field). Confirmation §11.4 asks the client for full
address and location pin.

### 10.3 No-deposit booking (e.g. gel polish at studio)
Approve → `confirmed` immediately → §11.3 with address.

### 10.4 Press-on order
Shop → options + size → cart → checkout → order `new` → status page → Send on WhatsApp
(§11.9) → she replies with §11.9b → customer pays and sends the screenshot → she taps
Mark paid → `paid` → §11.10 → making → shipped (courier + tracking)
→ §11.12 → delivered → §11.14. Pickup: shipped = ready → §11.13.

### 10.5 Sizing kit
Buy kit (₹149 + shipping) → paid → coupon issued → §11.15 includes the code.

### 10.6 From the portfolio
Look → Book this look → booking with mapped service + look attached. Look → Get it as
press-ons → `/shop/custom?look=` with mapped tier, shape, length.

### 10.7 Build Your Set
Picker → design_drafts → booking or custom press-ons with everything carried forward.

---

## 11. WhatsApp templates (`src/lib/whatsapp/templates.ts`)

Rules: plain text with WhatsApp `*bold*`; at most two emoji per message; dates like
"Sat, 14 Nov" and times like "4:30 PM" in IST; amounts via formatINR; every message
carries the ref; URL-encode with `encodeURIComponent`; full wa.me URL under 2,000
chars (test). Customer → her uses `contact.whatsapp_wa`; her → customer uses the
customer's number without "+". `{signOff}` from settings.

**11.1 Booking request (customer → her)**
```
Hi Claws by D! I'd like to book a set 💅

*Request:* {ref}
*Name:* {name}
*When:* {date}, {time}{flexibleNote}
*Where:* {locationLine}
*Services:*
{serviceLines}
*Estimated total:* {estimate}{fromNote}
{offerLine}
{referenceLine}

Please confirm my slot when you can.
```
`locationLine` = "Studio (Hindpiri)" or "Home visit — {area}". `referenceLine` =
"Inspiration: {look or design link}" or omitted. Image uploads are not attached
(wa.me can't) — the line says "I've uploaded an inspiration photo with my request."

**11.2 Approved, deposit needed (her → customer)**
```
Hi {firstName}! I can do your set on *{date} at {time}* 💅

To lock the slot, please pay the *{deposit} deposit* by {dueTime}. It's adjusted in your final bill.

{paymentInstructions}

Booking: {ref}
{policyShort}
{signOff}
```
`paymentInstructions` = `payments.instructions` with `{amount}`, `{upiId}`, `{ref}` filled.
`policyShort` = "One free reschedule with 24 hours' notice. Cancelling within 24 hours or not turning up means the deposit isn't refunded."

**11.3 Confirmed — studio**
```
You're booked, {firstName}! ✨

*{date}, {time}*
*Studio:* {studioAddress}
{studioDirections}

Booking: {ref}
{depositLine}
Estimated total: {estimate}

If you're running more than 15 minutes late, I may need to simplify the design or move your slot. Need to change something? Message me at least 24 hours before.

See you soon!
{signOff}
```

**11.4 Confirmed — home visit**
```
You're booked, {firstName}! ✨

*{date}, {time}* — home visit in *{area}*
Travel fee: {travelFee}

Please send me here:
1. Your full address with a landmark
2. Your location pin

Booking: {ref}
{depositLine}
Estimated total: {estimate}
{signOff}
```

**11.5 Declined**
```
Hi {firstName}, I'm sorry, I can't take {date} at {time}. {reasonLine}

{alternativesLine}
You can also pick another time here: {bookLink}
{signOff}
```

**11.6 Rescheduled**
```
Hi {firstName}, your booking {ref} is now on *{date} at {time}*. {policyLine}
{signOff}
```

**11.7 Reminder (manual, from "This week")**
```
Hi {firstName}! A reminder that your nails are booked for *{relativeDay}, {time}* 💅
{locationShort}
Any changes? Message me here.
{signOff}
```

**11.8 Review request (after completion or delivery)**
```
Thank you, {firstName}! I loved doing your nails 💗
If you have a minute, I'd be so grateful for a review: {reviewLink}
Tag @clawsby_d if you post them!
{signOff}
```

**11.9 Order placed (customer → her)**
```
Hi Claws by D! I've ordered press-ons 💅

*Order:* {ref}
*Name:* {name}
{itemLines}
*Total:* {total} ({shippingLine})
*Delivery:* {fulfilmentLine}

Please send me the payment details.
```

**11.9b Payment details for an order (her → customer)**
```
Hi {firstName}! Thank you for your order *{ref}* 💅

Total: *{total}*
{paymentInstructions}

Making starts as soon as it's paid. Unpaid orders are cancelled after {expiryHours} hours.
{signOff}
```

**11.10 Payment received (her → customer)**
```
Payment received for *{ref}*, thank you {firstName}! ✨
Your set goes into making now. It should be ready to ship {dispatchWindow}.
Track it here: {statusLink}
{sizesPendingLine}
{signOff}
```

**11.11 Payment reminder (her → customer)**
```
Hi {firstName}, just checking on *{ref}*. {reminderLine}
{paymentInstructions}
{signOff}
```
`reminderLine`: booking → "Your slot is held until {dueTime}."; order → "I'll start
making your set as soon as it's paid."

**11.12 Shipped**
```
Your press-ons are on the way, {firstName}! 📦

*Order:* {ref}
*Courier:* {courier}
*Tracking:* {trackingNumber}
{trackingUrl}

Please record a quick unboxing video when it arrives. If anything is damaged, send it here within 48 hours and I'll remake or repair it.
Care & reuse guide: {careLink}
{signOff}
```

**11.13 Ready for pickup**
```
Your press-ons are ready, {firstName}! 💅

*Order:* {ref}
*Pickup point:* {pickupPoint}
Message me a time that works for you.
{signOff}
```

**11.14 Delivered** — "Hope you love them, {firstName}!" + care link + §11.8 review line.

**11.15 Sizing kit paid**
```
Thanks {firstName}! Your sizing kit ({ref}) is on its way soon.
Your {credit} credit code is *{code}*. Use it on your first press-on set.
Sizing guide: {sizingLink}
{signOff}
```

**11.16 Referral credit (to each person)**
```
Hi {firstName}! Thanks for the referral 💗 Here's {amount} off your next set: *{code}*
Use it when you book or order: {siteLink}
{signOff}
```

---

## 12. Email to her (Resend + React Email)
New booking request, new order, review submitted. Subject
starts with the ref. Body: the summary + "Open in admin" link. Sending failures are
logged and never block the customer flow. From `EMAIL_FROM` on a verified sending
domain (see claude/clawsbyd.md pre-flight).

---

## 13. Payments (recorded, not taken)

- The site has no payment step: no buttons, UPI links, QR codes, transaction-ID forms or
  gateways. Customers pay her directly after she messages them on WhatsApp.
- `payments.instructions` (settings) is the sentence her messages use, with `{amount}`,
  `{upiId}` and `{ref}` filled in. She can rewrite it (e.g. "I'll send you my QR code").
  Saving rejects any other `{variable}`.
- `src/lib/domain/payments.ts` → `recordPayment({ purpose, bookingId | orderId,
  amountPaise, method, reference?, note? })` writes the ledger row and advances the
  booking (`awaiting_deposit → confirmed`) or order (`new → paid`) in one transaction,
  with `status_events` and `audit_log`. Idempotent: recording the same deposit or order
  payment twice is refused with a clear message. The launch counter (A12) and the
  sizing-kit coupon (A14) hang off this function.
- She can confirm a booking or mark an order paid with "No payment needed" (note
  required) — e.g. a waived deposit — which advances the status without a ledger row.
- Phase 2: an online gateway would add a pay page and a webhook that calls
  `recordPayment`. Nothing else changes.

---

## 14. Go-live gate, SEO, performance

### 14.1 Gate (`src/proxy.ts`)
- Matcher excludes `/_next`, static files, `/admin/*`, `/api/blob/*` (token route checks
  its own auth), `/api/cron/*`, `/preview`, `/manifest.webmanifest`, icons.
- Reads `site.go_live` through a 15-second in-memory cache, busted by
  `revalidateTag('settings')`. Unreadable → not live.
- Not live + no valid preview cookie → 307 to `/preview?next=`.
- Not live → `X-Robots-Tag: noindex, nofollow` on every response, `robots.txt`
  `Disallow: /`, sitemap 404, `metadata.robots = noindex`.
- Public server actions also check live-or-preview (defence in depth).

### 14.2 SEO (applied only when live)
Titles: Home "Nail art & extensions in Ranchi | Claws by D"; Services "Nail extension &
gel prices in Ranchi"; Lookbook "Nail art designs — dainty to glam"; Shop "Custom
press-on nails, shipped across India". JSON-LD: `NailSalon` with name, url, sameAs
Instagram, telephone, `address` with `addressLocality: "Hindpiri, Ranchi"`,
`addressRegion: "Jharkhand"`, `addressCountry: "IN"` and no street, `areaServed`
Ranchi, `priceRange` computed from active services; `Product` + `Offer` (INR) for
press-ons; `FAQPage`; `BreadcrumbList`. Sitemap: static pages, published looks, active
products. Dynamic OG images for looks and products (cover, title, price) so WhatsApp and
Instagram DM shares show a rich card.

### 14.3 Performance budget
LCP < 2.5 s on simulated slow 4G mid-range Android, CLS < 0.1, Lighthouse mobile ≥ 90 on
Home, Lookbook, Product, Book. Fonts via `next/font` with only the axes used. Blur
placeholders from `media.blur_data_url`. Blob remote pattern
`*.public.blob.vercel-storage.com`; set `images.qualities` if any quality other than the
Next 16 default is used. Public JS: no heavy date-picker or carousel libraries.

---

## 15. Welcome note (fixed)

- Text lives in `src/content/welcome-note.ts` as `export const WELCOME_NOTE = "...";`
  — UTF-8, LF line breaks, paragraphs separated by one blank line, no trailing newline.
  It is not a setting and is not editable from the admin.
- Integrity test: `sha256(WELCOME_NOTE)` must equal
  `332749b475b4bebda6aa99ae25beceac8764596f2a801eafa418231177c9bb32`
  (675 bytes, 13 lines). If the test fails, the text was changed — restore it from below,
  do not update the hash.
- Behaviour: after login, if `owner.welcome_seen_at` is null, every admin route
  redirects to `/admin/welcome`. Full-screen, brand ground, the note rendered as one
  block with `white-space: pre-line` in the display font at reading size (first line
  larger via `::first-line`), soft 600 ms fade-in (none under reduced motion), one
  button at the bottom: **Chaliye shuru karein**. Tapping it sets `welcome_seen_at` and
  goes to the dashboard. If she leaves without tapping, it shows again next time.
- Heart icon in the admin footer → `/admin/welcome?again=1`, same screen, button returns
  to the previous page, nothing written.
- `/admin/welcome?preview=1` shows it without changing anything (for Abraham's checks).
- `pnpm welcome:arm` resets `welcome_seen_at` to null (run on reveal day against
  production).

Exact text (between the fences, nothing added):
```
Welcome CEO saahiba.

Ye pura website aapka hai. Har photo. Har price. Har slot. Sab kuch yahan se aap control karti hain.

Jab aapne Claws by D shuru kiya tha na. Tabhi mujhe pata tha ye sirf ek hobby nahi rahegi. Aapke haathon ka kaam deserve karta hai ki log usse properly dekhein. Sirf ek Instagram grid mein nahi.

Toh maine aapke kaam ke liye ek ghar bana diya. Clients yahan aake aapke sets dekhenge. Booking karenge. Press ons order karenge. Aur aap bas apna magic karti rahiye.

Abhi saari prices aur details placeholder hain. Jaise aapko theek lage waise set kar lijiye. Dukaan aapki. Rules bhi aapke.

Bohot proud hoon aap par Bebo. Hamesha rahunga.

Aapka Abraham
```

---

## 16. Seed data (idempotent, `pnpm db:seed`)

### 16.1 Services (prices from the brief; durations are assumptions)
| Category | Service | Price | From | Per nail | Duration | Flags |
|---|---|---|---|---|---|---|
| Gel on natural nails | Gel polish, solid colour (hands) | ₹499 | | | 45 | new set |
| | Gel polish with French, chrome or cat-eye finish | ₹699 | | | 60 | new set |
| | Gel overlay / BIAB (strengthening, no added length) | ₹799 | | | 60 | new set |
| | Gel polish, feet | ₹449 | | | 45 | new set |
| Extensions (gel or polygel, solid gel colour included) | Short to medium length | ₹1,199 | | | 120 | new set, extension, deposit standard |
| | Long / XL length | ₹1,499 | | | 150 | new set, extension, deposit standard |
| | Signature set (French, chrome, ombre or cat-eye) | ₹1,499 | yes | | 150 | new set, extension, deposit standard |
| | Glam set (full hand-painted art, 3D, charms) | ₹1,999 | yes | | 180 | new set, extension, deposit standard |
| | Bridal set (consultation included) | ₹2,499 | yes | | 210 | new set, extension, deposit bridal, min lead 14 |
| Nail art add-ons | Simple art (dots, lines, minimal florals) | ₹50 | | yes | 5/nail | add-on |
| | Detailed hand-painted art | ₹100 | | yes | 10/nail | add-on |
| | 3D, charms or stones | ₹150 | | yes | 10/nail | add-on |
| Maintenance | Refill / infill (within 3–4 weeks) | ₹799 | | | 90 | |
| | Repair | ₹99 | | yes | 15/nail | |
| | Gel polish removal | ₹199 | | | 30 | free with new set |
| | Extension removal | ₹299 | | | 45 | free with new set |

### 16.2 Availability (placeholder «TO CONFIRM»)
Mon–Fri 16:00–20:00, Sat 10:00–19:00, Sun 11:00–17:00. One blocked range two weeks out
labelled "Exams (sample)" so the blocking UI is visible.

### 16.3 Home-visit areas (bands are estimates «TO CONFIRM» — she corrects them)
Within 4 km (₹100): Hindpiri, Main Road, Upper Bazar, Lalpur, Karamtoli, Kanta Toli,
Ratu Road, Morabadi. 4–8 km (₹200): Doranda, Harmu, Bariatu, Kokar, Ashok Nagar, Argora,
Hinoo, Kanke Road, Booty More. On request: Kanke, Dhurwa, Namkum, HEC.

### 16.4 Press-on products (names are placeholders, `is_placeholder`)
Classic ₹699: Classic Solid, Micro French, Glazed Chrome, Velvet Cat-Eye ·
Signature ₹899: Pearl Accent, Cherry Accent · Glam from ₹1,199: Garden Party
(hand-painted florals), Chrome & Charms (3D) · Fully custom from ₹1,299 ·
Bridal from ₹1,799 · Sizing kit ₹149 (no sizing, no shape/length options).

### 16.5 Lookbook
If `seed/looks/looks.csv` exists (columns: file, title, glam_level, shape, length,
occasions `|`-separated, colours `|`-separated, featured), upload each image through the
same compression path (EXIF stripped) and create published looks with
`is_placeholder=false`. Otherwise generate 18 placeholder looks as SVG swatch art
(nail silhouettes from `nail-svg.ts` in the look's colours on blush/chrome grounds),
spread glam 1–5 (4/4/4/3/3), all shapes, all occasions, 6 featured,
`is_placeholder=true`.

### 16.6 Sizing (placeholder «TO CONFIRM against the tip brand she uses»)
Chart, size → nail-bed width in mm: 0:18, 1:17, 2:16, 3:15, 4:14, 5:13, 6:12, 7:11,
8:10, 9:9, 10:8, 11:7. Presets (thumb, index, middle, ring, pinky): S 3·6·5·7·9,
M 2·5·4·6·8, L 1·4·3·5·7.

### 16.7 Reviews
Three placeholder reviews, `is_placeholder=true`, `status=approved`, rendered only while
not live, labelled in admin. Bodies clearly generic, e.g. "Sample review — replace with a
real one from a client."

### 16.8 FAQs (answers only from the brief; gaps marked)
- How much does a set cost? — Gel polish from ₹449 (feet) and ₹499 (hands), extensions
  from ₹1,199, nail art from ₹50 per nail. Full menu: /services.
- How long do sets last? — «TO CONFIRM gel polish wear time». Extensions are usually
  refilled within 3–4 weeks.
- Do I need to pay a deposit? — ₹200 for any extension set or home visit, ₹500 for
  bridal, paid after I confirm your slot and adjusted in your final bill.
- How do I pay? — On WhatsApp. Once I confirm your booking or order, I'll send you the
  UPI details. There's no payment on the website.
- Do you do home visits? — Yes, for women clients, between 10 AM and 6 PM, within about
  8 km of Hindpiri. Travel fee ₹100 up to 4 km, ₹200 for 4–8 km. Minimum booking ₹999.
- Can I reschedule or cancel? — One free reschedule with 24 hours' notice. Cancelling
  within 24 hours or not turning up means the deposit isn't refunded.
- How do I find my press-on size? — Follow the sizing guide, or get the ₹149 sizing kit;
  the ₹149 comes back as credit on your first set.
- How long do press-ons take? — Made in 5–7 days, then shipped. Delivery time
  «TO CONFIRM courier estimate».
- How much is shipping? — ₹79 anywhere in India, free above ₹1,499. Free pickup in
  Hindpiri for Ranchi customers.
- Can I return press-ons? — They're custom-made, so no returns. If a set arrives
  damaged, send an unboxing photo or video on WhatsApp within 48 hours and I'll remake
  or repair it.
- Can I reuse press-ons? — Yes, see the care guide. «TO CONFIRM how many wears».
- Where are you? — Hindpiri, Ranchi. The exact address is shared on WhatsApp once your
  booking is confirmed.

### 16.9 Pages
About (placeholder, «TO CONFIRM»): a short first-person story from fashion technology
student to nail artist, no invented facts. Policies from §7.7. Privacy «TO CONFIRM»:
what's collected (name, WhatsApp number, delivery address for orders, uploaded
inspiration photos, records of payments received), why, who sees it (only her), how to ask
for deletion (WhatsApp). Care guide «TO CONFIRM» structure: apply / remove / reuse /
store.

### 16.10 Settings — every default in §6. Owner row with `OWNER_EMAIL`, no password
(set with the script). In dev/test, private address and pickup point are the sentinels.

---

## 17. Tests that must exist
- Unit: pricing (≥ 20 cases), slots (blocks, buffers, home window, bridal lead, notice,
  holds, expired holds), order pricing + shipping threshold, lead time incl. exam mode,
  mapping, recordPayment (advances status, refuses a duplicate), payment-instruction
  variables, every WhatsApp template (snapshot + encoded length),
  phone/pincode, refs, signed links, nail SVG snapshots, welcome-note hash.
- E2E (360×740 and 1440×900): gate off/on; preview password; studio booking with
  deposit end to end; home visit (minimum, on-request area); no-deposit booking; press-on
  order → mark paid → shipped; sizing-kit coupon issued and redeemed once; welcome
  note shows once, heart reopens, `?again` writes nothing.
- Privacy: as a guest, fetch every public route (HTML + RSC via `RSC: 1` header) and
  every public action response; assert neither sentinel appears. Break it on purpose
  once (render the address on Home), watch it fail, revert.
- Upload: a fixture JPEG with GPS EXIF goes through the uploader; the stored blob has no
  GPS tags (check with `exifr`).
- Build-failing grep: `private.studio_address|private.pickup_point` must not appear
  under `src/app/(site)/` or `src/components/{site,lookbook,booking,build,shop}/`.
- Build-failing grep: `upi://` must not appear anywhere under `src/` (the site takes no
  payments).

---

## 18. Phase 2 hooks (don't build, don't block)
Online payments (e.g. Razorpay): a pay page + webhook calling `recordPayment` (§13). Shiprocket (`orders.courier`,
`tracking_*` already exist). Automatic reminders (cron + templates exist). Editable
message templates. Analytics: count `bookings.lookbook_item_id` and
`order_items.lookbook_item_id` per look — the data is captured from day one.
