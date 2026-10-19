import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.local' });

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: '360px', use: { ...devices['Galaxy S8'], viewport: { width: 360, height: 740 } } },
    { name: '1440px', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `${BASE_URL}/admin/login`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env['DATABASE_URL_TEST'] ?? process.env['DATABASE_URL'] ?? '',
      DATABASE_URL_UNPOOLED: process.env['DATABASE_URL_TEST_UNPOOLED'] ?? process.env['DATABASE_URL_UNPOOLED'] ?? '',
      PROXY_CACHE_MS: '0',
    },
  },
});
