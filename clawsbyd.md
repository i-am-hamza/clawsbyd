# Claws by D — Build Prompts

Nail art web app for Hindpiri, Ranchi. Portfolio → bookings → press-ons, all ending on
WhatsApp. One owner, phone-first admin. Hidden behind a preview password until she
flips "Go live". No payments on the site: customers pay on WhatsApp and she records it.

**How this works.** Three files go in the repo before session 1:
`CLAUDE.md` (root), `docs/SPEC.md`, and this file at `claude/clawsbyd.md`. Each session
below is one paste block. `/clear` between sessions. Sessions point at SPEC sections
instead of repeating them, so the spec stays the single source of truth — edit the
spec, not old prompts.

Thirteen sessions. Sessions 1–3 need no customer-facing data. Session 6 is the first
time the public site looks alive.

---

## 0 — Before session 1 (you, not Claude Code, ~30 minutes)

### 0.1 Decide these first
1. **Vercel plan.** Hobby is non-commercial only. Build on Hobby if you like, but the
   project must be on Pro before "Go live". Budget for it or pick another host now.
2. **Her phone.** Find out whether she uses iPhone or Android. Test the admin on that
   kind of phone first.
3. **WhatsApp or WhatsApp Business** on +91 92410 99696. Either works with wa.me links.
   Business gives her labels and quick replies; suggest it on reveal day, don't switch
   it secretly.

### 0.2 Accounts and services
1. **GitHub repo** `clawsbyd` (private). Add the three files.
2. **Vercel project** from the repo. Framework: Next.js.
3. **Neon via Vercel Marketplace:** Project → Storage → Create Database → Neon. Region:
   Singapore (`aws-ap-southeast-1`) — the closest to Ranchi. Connect to all
   environments. This injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
   In the Neon console create a branch `test` and copy its pooled URL as
   `DATABASE_URL_TEST`.
4. **Vercel Blob:** Storage → Create → Blob → connect. Injects `BLOB_READ_WRITE_TOKEN`.
5. **Resend:** create an account and an API key. Add the sending domain
   `send.clawsbyd.one-sentient.one` (Domains → Add). Resend shows 3–4 DNS records
   (an MX and TXT for SPF on the `send…` name, a DKIM TXT on `resend._domainkey…`).
   Create them exactly as shown wherever one-sentient.one's DNS lives. Until it says
   Verified, Resend only delivers to your own account email.
6. **Local env:** `vercel env pull .env.local`, then add:
   ```
   DATABASE_URL_TEST=postgres://...test-branch...
   RESEND_API_KEY=re_...
   EMAIL_FROM="Claws by D <bookings@send.clawsbyd.one-sentient.one>"
   SESSION_SECRET=<openssl rand -base64 32>
   SIGNED_LINK_SECRET=<openssl rand -base64 32>
   PREVIEW_PASSWORD=<something you'll give friends who test>
   CRON_SECRET=<openssl rand -base64 32>
   OWNER_EMAIL=<her email — the reset-password link goes here>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   Add the same (with production values) in Vercel → Settings → Environment Variables.
   `git check-ignore .env.local` must print the filename.

### 0.3 Reference material
- `design/instagram/` — save 8–15 screenshots of her profile grid and her best posts.
  **They didn't come through in the chat, so the palettes in SPEC §4 are educated
  defaults until Claude Code reads these.**
- `seed/looks/` (optional but strongly recommended) — her real photos plus
  `looks.csv` (SPEC §16.5). Full-resolution phone screenshots of her posts are fine for
  now; she can replace them after the reveal. A lookbook of her own work on reveal day
  lands far better than placeholders.

---

# 1 — Scaffold, design system, two directions

````
Read CLAUDE.md, then docs/SPEC.md §3 and §4. No database this session.

1. Scaffold: Next.js 16 App Router (confirm the installed major is 16 before anything
   else), TypeScript strict, Tailwind v4, ESLint, pnpm, Vitest, Playwright. Create the
   folder layout from SPEC §3.3 with empty index files where useful.
   Scripts: dev, build, typecheck, lint, test, test:e2e.

2. Read every image in design/instagram/. Write design/instagram/NOTES.md: her dominant
   colours (hex), backgrounds, the mood range across her grid, her 5 strongest posts and
   why. Adjust the two palettes in SPEC §4.2 and §4.3 toward what's actually there and
   list each change with the reason. If the folder is empty, say so and use the spec.

3. src/styles/tokens.css with BOTH directions as [data-direction="a"] and
   [data-direction="b"] token sets, plus the shared tokens (§4.5). Fonts via
   next/font/google with only the axes used (§4.2, §4.3). Check every text/background
   pair in both directions for AA (4.5:1 body, 3:1 large) and print the table.

4. src/lib/nail-svg.ts: pure nailPath(shape, length) → SVG path d for all 7 shapes ×
   4 lengths, plus a <NailPreview> component (five nails, fill colours, chrome and
   cat-eye finishes). Snapshot tests for all 28 paths.

5. Brand placeholders (§4.7): wordmark component in each direction's display font,
   "D in an almond nail" monogram SVG, favicon, apple-touch icon, manifest icons.

6. The mood shift (§4.6) as a reusable <MoodProvider> that sets --mood from 0–1 and
   derives accent colour and display weight. Check AA at mood 0, 0.25, 0.5, 0.75, 1.

7. /design-preview: a toggle between A and B showing, for each: the header, a hero with
   a strip of 6 placeholder nail swatch cards running dainty → glam with the mood shift
   applied, a lookbook card, a service row with a price, a primary and secondary button,
   a form field with an error, the launch-offer banner, a bottom sheet, the admin bottom
   tab bar, the welcome-note screen styling (use lorem text here, not the real note).

UI primitives in src/components/ui/: Button, IconButton, Input, Select, Textarea,
Chip, ChipGroup, Badge, Card, Sheet (bottom sheet on mobile, dialog on desktop),
Stepper (quantity), ProgressSteps, Tabs, Accordion, Toast, Skeleton, EmptyState,
PriceTag (uses formatINR), CopyField. Tokens only.

Verify: pnpm dev serves /design-preview. Screenshots at 360 and 1440 for A and B.
typecheck, lint, test clean. Then stop and ask me which direction to keep.
````

**After session 1:** pick A or B. Tell Claude Code: "Keep direction X. Delete the other
token set and the preview toggle, and write the choice into CLAUDE.md under 'Chosen
design direction'." Keep `/design-preview` (dev-only) for later sessions.

---

# 2 — Database, settings, domain engines, seed

````
Read CLAUDE.md, then SPEC §2, §5, §6, §7, §16.

1. Drizzle + Neon. Driver must support interactive transactions (SPEC A2). Schema in
   src/lib/db/schema.ts exactly as §5, enums included. drizzle-kit migrations in
   drizzle/. Scripts: db:generate, db:migrate, db:seed, db:reset (test branch only —
   refuse to run when DATABASE_URL points anywhere but DATABASE_URL_TEST or localhost).

2. Settings registry (§6): zod schema per key, defaults, public flag. read.ts exposes
   getPublicSettings() (allow-list, cached with tag 'settings') and getSettings()
   (server-only module, imports 'server-only'). A unit test asserts no private.* key
   can come out of getPublicSettings().

3. Pure domain modules (§7): pricing.ts (§7.1), slots.ts (§7.2), order pricing and
   shipping (§7.3), leadtime.ts (§7.4), mapping.ts (§7.5), status.ts transition tables
   (§7.6), refs.ts (§3.8), signed-link.ts (§3.7). Plus format/inr.ts, format/dates.ts
   (IST), validation/phone.ts, validation/pincode.ts. No database calls inside these.

4. Unit tests: everything listed under "Unit" in §17 that exists so far. Pricing ≥ 20
   cases. Slots must include: a home visit that would end at 18:10 (rejected), a hold
   that expired an hour ago (slot free), a bridal date 13 days out (rejected), a
   blocked half-day.

5. Seed (§16), idempotent. Dev/test seed puts the sentinels in private.studio_address
   and private.pickup_point. Owner row from OWNER_EMAIL without a password.

6. src/lib/db/queries/: typed functions for everything the next sessions will read.
   Components never import the db client.

Verify: db:migrate and db:seed run twice without errors or duplicates. pnpm test
shows the domain suites. Print row counts per table.
````

---

# 3 — Owner auth, admin shell, Go-live gate, welcome note

````
Read CLAUDE.md, then SPEC §3.5, §3.6, §9 (shell only), §14.1, §15.

1. Auth (§3.5): argon2id, DB sessions, login, logout, sign out everywhere,
   forgot/reset by email (Resend), rate limits. scripts/owner-set-password.ts with a
   hidden interactive prompt → `pnpm owner:set-password`. requireOwner() used by the
   admin layout and every admin action.

2. Admin shell (§9): bottom tab bar (Home · Bookings · Orders · Looks · More) on
   mobile, sidebar on desktop, header with the site status pill, footer with the heart
   icon. Empty placeholder pages for every admin route in §3.3. The WhatsApp action
   sheet component (§9 "Action pattern") with an editable textarea and Open WhatsApp.

3. Gate (§14.1) in src/proxy.ts: preview page, preview cookie, X-Robots-Tag, robots.ts
   Disallow while not live, sitemap 404 while not live, noindex metadata, fail closed.
   A public server action wrapper that rejects when not live and no preview cookie.

4. Welcome note (§15): create src/content/welcome-note.ts with the exact text from
   SPEC §15 — copy it byte for byte, LF line breaks, no trailing newline. Add the hash
   test. Build /admin/welcome with first-login redirect, ?again=1 and ?preview=1,
   "Chaliye shuru karein", fade-in respecting reduced motion. scripts/welcome-arm.ts →
   `pnpm welcome:arm` (asks for confirmation and prints which database it's about to
   touch).

Verify (e2e, 360×740):
- go_live=false: / redirects to /preview; wrong password stays; right password reaches
  /; every response has X-Robots-Tag noindex; /robots.txt disallows; /sitemap.xml 404.
- go_live=true: no redirect, no noindex header.
- Login → welcome note → tap the button → dashboard. Log out, log in → dashboard
  directly. Heart → note → back. ?again=1 leaves welcome_seen_at unchanged.
- welcome:arm → next login shows the note again.
- Hash test passes. Then change one character, watch it fail, revert.
````

---

# 4 — Media pipeline and Lookbook admin

````
Read CLAUDE.md, then SPEC §9.7, §16.5, §17 (upload test).

1. src/lib/images/compress.ts (client): decode (HEIC via a fallback decoder when the
   browser can't), resize to max 2000 px long edge, re-encode WebP q≈0.8 with JPEG
   fallback, produce width/height and a tiny blur data URL. Re-encoding through canvas
   strips EXIF; never upload the original file.

2. Client uploads to Vercel Blob via /api/blob/upload (handleUpload): admin uploads
   require the owner session; customer inspiration uploads get a short-lived token,
   rate limited, image types only, 10 MB cap before compression. addRandomSuffix on.
   Check the current Vercel Blob docs for private access and use it for inspiration
   uploads if available (SPEC A23). Record each upload in media.

3. Admin Lookbook (§9.7): grid, multi-upload with per-file progress, tag sheet with
   big glam chips, bulk edit, drag reorder with up/down fallback, publish/feature,
   delete with blob cleanup, mapping overrides.

4. Seed path for seed/looks/looks.csv (§16.5) using the same compression code (run it
   in Node with sharp, which also strips metadata), else placeholder SVG looks.

5. Daily cron route /api/cron/daily (CRON_SECRET): delete inspiration media older than
   7 days that no booking/design references. vercel.json cron once a day.

Verify: upload tests/fixtures/gps.jpg (create it with GPS EXIF) through the real UI in
Playwright; fetch the stored blob; exifr finds no GPS and no camera make/model. Upload
5 photos from a 360px viewport and tag them in under a minute. Screenshots.
````

---

# 5 — Admin: catalogue, availability, areas, settings, content

````
Read CLAUDE.md, then SPEC §9.5, §9.6, §9.8, §9.9, §9.10, §9.11, §9.12.

Build these admin screens on the seeded data, mobile first:
1. Services (§9.8) with drag reorder and the edit sheet.
2. Availability (§9.5): weekly hours editor, slot settings, and "Block time off" in two
   taps (button → chip → saved). Blocking a range that contains confirmed bookings
   lists them first.
3. Home-visit areas (§9.6).
4. Shop products (§9.9).
5. Reviews (§9.10) — admin side only.
6. Content (§9.11): markdown editor with preview for pages and FAQs, «TO CONFIRM»
   highlighted. Sizing chart and presets editor.
7. Settings (§9.12), every group, each its own screen. Private group clearly labelled.
   Go-live switch present but its pre-flight list comes in session 11 — for now it
   asks "Are you sure?" only.
Every save: zod, requireOwner, audit_log, revalidateTag('settings') where relevant,
toast "Saved".

Verify: change a service price, an area fee, the UPI ID and exam mode; audit_log shows
before/after for each. Two-tap blocking works on 360px. typecheck, lint, test clean.
````

---

# 6 — Public site: chrome, Home, Lookbook, Services, content pages

````
Read CLAUDE.md, then SPEC §8.1–§8.4, §8.11, §14.3.

1. Public chrome (§8 Global chrome): header, footer, floating WhatsApp button above the
   safe area, launch-offer banner from settings, exam note on shop routes.
2. Home (§8.1) with every listed state.
3. Lookbook (§8.2): server-rendered data, client filtering, the Dainty ↔ Glam slider
   driving --mood (accent + display weight), URL sync with replaceState, filters sheet,
   removable chips, "Closest to this vibe" empty state, no-looks state. No React
   re-render of the grid per drag frame.
4. Look detail (§8.3) with Book this look / Get it as press-ons links (targets can 404
   until sessions 7 and 10).
5. Services (§8.4).
6. Content pages (§8.11): sizing guide as a tech-pack-style spec sheet, care guide,
   about, FAQ with contact block, policies.
All copy in src/content/copy.ts. Every image next/image with sizes and blur.

Verify: screenshots at 360, 768, 1440 of Home, Lookbook at mood 1/3/5, a look, Services,
Sizing guide — once with 6 looks, once with 40. Lighthouse mobile on Home and Lookbook
(report LCP, CLS, score). The privacy grep (§17) passes. Reduced motion: slider still
filters, no animation.
````

---

# 7 — Booking flow, status pages, WhatsApp, email

````
Read CLAUDE.md, then SPEC §8.5, §8.9, §8.10, §10.1–§10.3, §11, §12, §13.

1. src/lib/whatsapp/: link builder and every template in §11 as typed functions.
   Snapshot tests per template; each full wa.me URL under 2,000 chars.
2. Booking flow /book (§8.5): five steps, prefill from ?service ?look ?design, running
   total from pricing.ts, slot picker from slots.ts (server-fed), sessionStorage
   persistence, inspiration upload (session 4 pipeline), submit via server action that
   re-prices and re-checks the slot, /book/done with Send on WhatsApp.
3. src/lib/domain/payments.ts (§13): recordPayment, idempotent, unit tested. Nothing
   payment-related on public pages — the upi:// grep from §17 goes in now.
4. /status and /s/[ref] (§8.10) with the timeline and payment status text. The page
   never shows the studio address.
5. Email to her (§12) with React Email, non-blocking.

Verify (e2e, 360×740): studio extension booking → request saved → email sent (use a
test inbox or Resend's test mode) → done page WhatsApp link decodes to the §11.1 text.
Home visit under ₹999 can't submit; on-request area submits with "fee confirmed on
WhatsApp". Slot taken between steps → friendly error back to step 2. /s/[ref] with a
bad k → invalid message. Privacy test passes on every new route.
````

---

# 8 — Admin bookings, recording payments, calendar, dashboard

````
Read CLAUDE.md, then SPEC §9.1, §9.2, §9.4, §9.5 (calendar), §7.6, A3, A4, A12.

1. Bookings list and detail (§9.2) with every action. Each action is one transaction
   with status_events + audit_log, then opens the WhatsApp sheet with the right
   template. Approve re-runs the slot engine and fails clearly if the slot is gone.
   Deposit-required approvals send §11.2 (no address). The address goes out only in
   §11.3, after she records the deposit.
2. Record-payment sheet (§9.4) behind Deposit received, the "No payment needed" option,
   the repeated-reference warning, and the /admin/payments log with refunds.
3. Launch-offer counter wiring (A12) inside the confirm transaction, with the warning
   when spots hit 0 before confirmation.
4. Expired holds: computed on read everywhere; the daily cron marks them expired.
5. Calendar week list with one-tap reminders (§11.7).
6. Dashboard (§9.1) "Needs you", "This week", quick controls.

Verify (e2e): the full SPEC §10.1 flow, customer and admin sides, on 360×740 — request →
approve (§11.2 has the payment sentence with the UPI ID and ref, and no address) →
Deposit received → confirmed (§11.3 has the sentinel address) → complete with final bill → review link. Also: no-deposit booking
gets the address at approval; hold expiry frees the slot; cancelling an offer booking
returns the spot.
````

---

# 9 — Build Your Set

````
Read CLAUDE.md, then SPEC §8.6, §10.7, §7.5.

/build as a playful stepper: shape → length → vibe (reuse the slider) → colours (up to
three named swatches + custom) → occasion → inspiration upload. Live NailPreview from
nail-svg.ts. Final summary card with Book this in person / Order as press-ons, each
creating a design_drafts row and routing with ?design=. Booking and /shop/custom read
the design and pre-fill. Back/forward and refresh keep progress (sessionStorage).

Verify: screenshots of every step at 360. Both exits pre-fill correctly (e2e).
Keyboard-only run-through works. The preview renders all 7 shapes × 4 lengths.
````

---

# 10 — Press-on shop, checkout, orders

````
Read CLAUDE.md, then SPEC §8.7, §8.8, §9.3, §10.4, §10.5, §7.3, §7.4, A14–A16.

1. /shop, /shop/[slug], /shop/custom (§8.7) with the three size modes, sizing kit as
   its own product, exam-mode lead time and note.
2. Cart (localStorage, try/catch) and /checkout (§8.8): Indian address with state
   dropdown and pincode validation, pickup option, coupon field, lead time and dispatch
   window, policy tick. Server re-prices everything.
3. Order creation → /s/[ref] with Send on WhatsApp (§11.9). Admin: Send payment
   details (§11.9b), Payment reminder (§11.11), Mark paid via the record-payment sheet.
4. Admin orders (§9.3) with the making sheet (finger grid), status stepper, courier and
   tracking, the right WhatsApp sheet per step, pickup variants.
5. Sizing-kit coupon (A14) issued in recordPayment; coupons redeemable once and
   bound to the phone; unpaid order expiry (A16).

Verify (e2e): order two sets above ₹1,499 → free shipping; one Classic set → ₹79;
pickup → ₹0. Mark paid → making → shipped (§11.12 has tracking) → delivered.
Sizing kit paid → code issued → used once on a set → second use rejected. Exam mode on →
product, cart and order all show 10–14 days. sizes_pending order shows the banner in
admin. Privacy test still passes (pickup sentinel never public).
````

---

# 11 — Reviews, referrals, Go-live pre-flight, cron

````
Read CLAUDE.md, then SPEC §8.12, §9.10, §9.12 (Go live), A13, §16.7.

1. /review/[ref]?k= (§8.12) → pending review → admin approve → appears on Home.
2. Placeholder reviews render only while not live.
3. Referral credit button on completed bookings (A13) → two coupons → §11.16 sheets.
4. Go-live pre-flight list (§9.12) with live counts; confirm to go live; turning off
   restores the gate.
5. Daily cron: expire holds and unpaid orders, purge rate_limits, orphan media cleanup.

Verify (e2e): leave a review from a signed link → approve → visible on Home. With
go_live=true placeholder reviews disappear from Home HTML. Pre-flight shows the right
warnings on the seeded data. Cron route rejects without CRON_SECRET.
````

---

# 12 — Hardening pass (report, don't fix silently)

````
No new features. For each item, report findings first, then fix only what I approve.

1. Privacy — trace every path by which private.studio_address, private.pickup_point,
   a customer's phone or address could reach a public response: Server Components,
   server actions, route handlers, RSC payloads, OG images, JSON-LD, emails. Run the
   §17 privacy tests as guest and with a preview cookie. Show the trace.
2. Admin auth — call every admin server action and route handler without a session;
   all must refuse. Session fixation, logout, sign out everywhere.
3. Abuse — rate limits on every public action; honeypots; upload token limits;
   status-lookup enumeration (ref + wrong phone must not reveal anything).
4. Payments — amount tampering (client sends a lower total), recording a payment
   twice, recordPayment idempotency, and proof that no payment UI or upi:// link exists
   on any public route.
5. Contrast — every text-on-image instance against the real looks, and the mood range.
6. Performance — Lighthouse mobile on Home, Lookbook, a product, /book: LCP, CLS,
   score; image bytes per page; public JS per route.
7. Accessibility — axe on every route; keyboard through the slider, booking flow,
   checkout, admin tag sheet; focus visible; 44px targets; reduced motion.
8. Tokens and strings — grep for hardcoded colours, radii, shadows, durations,
   inline copy, inline WhatsApp text.
9. Placeholders — list every «TO CONFIRM», is_placeholder row and sentinel.
10. Security headers and CSP (allow Blob and Google Fonts only as needed), no secret
    in the client bundle (grep the build output for every secret's value).
````

---

# 13 — Ship to production

````
Read CLAUDE.md, then SPEC §14.2.

1. SEO for when live (§14.2): metadata per page, JSON-LD, sitemap, dynamic OG images
   for looks and products. Confirm none of it is served while go_live=false.
2. Production readiness: env vars present in Vercel for Production (list which are
   missing, never print values), migrations applied to production, production seed
   with real settings defaults and NO sentinels, owner password set, Resend domain
   verified, cron registered.
3. Write README.md: setup, env vars, scripts, how to run the welcome:arm script, how
   to add a look, how to restore the database from a Neon branch/point-in-time.
4. Write docs/OWNER-GUIDE.md for her, plain language, phone screenshots: approving a
   booking, recording a payment, blocking exam weeks, adding looks, changing prices,
   exam mode, going live.

Verify: the production URL loads behind the preview password with noindex. Admin
login works on a real phone. Print a reveal-day test script for me: one booking with a
deposit and one press-on order, end to end, from a phone.
````

---

## Domain: clawsbyd.one-sentient.one

1. Vercel → Project → Settings → Domains → Add → `clawsbyd.one-sentient.one` →
   assign to Production.
2. Vercel shows the record to create. It will be a **CNAME**:
   - Name/Host: `clawsbyd`
   - Value: the target shown on the domain card (Vercel now gives each project its own
     `…vercel-dns…` target; `cname.vercel-dns.com` is the generic fallback if no
     project-specific one is shown)
   - TTL: auto / 300
3. Create it where one-sentient.one's DNS is managed. If that's Cloudflare, set the
   record to **DNS only** (grey cloud), not proxied.
4. If the zone has CAA records, make sure one allows `letsencrypt.org`, or the SSL
   certificate won't issue.
5. Make sure no other record (A, AAAA, another CNAME) exists for `clawsbyd`.
6. Wait for "Valid Configuration" in Vercel, then set `NEXT_PUBLIC_SITE_URL` in
   Production and redeploy. Check `dig clawsbyd.one-sentient.one CNAME +short`.
7. Resend records from 0.2 step 5 live in the same zone under `send.clawsbyd`.

If she later wants her own domain (e.g. clawsbyd.in), add it in Vercel, make it primary,
keep the subdomain as a redirect. Nothing in the app hardcodes the host.

---

## Reveal-day checklist

**The week before (you)**
- [ ] Project on Vercel Pro.
- [ ] Production DB seeded without sentinels; `private.studio_address` and
      `private.pickup_point` left blank for her, or filled if you know them exactly.
- [ ] Lookbook loaded with her real work (12–20 looks), glam levels tagged with your
      best guess — she'll correct them. Placeholder looks unpublished.
- [ ] Every WhatsApp message from a test booking and a test order reads correctly on a
      real phone, including the payment sentence with her UPI ID. Don't send real
      payments to her UPI ID before the reveal — she'd get the notification.
- [ ] Resend domain verified; a test booking emails her address (use your own email in
      `contact.owner_notify_email` until the reveal, then switch).
- [ ] Domain live with SSL. Site still behind the preview password, noindex.
- [ ] Owner password set to something you'll hand her written down.
- [ ] `pnpm welcome:arm` against **production**, and then don't log into production
      admin again. Use `/admin/welcome?preview=1` if you need to check the note.

**With her (in this order)**
1. She logs in on her own phone → the note opens → "Chaliye shuru karein".
2. Add the admin to her home screen (Share → Add to Home Screen / Install app).
3. She changes the password (Settings → Account) and confirms her notification email.
4. Settings → Private: exact studio address, directions, pickup point. Then Settings →
   Payments: her UPI ID and the payment sentence her messages use.
5. Prices: walk through Services; she adjusts anything, including "from" prices.
6. Service durations (they're guesses) and weekly hours around her classes; block her
   next exam weeks in two taps.
7. Home-visit areas: correct each band and fee.
8. Deposits, cancellation, home-visit and press-on policies: read together, edit.
9. Press-ons: products, names, photos, lead time, exam mode off/on.
10. Sizing chart and S/M/L presets against the tip brand she actually uses.
11. FAQs and About: clear every «TO CONFIRM».
12. Launch offer: confirm ₹200 and 25 spots; referral ₹100; sizing credit ₹149.
13. Delete or hide the placeholder reviews and products she doesn't want.
14. Logo: keep the placeholder wordmark or upload hers.
15. One full test from her phone: book as a customer → approve → Deposit received →
    confirmation message. Then cancel it.
16. Go live → pre-flight list shows no warnings → confirm.
17. Instagram bio link → `https://clawsbyd.one-sentient.one`. Optional story announcing
    the launch offer.

**After going live**
- [ ] `/robots.txt` allows, `/sitemap.xml` loads, X-Robots-Tag gone.
- [ ] Submit the sitemap in Google Search Console (verify the subdomain with a DNS TXT).
- [ ] Suggest a Google Business Profile as a service-area business with the address
      hidden — for "nail art Ranchi" searches it will matter more than the website.
- [ ] Phase 2 list (SPEC §18) once she's used it for a few weeks and knows what she wants.
