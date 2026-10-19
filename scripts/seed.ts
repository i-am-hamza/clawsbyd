/**
 * Idempotent seed — safe to run multiple times.
 * Inserts defaults; skips rows that already exist.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../src/lib/db/client';
import {
  owner,
  settings,
  serviceCategories,
  services,
  availabilityRules,
  blockedPeriods,
  homeVisitAreas,
  products,
  reviews,
  faqs,
  pages,
  lookbookItems,
  lookbookItemMedia,
  media,
} from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { REGISTRY } from '../src/lib/settings/registry';
import { renderNailPreviewSVG, NAIL_SHAPES, NAIL_LENGTHS } from '../src/lib/nail-svg';
import { addDays, format } from 'date-fns';

const isDev = !process.env.DATABASE_URL?.includes('vercel-storage')
  || !!process.env.DATABASE_URL_TEST;

async function upsertSetting(key: string, value: unknown) {
  // Skip null defaults — they're stored as jsonb and null is a valid JSON value
  // but we only need to persist non-null defaults.
  if (value === null) return;
  await db
    .insert(settings)
    .values({ key, value: value as Record<string, unknown> })
    .onConflictDoUpdate({ target: settings.key, set: { value: value as Record<string, unknown> } });
}

async function main() {
  console.log('Seeding…');

  // ─── Settings (§16.10) ───────────────────────────────────────────────────
  for (const [key, def] of Object.entries(REGISTRY)) {
    let value = def.default;
    // In dev/test, overwrite private keys with sentinels
    if (isDev && key === 'private.studio_address') value = 'SENTINEL-ADDR-4417, Hindpiri';
    if (isDev && key === 'private.pickup_point') value = 'SENTINEL-PICKUP-9902';
    // Always keep the notify email in sync with OWNER_EMAIL.
    if (key === 'contact.owner_notify_email' && process.env.OWNER_EMAIL) {
      await upsertSetting(key, process.env.OWNER_EMAIL.trim());
      continue;
    }
    const [existing] = await db.select().from(settings).where(eq(settings.key, key));
    if (!existing) await upsertSetting(key, value);
  }
  console.log('  settings ✓');

  // ─── Owner (§16.10) ──────────────────────────────────────────────────────
  const ownerEmail = process.env.OWNER_EMAIL?.trim();
  if (!ownerEmail) throw new Error('OWNER_EMAIL env var is required for seed');
  // There is always exactly one owner row. Update its email if it changed.
  const allOwners = await db.select().from(owner);
  if (allOwners.length === 0) {
    await db.insert(owner).values({ email: ownerEmail });
    console.log('  owner row created');
  } else if (allOwners[0]!.email !== ownerEmail) {
    await db.update(owner).set({ email: ownerEmail });
    console.log('  owner email updated');
  }
  console.log('  owner ✓');

  // ─── Service categories (§16.1) ──────────────────────────────────────────
  const cats = [
    { slug: 'gel', name: 'Gel on natural nails', description: null, sortOrder: 0 },
    { slug: 'extensions', name: 'Extensions', description: 'Gel or polygel, solid gel colour included', sortOrder: 1 },
    { slug: 'nail-art-addons', name: 'Nail art add-ons', description: null, sortOrder: 2 },
    { slug: 'maintenance', name: 'Maintenance', description: null, sortOrder: 3 },
  ];

  for (const cat of cats) {
    const [ex] = await db.select().from(serviceCategories).where(eq(serviceCategories.slug, cat.slug));
    if (!ex) await db.insert(serviceCategories).values({ ...cat, isActive: true });
  }
  console.log('  service_categories ✓');

  // Get category IDs
  const catRows = await db.select().from(serviceCategories);
  const catId = (slug: string) => catRows.find((c) => c.slug === slug)!.id;

  // ─── Services (§16.1) ────────────────────────────────────────────────────
  const svcs = [
    {
      slug: 'gel-polish-solid',
      categoryId: catId('gel'),
      name: 'Gel polish, solid colour (hands)',
      description: null,
      pricePaise: 49900,
      priceIsFrom: false,
      perNail: false,
      durationMin: 45,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: true,
      freeWithNewSet: false,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 0,
    },
    {
      slug: 'gel-polish-french-chrome-cat-eye',
      categoryId: catId('gel'),
      name: 'Gel polish with French, chrome or cat-eye finish',
      description: null,
      pricePaise: 69900,
      priceIsFrom: false,
      perNail: false,
      durationMin: 60,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: true,
      freeWithNewSet: false,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 1,
    },
    {
      slug: 'gel-overlay-biab',
      categoryId: catId('gel'),
      name: 'Gel overlay / BIAB (strengthening, no added length)',
      description: null,
      pricePaise: 79900,
      priceIsFrom: false,
      perNail: false,
      durationMin: 60,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: true,
      freeWithNewSet: false,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 2,
    },
    {
      slug: 'gel-polish-feet',
      categoryId: catId('gel'),
      name: 'Gel polish, feet',
      description: null,
      pricePaise: 44900,
      priceIsFrom: false,
      perNail: false,
      durationMin: 45,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: true,
      freeWithNewSet: false,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 3,
    },
    {
      slug: 'extensions-short-medium',
      categoryId: catId('extensions'),
      name: 'Short to medium length',
      description: 'Gel or polygel extensions, solid gel colour included',
      pricePaise: 119900,
      priceIsFrom: false,
      perNail: false,
      durationMin: 120,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: true,
      freeWithNewSet: false,
      isExtensionSet: true,
      depositKind: 'standard' as const,
      minLeadDays: 0,
      sortOrder: 0,
    },
    {
      slug: 'extensions-long-xl',
      categoryId: catId('extensions'),
      name: 'Long / XL length',
      description: null,
      pricePaise: 149900,
      priceIsFrom: false,
      perNail: false,
      durationMin: 150,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: true,
      freeWithNewSet: false,
      isExtensionSet: true,
      depositKind: 'standard' as const,
      minLeadDays: 0,
      sortOrder: 1,
    },
    {
      slug: 'signature-set',
      categoryId: catId('extensions'),
      name: 'Signature set (French, chrome, ombre or cat-eye)',
      description: null,
      pricePaise: 149900,
      priceIsFrom: true,
      perNail: false,
      durationMin: 150,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: true,
      freeWithNewSet: false,
      isExtensionSet: true,
      depositKind: 'standard' as const,
      minLeadDays: 0,
      sortOrder: 2,
    },
    {
      slug: 'glam-set',
      categoryId: catId('extensions'),
      name: 'Glam set (full hand-painted art, 3D, charms)',
      description: null,
      pricePaise: 199900,
      priceIsFrom: true,
      perNail: false,
      durationMin: 180,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: true,
      freeWithNewSet: false,
      isExtensionSet: true,
      depositKind: 'standard' as const,
      minLeadDays: 0,
      sortOrder: 3,
    },
    {
      slug: 'bridal-set',
      categoryId: catId('extensions'),
      name: 'Bridal set (consultation included)',
      description: null,
      pricePaise: 249900,
      priceIsFrom: true,
      perNail: false,
      durationMin: 210,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: true,
      freeWithNewSet: false,
      isExtensionSet: true,
      depositKind: 'bridal' as const,
      minLeadDays: 14,
      sortOrder: 4,
    },
    {
      slug: 'addon-simple-art',
      categoryId: catId('nail-art-addons'),
      name: 'Simple art (dots, lines, minimal florals)',
      description: null,
      pricePaise: 5000,
      priceIsFrom: false,
      perNail: true,
      durationMin: 0,
      perNailDurationMin: 5,
      isAddon: true,
      isNewSet: false,
      freeWithNewSet: false,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 0,
    },
    {
      slug: 'addon-detailed-art',
      categoryId: catId('nail-art-addons'),
      name: 'Detailed hand-painted art',
      description: null,
      pricePaise: 10000,
      priceIsFrom: false,
      perNail: true,
      durationMin: 0,
      perNailDurationMin: 10,
      isAddon: true,
      isNewSet: false,
      freeWithNewSet: false,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 1,
    },
    {
      slug: 'addon-3d-charms',
      categoryId: catId('nail-art-addons'),
      name: '3D, charms or stones',
      description: null,
      pricePaise: 15000,
      priceIsFrom: false,
      perNail: true,
      durationMin: 0,
      perNailDurationMin: 10,
      isAddon: true,
      isNewSet: false,
      freeWithNewSet: false,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 2,
    },
    {
      slug: 'refill-infill',
      categoryId: catId('maintenance'),
      name: 'Refill / infill (within 3–4 weeks)',
      description: null,
      pricePaise: 79900,
      priceIsFrom: false,
      perNail: false,
      durationMin: 90,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: false,
      freeWithNewSet: false,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 0,
    },
    {
      slug: 'repair',
      categoryId: catId('maintenance'),
      name: 'Repair',
      description: null,
      pricePaise: 9900,
      priceIsFrom: false,
      perNail: true,
      durationMin: 0,
      perNailDurationMin: 15,
      isAddon: false,
      isNewSet: false,
      freeWithNewSet: false,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 1,
    },
    {
      slug: 'gel-polish-removal',
      categoryId: catId('maintenance'),
      name: 'Gel polish removal',
      description: null,
      pricePaise: 19900,
      priceIsFrom: false,
      perNail: false,
      durationMin: 30,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: false,
      freeWithNewSet: true,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 2,
    },
    {
      slug: 'extension-removal',
      categoryId: catId('maintenance'),
      name: 'Extension removal',
      description: null,
      pricePaise: 29900,
      priceIsFrom: false,
      perNail: false,
      durationMin: 45,
      perNailDurationMin: null,
      isAddon: false,
      isNewSet: false,
      freeWithNewSet: true,
      isExtensionSet: false,
      depositKind: 'none' as const,
      minLeadDays: 0,
      sortOrder: 3,
    },
  ];

  for (const svc of svcs) {
    const [ex] = await db.select().from(services).where(eq(services.slug, svc.slug));
    if (!ex) await db.insert(services).values({ ...svc, isActive: true });
  }
  console.log('  services ✓');

  // ─── Availability rules (§16.2) ──────────────────────────────────────────
  // Mon–Fri 16:00–20:00, Sat 10:00–19:00, Sun 11:00–17:00
  const avRules = [
    { weekday: 1, startTime: '16:00', endTime: '20:00' },
    { weekday: 2, startTime: '16:00', endTime: '20:00' },
    { weekday: 3, startTime: '16:00', endTime: '20:00' },
    { weekday: 4, startTime: '16:00', endTime: '20:00' },
    { weekday: 5, startTime: '16:00', endTime: '20:00' },
    { weekday: 6, startTime: '10:00', endTime: '19:00' },
    { weekday: 0, startTime: '11:00', endTime: '17:00' },
  ];

  const existingRules = await db.select().from(availabilityRules);
  if (existingRules.length === 0) {
    await db.insert(availabilityRules).values(avRules.map((r) => ({ ...r, isActive: true })));
  }
  console.log('  availability_rules ✓');

  // One blocked range two weeks out labelled "Exams (sample)"
  const twoWeeksOut = addDays(new Date(), 14);
  const twoWeeksEnd = addDays(new Date(), 16);
  const blockStart = format(twoWeeksOut, 'yyyy-MM-dd');
  const blockEnd = format(twoWeeksEnd, 'yyyy-MM-dd');

  const [existingBlock] = await db
    .select()
    .from(blockedPeriods)
    .where(eq(blockedPeriods.reason, 'Exams (sample)'));
  if (!existingBlock) {
    await db.insert(blockedPeriods).values({
      startsOn: blockStart,
      endsOn: blockEnd,
      reason: 'Exams (sample)',
    });
  }
  console.log('  blocked_periods ✓');

  // ─── Home-visit areas (§16.3) ────────────────────────────────────────────
  const hvAreas = [
    // Within 4km (₹100)
    { name: 'Hindpiri', band: 'within_4km' as const, travelFeePaise: 10000, sortOrder: 0 },
    { name: 'Main Road', band: 'within_4km' as const, travelFeePaise: 10000, sortOrder: 1 },
    { name: 'Upper Bazar', band: 'within_4km' as const, travelFeePaise: 10000, sortOrder: 2 },
    { name: 'Lalpur', band: 'within_4km' as const, travelFeePaise: 10000, sortOrder: 3 },
    { name: 'Karamtoli', band: 'within_4km' as const, travelFeePaise: 10000, sortOrder: 4 },
    { name: 'Kanta Toli', band: 'within_4km' as const, travelFeePaise: 10000, sortOrder: 5 },
    { name: 'Ratu Road', band: 'within_4km' as const, travelFeePaise: 10000, sortOrder: 6 },
    { name: 'Morabadi', band: 'within_4km' as const, travelFeePaise: 10000, sortOrder: 7 },
    // 4–8km (₹200)
    { name: 'Doranda', band: 'km_4_to_8' as const, travelFeePaise: 20000, sortOrder: 8 },
    { name: 'Harmu', band: 'km_4_to_8' as const, travelFeePaise: 20000, sortOrder: 9 },
    { name: 'Bariatu', band: 'km_4_to_8' as const, travelFeePaise: 20000, sortOrder: 10 },
    { name: 'Kokar', band: 'km_4_to_8' as const, travelFeePaise: 20000, sortOrder: 11 },
    { name: 'Ashok Nagar', band: 'km_4_to_8' as const, travelFeePaise: 20000, sortOrder: 12 },
    { name: 'Argora', band: 'km_4_to_8' as const, travelFeePaise: 20000, sortOrder: 13 },
    { name: 'Hinoo', band: 'km_4_to_8' as const, travelFeePaise: 20000, sortOrder: 14 },
    { name: 'Kanke Road', band: 'km_4_to_8' as const, travelFeePaise: 20000, sortOrder: 15 },
    { name: 'Booty More', band: 'km_4_to_8' as const, travelFeePaise: 20000, sortOrder: 16 },
    // On request
    { name: 'Kanke', band: 'on_request' as const, travelFeePaise: null, sortOrder: 17 },
    { name: 'Dhurwa', band: 'on_request' as const, travelFeePaise: null, sortOrder: 18 },
    { name: 'Namkum', band: 'on_request' as const, travelFeePaise: null, sortOrder: 19 },
    { name: 'HEC', band: 'on_request' as const, travelFeePaise: null, sortOrder: 20 },
  ];

  for (const area of hvAreas) {
    const [ex] = await db.select().from(homeVisitAreas).where(eq(homeVisitAreas.name, area.name));
    if (!ex) await db.insert(homeVisitAreas).values({ ...area, isActive: true });
  }
  console.log('  home_visit_areas ✓');

  // ─── Products (§16.4) ───────────────────────────────────────────────────
  const allShapes = NAIL_SHAPES;
  const allLengths = NAIL_LENGTHS;

  const prods = [
    {
      slug: 'classic-solid',
      name: 'Classic Solid',
      tier: 'classic' as const,
      pricePaise: 69900,
      priceIsFrom: false,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 0,
    },
    {
      slug: 'micro-french',
      name: 'Micro French',
      tier: 'classic' as const,
      pricePaise: 69900,
      priceIsFrom: false,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 1,
    },
    {
      slug: 'glazed-chrome',
      name: 'Glazed Chrome',
      tier: 'classic' as const,
      pricePaise: 69900,
      priceIsFrom: false,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 2,
    },
    {
      slug: 'velvet-cat-eye',
      name: 'Velvet Cat-Eye',
      tier: 'classic' as const,
      pricePaise: 69900,
      priceIsFrom: false,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 3,
    },
    {
      slug: 'pearl-accent',
      name: 'Pearl Accent',
      tier: 'signature' as const,
      pricePaise: 89900,
      priceIsFrom: false,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 4,
    },
    {
      slug: 'cherry-accent',
      name: 'Cherry Accent',
      tier: 'signature' as const,
      pricePaise: 89900,
      priceIsFrom: false,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 5,
    },
    {
      slug: 'garden-party',
      name: 'Garden Party',
      tier: 'glam' as const,
      description: 'Hand-painted florals',
      pricePaise: 119900,
      priceIsFrom: true,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 6,
    },
    {
      slug: 'chrome-and-charms',
      name: 'Chrome & Charms',
      tier: 'glam' as const,
      description: '3D chrome with charms',
      pricePaise: 119900,
      priceIsFrom: true,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 7,
    },
    {
      slug: 'fully-custom',
      name: 'Fully Custom Set',
      tier: 'custom' as const,
      pricePaise: 129900,
      priceIsFrom: true,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 8,
    },
    {
      slug: 'bridal-press-ons',
      name: 'Bridal Set',
      tier: 'bridal' as const,
      pricePaise: 179900,
      priceIsFrom: true,
      shapesAllowed: allShapes,
      lengthsAllowed: allLengths,
      needsSizing: true,
      isPlaceholder: true,
      sortOrder: 9,
    },
    {
      slug: 'sizing-kit',
      name: 'Sizing Kit',
      tier: 'sizing_kit' as const,
      description: 'Find your perfect press-on size. ₹149 credit on your first set.',
      pricePaise: 14900,
      priceIsFrom: false,
      shapesAllowed: [] as typeof allShapes,
      lengthsAllowed: [] as typeof allLengths,
      needsSizing: false,
      isPlaceholder: false,
      sortOrder: 10,
    },
  ];

  for (const prod of prods) {
    const [ex] = await db.select().from(products).where(eq(products.slug, prod.slug));
    if (!ex) await db.insert(products).values({ ...prod, isActive: true });
  }
  console.log('  products ✓');

  // ─── Placeholder lookbook items (§16.5) ──────────────────────────────────
  const PALETTE: Record<number, string[]> = {
    1: ['#FAF6F7', '#F3E9EC', '#E8D5D9'],
    2: ['#F0C0CB', '#E8A8B6', '#D990A2'],
    3: ['#C97090', '#A3405A', '#8C2B45'],
    4: ['#851230', '#6B0E26', '#5A0B1F'],
    5: ['#2B0D16', '#4A1528', '#3D1020'],
  };

  const shapeCycle = [...NAIL_SHAPES];
  const occasionCycle = ['everyday', 'party', 'bridal', 'festive', 'college'] as const;
  // 4/4/4/3/3 distribution across glam levels 1–5
  const glamDistrib = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5];

  const existingLooks = await db.select().from(lookbookItems);
  if (existingLooks.length === 0) {
    const mediaRows = [];
    const lookRows = [];
    const lookMediaRows = [];

    for (let i = 0; i < 18; i++) {
      const glamLevel = glamDistrib[i]!;
      const shape = shapeCycle[i % shapeCycle.length]!;
      const length = NAIL_LENGTHS[i % NAIL_LENGTHS.length]!;
      const occasion = occasionCycle[i % occasionCycle.length]!;
      const colours = PALETTE[glamLevel]!;
      const isFeatured = i < 6;
      const slug = `look-placeholder-${String(i + 1).padStart(2, '0')}`;

      const svgData = renderNailPreviewSVG({ shape, length, colours });
      const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}`;
      const mediaId = crypto.randomUUID();
      const itemId = crypto.randomUUID();

      mediaRows.push({
        id: mediaId,
        url: dataUri,
        pathname: `placeholder/look-${slug}.svg`,
        width: 240,
        height: 300,
        alt: `Placeholder look: ${shape} ${length}`,
        kind: 'portfolio' as const,
        isPlaceholder: true,
      });

      lookRows.push({
        id: itemId,
        slug,
        glamLevel,
        shape,
        length,
        occasions: [occasion],
        colours,
        isFeatured,
        isPublished: true,
        isPlaceholder: true,
        sortOrder: i,
        publishedAt: new Date(),
      });

      lookMediaRows.push({
        itemId,
        mediaId,
        sortOrder: 0,
        isCover: true,
      });
    }

    await db.insert(media).values(mediaRows);
    await db.insert(lookbookItems).values(lookRows);
    await db.insert(lookbookItemMedia).values(lookMediaRows);
  }
  console.log('  lookbook_items ✓');

  // ─── Reviews (§16.7) ────────────────────────────────────────────────────
  const sampleReviews = [
    {
      customerName: 'Sample Client',
      body: 'Sample review — replace with a real one from a client.',
      rating: 5,
      kind: 'in_person' as const,
      status: 'approved' as const,
      isFeatured: true,
      isPlaceholder: true,
      source: 'admin' as const,
    },
    {
      customerName: 'Sample Client 2',
      body: 'Sample review — replace with a real one from a client.',
      rating: 5,
      kind: 'press_on' as const,
      status: 'approved' as const,
      isFeatured: false,
      isPlaceholder: true,
      source: 'admin' as const,
    },
    {
      customerName: 'Sample Client 3',
      body: 'Sample review — replace with a real one from a client.',
      rating: 5,
      kind: 'in_person' as const,
      status: 'approved' as const,
      isFeatured: false,
      isPlaceholder: true,
      source: 'admin' as const,
    },
  ];

  const existingReviews = await db.select().from(reviews);
  const placeholderReviews = existingReviews.filter((r) => r.isPlaceholder);
  if (placeholderReviews.length === 0) {
    await db.insert(reviews).values(sampleReviews);
  }
  console.log('  reviews ✓');

  // ─── FAQs (§16.8) ───────────────────────────────────────────────────────
  const faqData = [
    { category: 'Pricing', question: 'How much does a set cost?', answerMd: 'Gel polish from ₹449 (feet) and ₹499 (hands), extensions from ₹1,199, nail art from ₹50 per nail. Full menu: [Services](/services).', sortOrder: 0 },
    { category: 'Services', question: 'How long do sets last?', answerMd: '«TO CONFIRM gel polish wear time». Extensions are usually refilled within 3–4 weeks.', sortOrder: 1 },
    { category: 'Booking', question: 'Do I need to pay a deposit?', answerMd: '₹200 for any extension set or home visit, ₹500 for bridal, paid after I confirm your slot and adjusted in your final bill.', sortOrder: 2 },
    { category: 'Booking', question: 'How do I pay?', answerMd: 'On WhatsApp. Once I confirm your booking or order, I\'ll send you the UPI details. There\'s no payment on the website.', sortOrder: 3 },
    { category: 'Booking', question: 'Do you do home visits?', answerMd: 'Yes, for women clients, between 10 AM and 6 PM, within about 8 km of Hindpiri. Travel fee ₹100 up to 4 km, ₹200 for 4–8 km. Minimum booking ₹999.', sortOrder: 4 },
    { category: 'Booking', question: 'Can I reschedule or cancel?', answerMd: 'One free reschedule with 24 hours\' notice. Cancelling within 24 hours or not turning up means the deposit isn\'t refunded.', sortOrder: 5 },
    { category: 'Press-ons', question: 'How do I find my press-on size?', answerMd: 'Follow the [sizing guide](/sizing-guide), or get the ₹149 sizing kit — the ₹149 comes back as credit on your first set.', sortOrder: 6 },
    { category: 'Press-ons', question: 'How long do press-ons take?', answerMd: 'Made in 5–7 days, then shipped. Delivery time «TO CONFIRM courier estimate».', sortOrder: 7 },
    { category: 'Press-ons', question: 'How much is shipping?', answerMd: '₹79 anywhere in India, free above ₹1,499. Free pickup in Hindpiri for Ranchi customers.', sortOrder: 8 },
    { category: 'Press-ons', question: 'Can I return press-ons?', answerMd: "They're custom-made, so no returns. If a set arrives damaged, send an unboxing photo or video on WhatsApp within 48 hours and I'll remake or repair it.", sortOrder: 9 },
    { category: 'Press-ons', question: 'Can I reuse press-ons?', answerMd: 'Yes, see the [care guide](/care-guide). «TO CONFIRM how many wears».', sortOrder: 10 },
    { category: 'Contact', question: 'Where are you?', answerMd: 'Hindpiri, Ranchi. The exact address is shared on WhatsApp once your booking is confirmed.', sortOrder: 11 },
  ];

  const existingFaqs = await db.select().from(faqs);
  if (existingFaqs.length === 0) {
    await db.insert(faqs).values(faqData.map((f) => ({ ...f, isPublished: true })));
  }
  console.log('  faqs ✓');

  // ─── Pages (§16.9) ──────────────────────────────────────────────────────
  const pageData = [
    {
      slug: 'about',
      title: 'About',
      bodyMd: `# About Claws by D

«TO CONFIRM»

I'm a fashion technology student and nail artist based in Hindpiri, Ranchi. What started as a passion for nail art has grown into something I'm so proud of.

I specialise in everything from soft and dainty everyday nails to bold glam sets and bridal nail art. Every set is made with care.

Find me on Instagram @clawsby_d or book a set below.`,
    },
    {
      slug: 'care-guide',
      title: 'Press-on Care Guide',
      bodyMd: `# Press-on Care Guide

«TO CONFIRM» structure: apply / remove / reuse / store.

## How to apply

1. Clean and prep your natural nails.
2. Choose the correct size for each finger.
3. Apply adhesive tab or a small drop of nail glue.
4. Press firmly for 30 seconds.

## How to remove

Soak in warm soapy water for a few minutes, then gently lift from the side. Never force them off.

## How to reuse

Gently remove old adhesive. Store flat in the original box.

## Storage

Keep in the box, away from heat and direct sunlight.`,
    },
    {
      slug: 'sizing-guide',
      title: 'Press-on Sizing Guide',
      bodyMd: `# Press-on Sizing Guide

Measure each nail bed at the widest point with a soft tape measure or a strip of paper.

Match your measurement to the size chart below.

## Size chart

| Size | Width |
|------|-------|
| 0 | 18 mm |
| 1 | 17 mm |
| 2 | 16 mm |
| 3 | 15 mm |
| 4 | 14 mm |
| 5 | 13 mm |
| 6 | 12 mm |
| 7 | 11 mm |
| 8 | 10 mm |
| 9 | 9 mm |
| 10 | 8 mm |
| 11 | 7 mm |

## Presets

| Preset | Thumb | Index | Middle | Ring | Pinky |
|--------|-------|-------|--------|------|-------|
| S | 3 | 6 | 5 | 7 | 9 |
| M | 2 | 5 | 4 | 6 | 8 |
| L | 1 | 4 | 3 | 5 | 7 |`,
    },
    {
      slug: 'policy-booking',
      title: 'Booking & Cancellation Policy',
      bodyMd: `# Booking & Cancellation Policy

- Bookings are requests until confirmed by me on WhatsApp.
- A deposit of ₹200 is required for extension sets and home visits. ₹500 for bridal sets. This is adjusted in your final bill.
- One free reschedule with 24 hours' notice.
- Cancelling within 24 hours or not turning up: deposit is not refunded.
- More than 15 minutes late: design may be simplified or slot rescheduled.`,
    },
    {
      slug: 'policy-home-visits',
      title: 'Home Visit Policy',
      bodyMd: `# Home Visit Policy

- Home visits are for women clients only.
- Available between 10 AM and 6 PM.
- Within approximately 8 km of Hindpiri, Ranchi.
- Travel fee: ₹100 within 4 km, ₹200 for 4–8 km.
- Minimum booking ₹999.
- Please send your full address and location pin on WhatsApp after your booking is confirmed.`,
    },
    {
      slug: 'policy-press-ons',
      title: 'Press-on Policy',
      bodyMd: `# Press-on Policy

- All press-ons are custom-made to order.
- No returns on custom items.
- If a set arrives damaged: send an unboxing photo or video on WhatsApp within 48 hours. I'll remake or repair it.
- Making starts only after payment is received.`,
    },
    {
      slug: 'privacy',
      title: 'Privacy',
      bodyMd: `# Privacy

«TO CONFIRM»

**What we collect:** your name, WhatsApp number, delivery address (for orders), any inspiration photos you upload, and records of payments received.

**Why:** to process your booking or order and communicate with you about it.

**Who sees it:** only me.

**To request deletion:** message me on WhatsApp.`,
    },
  ];

  for (const page of pageData) {
    const [ex] = await db.select().from(pages).where(eq(pages.slug, page.slug));
    if (!ex) await db.insert(pages).values(page);
  }
  console.log('  pages ✓');

  // ─── Print row counts ────────────────────────────────────────────────────
  const counts = await Promise.all([
    db.select().from(settings).then((r) => ({ table: 'settings', count: r.length })),
    db.select().from(owner).then((r) => ({ table: 'owner', count: r.length })),
    db.select().from(serviceCategories).then((r) => ({ table: 'service_categories', count: r.length })),
    db.select().from(services).then((r) => ({ table: 'services', count: r.length })),
    db.select().from(availabilityRules).then((r) => ({ table: 'availability_rules', count: r.length })),
    db.select().from(blockedPeriods).then((r) => ({ table: 'blocked_periods', count: r.length })),
    db.select().from(homeVisitAreas).then((r) => ({ table: 'home_visit_areas', count: r.length })),
    db.select().from(products).then((r) => ({ table: 'products', count: r.length })),
    db.select().from(lookbookItems).then((r) => ({ table: 'lookbook_items', count: r.length })),
    db.select().from(media).then((r) => ({ table: 'media', count: r.length })),
    db.select().from(reviews).then((r) => ({ table: 'reviews', count: r.length })),
    db.select().from(faqs).then((r) => ({ table: 'faqs', count: r.length })),
    db.select().from(pages).then((r) => ({ table: 'pages', count: r.length })),
  ]);

  console.log('\nRow counts:');
  for (const { table, count } of counts) {
    console.log(`  ${table}: ${count}`);
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
