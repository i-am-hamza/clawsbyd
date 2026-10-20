/**
 * Playwright global setup.
 *
 * Hashes E2E_OWNER_PASSWORD and writes it to the test-database owner row so
 * every spec that needs admin login finds a valid credential. Refuses to run
 * unless DATABASE_URL_TEST is set and different from DATABASE_URL.
 *
 * The DB write runs in a child process (tests/setup-owner.ts) so it is
 * fully isolated from Playwright's module loader, which causes connection
 * resets when neon's WebSocket driver is imported alongside a running
 * Next.js dev server.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

export default async function globalSetup(): Promise<void> {
  const testUrl = process.env['DATABASE_URL_TEST'];
  const mainUrl = process.env['DATABASE_URL'];

  if (!testUrl) {
    throw new Error(
      '[e2e global-setup] DATABASE_URL_TEST is not set — refusing to touch any database.',
    );
  }
  if (testUrl === mainUrl) {
    throw new Error(
      '[e2e global-setup] DATABASE_URL_TEST equals DATABASE_URL — ' +
        'refusing to modify the production database.',
    );
  }

  const ownerEmail = process.env['OWNER_EMAIL'];
  if (!ownerEmail) {
    throw new Error('[e2e global-setup] OWNER_EMAIL is not set.');
  }

  // Ensure E2E_OWNER_PASSWORD exists; generate and persist to .env.local if absent.
  let password = process.env['E2E_OWNER_PASSWORD'];
  if (!password) {
    password = randomBytes(18).toString('base64url'); // 24 URL-safe chars
    const envPath = path.resolve('.env.local');
    fs.appendFileSync(envPath, `\nE2E_OWNER_PASSWORD=${password}\n`);
    process.env['E2E_OWNER_PASSWORD'] = password;
  }

  // Run the actual DB write in an isolated child process to avoid WebSocket
  // collisions with the dev server that Playwright starts before globalSetup.
  // Use a relative path so shell=true on Windows doesn't trip on spaces in
  // the absolute project path (spawnSync doesn't quote args automatically).
  const result = spawnSync(
    'pnpm',
    ['tsx', 'tests/setup-owner.ts'],
    {
      shell: true, // required on Windows for .cmd shims
      cwd: path.resolve('.'),
      env: {
        ...process.env,
        DATABASE_URL: testUrl,
        E2E_OWNER_PASSWORD: password,
        OWNER_EMAIL: ownerEmail,
      },
      encoding: 'utf8',
      timeout: 30_000,
    },
  );

  if (result.status !== 0 || result.error) {
    const out = [result.stderr, result.stdout].filter(Boolean).join('\n') || String(result.error);
    throw new Error(`[e2e global-setup] setup-owner.ts failed (exit ${result.status}):\n${out}`);
  }
}
