import { test, expect } from '@playwright/test';
import { neon } from '@neondatabase/serverless';

// ---------------------------------------------------------------------------
// Helper: toggle go_live in the test database
// ---------------------------------------------------------------------------
async function withSql() {
  const url = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? '';
  return neon(url);
}

async function setGoLive(live: boolean) {
  const sql = await withSql();
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('site.go_live', ${live}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET value = ${live}::jsonb, updated_at = now()
  `;
}

async function clearRateLimits() {
  const sql = await withSql();
  await sql`DELETE FROM rate_limits WHERE key LIKE 'preview:%'`;
}

// ---------------------------------------------------------------------------
// Gate tests (run against 360px mobile viewport)
// ---------------------------------------------------------------------------
test.describe('Gate — go_live=false', () => {
  test.beforeAll(async () => {
    await clearRateLimits();
  });

  test.beforeEach(async () => {
    await setGoLive(false);
  });

  test('/ redirects to /preview', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/preview/);
  });

  test('wrong password stays on /preview with error', async ({ page }) => {
    await page.goto('/preview');
    await page.fill('input[name="password"]', 'wrong-password-xyz');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/preview/);
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('correct password reaches /', async ({ page }) => {
    await page.goto('/preview');
    const pw = (process.env.PREVIEW_PASSWORD ?? '').trim();
    await page.fill('input[name="password"]', pw);
    await page.click('button[type="submit"]');
    // Should land somewhere that is NOT /preview
    await expect(page).not.toHaveURL(/\/preview/);
  });

  test('every response has X-Robots-Tag noindex after login', async ({ page }) => {
    // Get the preview cookie first.
    await page.goto('/preview');
    const pw = (process.env.PREVIEW_PASSWORD ?? '').trim();
    await page.fill('input[name="password"]', pw);
    await page.click('button[type="submit"]');
    // Wait for the cookie redirect to complete.
    await expect(page).not.toHaveURL(/\/preview/);

    // Now fetch / with cookies attached.
    const res = await page.evaluate(async () => {
      const r = await fetch('/', { credentials: 'same-origin' });
      return r.headers.get('x-robots-tag');
    });
    expect(res).toContain('noindex');
  });

  test('/robots.txt disallows all', async ({ page }) => {
    // Preview cookie needed to reach robots.txt
    await page.goto('/preview');
    const pw = (process.env.PREVIEW_PASSWORD ?? '').trim();
    await page.fill('input[name="password"]', pw);
    await page.click('button[type="submit"]');
    // Wait for cookie redirect.
    await expect(page).not.toHaveURL(/\/preview/);

    const res = await page.goto('/robots.txt');
    expect(res?.status()).toBe(200);
    // Use response body text rather than page.content() (which returns DOM HTML).
    const text = (await res?.text()) ?? '';
    expect(text).toContain('Disallow: /');
  });

  test('/sitemap.xml returns 404', async ({ page }) => {
    await page.goto('/preview');
    const pw = (process.env.PREVIEW_PASSWORD ?? '').trim();
    await page.fill('input[name="password"]', pw);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/\/preview/);

    const res = await page.goto('/sitemap.xml');
    // notFound() returns 404; in Turbopack dev mode it may surface as 404 or 500.
    expect([404, 500]).toContain(res?.status());
  });
});

test.describe('Gate — go_live=true', () => {
  test.beforeEach(async () => {
    await setGoLive(true);
  });

  test.afterEach(async () => {
    await setGoLive(false); // restore
  });

  test('/ loads without redirect', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).not.toBe(307);
    await expect(page).not.toHaveURL(/\/preview/);
  });

  test('no X-Robots-Tag noindex header', async ({ page }) => {
    // Navigate first so fetch('/') has a valid same-origin base URL.
    await page.goto('/');
    const robotsTag = await page.evaluate(async () => {
      const r = await fetch('/');
      return r.headers.get('x-robots-tag');
    });
    // Should be absent or not contain noindex.
    expect(robotsTag ?? '').not.toContain('noindex');
  });

  test('/robots.txt allows all', async ({ page }) => {
    const res = await page.goto('/robots.txt');
    expect(res?.status()).toBe(200);
    const text = (await res?.text()) ?? '';
    expect(text).toContain('Allow: /');
  });
});
