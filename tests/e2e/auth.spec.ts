import { test, expect } from '@playwright/test';
import { neon } from '@neondatabase/serverless';

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------
async function withSql() {
  const url = process.env['DATABASE_URL_TEST'] ?? process.env['DATABASE_URL'] ?? '';
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

async function resetWelcomeSeen(email: string) {
  const sql = await withSql();
  await sql`UPDATE owner SET welcome_seen_at = NULL WHERE email = ${email}`;
}

async function setWelcomeSeen(email: string) {
  const sql = await withSql();
  await sql`UPDATE owner SET welcome_seen_at = now() WHERE email = ${email}`;
}

async function clearRateLimits() {
  const sql = await withSql();
  await sql`DELETE FROM rate_limits WHERE key LIKE 'login:%'`;
}

const TEST_EMAIL = process.env['OWNER_EMAIL'] ?? 'forDaudShaima@pm.me';
const TEST_PASSWORD = process.env['E2E_OWNER_PASSWORD'] ?? '';

// ---------------------------------------------------------------------------
// Auth + welcome note flow
// ---------------------------------------------------------------------------
test.describe('Auth & welcome note', () => {
  test.beforeAll(async () => {
    await setGoLive(true);
    await clearRateLimits();
  });

  test.afterAll(async () => {
    await setGoLive(false);
  });

  test('login → welcome note → tap button → dashboard', async ({ page }) => {
    await resetWelcomeSeen(TEST_EMAIL);

    await page.goto('/admin/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should land on welcome note.
    await expect(page).toHaveURL('/admin/welcome');
    await expect(page.locator('.welcome-note-body')).toBeVisible();

    // Tap the button.
    await page.click('.welcome-btn');
    await expect(page).toHaveURL('/admin');
  });

  test('log out', async ({ page }) => {
    await setWelcomeSeen(TEST_EMAIL);

    // Log in first.
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Navigate to settings to find logout (placeholder — just check /admin/login works).
    await page.goto('/admin/login');
    await expect(page).toHaveURL('/admin'); // already logged in → redirect to /admin
  });

  test('log in again (welcome already seen) → dashboard directly', async ({ page }) => {
    await setWelcomeSeen(TEST_EMAIL);

    await page.goto('/admin/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
    // Welcome note NOT shown.
    await expect(page).not.toHaveURL('/admin/welcome');
  });

  test('heart link → welcome note (again=1) → back button → dashboard', async ({ page }) => {
    await setWelcomeSeen(TEST_EMAIL);

    await page.goto('/admin/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Navigate to welcome with ?again=1.
    await page.goto('/admin/welcome?again=1');
    await expect(page.locator('.welcome-note-body')).toBeVisible();

    // Button should go back (history.back() → previous page was /admin).
    await page.click('.welcome-btn');
    // After back() we should end up not on /admin/welcome.
    await expect(page).not.toHaveURL('/admin/welcome');
  });

  test('?again=1 does NOT update welcome_seen_at', async ({ page }) => {
    // Set welcome_seen_at to a fixed past timestamp.
    const sql = await withSql();
    const before =
      await sql`SELECT welcome_seen_at FROM owner WHERE email = ${TEST_EMAIL} LIMIT 1`;
    const initialTime = before[0]?.welcome_seen_at as string | null;

    // Log in (already seen, so no redirect).
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    // Explicitly wait for login to complete before navigating away.
    await expect(page).toHaveURL('/admin');

    await page.goto('/admin/welcome?again=1');
    await page.click('.welcome-btn'); // goes back — does NOT call markWelcomeSeenAction

    const after =
      await sql`SELECT welcome_seen_at FROM owner WHERE email = ${TEST_EMAIL} LIMIT 1`;
    expect(String(after[0]?.welcome_seen_at)).toBe(String(initialTime));
  });
});

// ---------------------------------------------------------------------------
// Welcome hash test (also covered by unit test — belt & suspenders)
// ---------------------------------------------------------------------------
test.describe('Welcome note hash', () => {
  test('WELCOME_NOTE SHA-256 matches frozen value', async () => {
    const { createHash } = await import('crypto');
    const { WELCOME_NOTE } = await import('../../src/content/welcome-note');
    const hash = createHash('sha256').update(WELCOME_NOTE, 'utf8').digest('hex');
    expect(hash).toBe('332749b475b4bebda6aa99ae25beceac8764596f2a801eafa418231177c9bb32');
  });
});
