/**
 * Sync OWNER_EMAIL to the owner table and the contact.owner_notify_email setting.
 * Updates both dev (DATABASE_URL) and test (DATABASE_URL_TEST) databases.
 * Safe to run multiple times.
 *
 * Usage: pnpm owner:sync-email
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function syncDb(dbUrl: string, label: string, email: string) {
  const sql = neon(dbUrl);

  // Update the single owner row; insert if none exists yet.
  const updated = await sql`UPDATE owner SET email = ${email} RETURNING id`;
  if (updated.length === 0) {
    await sql`INSERT INTO owner (email) VALUES (${email})`;
    console.log(`  ${label}: owner row created`);
  } else {
    console.log(`  ${label}: owner email updated`);
  }

  // Upsert contact.owner_notify_email (stored as JSONB — use to_json to quote correctly).
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('contact.owner_notify_email', to_json(${email}::text), now())
    ON CONFLICT (key) DO UPDATE
      SET value      = to_json(${email}::text),
          updated_at = now()
  `;
  console.log(`  ${label}: contact.owner_notify_email updated`);
}

async function main() {
  const email = process.env.OWNER_EMAIL?.trim();
  if (!email) throw new Error('OWNER_EMAIL is not set in .env.local');

  const devUrl = process.env.DATABASE_URL;
  const testUrl = process.env.DATABASE_URL_TEST;

  if (!devUrl) throw new Error('DATABASE_URL is not set');

  await syncDb(devUrl, 'dev', email);

  if (testUrl && testUrl !== devUrl) {
    await syncDb(testUrl, 'test', email);
  } else {
    console.log('  test: DATABASE_URL_TEST not set or same as dev — skipped');
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
