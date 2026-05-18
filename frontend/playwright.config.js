import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT || '5175';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === '1';
const isDemo = process.env.PLAYWRIGHT_DEMO === '1';
const includeDemos = process.env.PLAYWRIGHT_INCLUDE_DEMOS === '1';
// Run with a visible browser locally; stay headless only in CI.
// Override locally with PLAYWRIGHT_HEADLESS=1.
const headless = !!process.env.CI || process.env.PLAYWRIGHT_HEADLESS === '1';
// Slow each action down when running headed so the run is watchable.
const slowMo = Number(process.env.PLAYWRIGHT_SLOW_MO || (headless ? 0 : 400));

export default defineConfig({
  testDir: './tests',
  testIgnore: includeDemos ? [] : ['**/*.demo.spec.js'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // One worker when headed so browser windows don't overlap and stay watchable.
  workers: headless ? undefined : 1,
  reporter: 'html',
  use: {
    baseURL,
    headless,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isDemo ? 'on' : 'retain-on-failure',
    launchOptions: {
      slowMo,
    },
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
