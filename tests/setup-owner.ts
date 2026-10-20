/**
 * Isolated DB script — called by global-setup.ts via spawnSync.
 * Hashes E2E_OWNER_PASSWORD with argon2id and upserts the owner row.
 * Reads DATABASE_URL, OWNER_EMAIL, E2E_OWNER_PASSWORD from process.env.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { hash } from '@node-rs/argon2';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

async function main() {
  const url = process.env['DATABASE_URL'];
  const email = process.env['OWNER_EMAIL'];
  const password = process.env['E2E_OWNER_PASSWORD'];

  if (!url) throw new Error('DATABASE_URL not set');
  if (!email) throw new Error('OWNER_EMAIL not set');
  if (!password) throw new Error('E2E_OWNER_PASSWORD not set');

  const passwordHash = await hash(password, {
    algorithm: 2, // argon2id
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(
      `INSERT INTO owner (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      [email, passwordHash],
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
