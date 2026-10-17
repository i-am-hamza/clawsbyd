/**
 * db:reset — drops and re-creates all tables.
 * Refuses to run unless DATABASE_URL points to DATABASE_URL_TEST or localhost.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.DATABASE_URL ?? '';
const testUrl = process.env.DATABASE_URL_TEST ?? '';

function isSafeTarget(dbUrl: string): boolean {
  return (
    dbUrl === testUrl ||
    dbUrl.includes('localhost') ||
    dbUrl.includes('127.0.0.1')
  );
}

if (!isSafeTarget(url)) {
  console.error(
    '\n❌  db:reset refused.\n' +
    '    DATABASE_URL does not point to DATABASE_URL_TEST or localhost.\n' +
    '    Set DATABASE_URL=<your test URL> before running this script.\n',
  );
  process.exit(1);
}

import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db/client';

async function main() {
  console.log('Dropping all tables in public schema…');

  await db.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  // Also drop enums
  await db.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  console.log('Done. Run pnpm db:migrate && pnpm db:seed to restore.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
