# Claws by D — project rules

Web app for a nail art business in Hindpiri, Ranchi. Three jobs: show the portfolio
better than Instagram, take booking requests for in-person sets, sell custom press-ons.
One owner runs everything from her phone. The full spec is docs/SPEC.md — read the
sections a task names before writing code. If this file and the spec disagree, this
file wins; tell me about the conflict.

## Non-negotiables
1. Her exact studio address and pickup point are NEVER rendered on a public page,
   never in an RSC payload, never in an API response, never in a public settings
   read. They live under settings keys `private.*` and are read only by admin code.
   Publicly she is "Hindpiri, Ranchi".
2. Every uploaded image is re-encoded in the browser before upload. That strips EXIF,
   including GPS. No original file ever reaches Blob storage.
3. No customer accounts or logins. Customers reach their booking or order with a
   reference + phone, or a signed status link.
4. Bookings are requests. Nothing is booked until she approves it.
5. Press-ons are prepaid: making starts only after she marks the order paid. No cash
   on delivery.
6. The site takes no payments: no payment buttons, UPI links, QR codes, transaction-ID
   forms or gateways. Customers pay on WhatsApp. She records payments in the admin, and
   recordPayment() in src/lib/domain/payments.ts is the only code that marks anything
   paid.
7. While settings `site.go_live` is false, every public route sits behind the preview
   password and every response carries `X-Robots-Tag: noindex, nofollow`. Fail closed:
   if the flag can't be read, treat the site as not live.
8. src/content/welcome-note.ts is frozen. Never edit, reformat, re-wrap, "fix" or
   translate it. A test checks its SHA-256.
9. Placeholder content (`is_placeholder = true`) never pretends to be real. Placeholder
   reviews render only while the site is not live.
10. No Instagram API. No social login. No dark-mode toggle (one theme, explicit
    `color-scheme`).

## Code rules
- Next.js 16 App Router, TypeScript strict, Tailwind v4, Drizzle ORM on Neon Postgres,
  Vercel Blob, Resend, zod, Vitest, Playwright, pnpm. Request interception lives in
  src/proxy.ts (Next 16 renamed middleware to proxy). If the installed Next major is
  not 16, stop and tell me.
- Money is integer paise everywhere. Format only at the edge with formatINR
  (`₹1,499`, no decimals). Never store or compute rupees as floats.
- Dates are stored as timestamptz (UTC). All slot and display logic runs in
  Asia/Kolkata via @date-fns/tz.
- Phones are stored E.164 (+91XXXXXXXXXX). Validate Indian mobiles /^[6-9]\d{9}$/
  after normalising. Pincodes /^[1-9]\d{5}$/.
- Pricing, slots, offers, shipping and lead time are pure functions in
  src/lib/domain/, shared by client and server. The server always recomputes; never
  trust a total from the client.
- Every WhatsApp message comes from src/lib/whatsapp/templates.ts. No inline message
  strings anywhere else.
- Settings are read through src/lib/settings/: getPublicSettings() for public code,
  getSettings() for admin code. The public reader has an allow-list; private keys are
  not in it.
- Every mutation: zod schema shared client and server, rate limited if public,
  `requireOwner()` if admin. Server actions re-check auth themselves; the proxy is
  not the only guard.
- Server Components by default. "use client" only on interactive leaves.
- Data access only through src/lib/db/queries/. Components never import the db client.
- Tokens only (src/styles/tokens.css). No hardcoded colours, radii, shadows, durations.
- User-facing strings in src/content/copy.ts. English; any Hindi/Urdu words in Roman
  script only.
- next/image with explicit `sizes` everywhere. No raw <img> except the SVG nail preview.
- Mobile first. Design and test at 360px wide first, then 768 and 1440. Touch targets
  44px. Respect prefers-reduced-motion.
- No `any`, no `@ts-ignore`, no disabled lint rules without a comment saying why.
- Never invent a price, policy, fee, testimonial, statistic or claim about the
  business. Anything not in docs/SPEC.md is a placeholder marked «TO CONFIRM».

## Definition of done for any task
Run `pnpm typecheck && pnpm lint && pnpm test` and the e2e specs the task touches.
Report in this shape, short: 1) what now works, in five lines or fewer, 2) anything
you assumed or skipped, 3) how I can check it myself. Full detail only if I ask.

## Chosen design direction
Direction A — Lookbook (SPEC §4.2), with the palette adjustments in
design/instagram/NOTES.md.
