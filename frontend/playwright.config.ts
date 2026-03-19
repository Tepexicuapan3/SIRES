import { defineConfig, devices } from "@playwright/test";

const CHROMIUM_ARGS = [
  "--disable-dev-shm-usage",
  "--ipc=host",
  "--disable-gpu",
  "--no-sandbox",
] as const;

const projects = [
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      launchOptions: {
        args: [...CHROMIUM_ARGS],
      },
    },
  },
  {
    name: "firefox",
    use: {
      ...devices["Desktop Firefox"],
    },
  },
  {
    name: "webkit",
    use: {
      ...devices["Desktop Safari"],
    },
  },
  {
    name: "chrome",
    use: {
      ...devices["Desktop Chrome"],
      channel: "chrome",
      launchOptions: {
        args: [...CHROMIUM_ARGS],
      },
    },
  },
];

if (process.env.ZEN_BROWSER_PATH) {
  projects.push({
    name: "zen",
    use: {
      ...devices["Desktop Firefox"],
      launchOptions: {
        executablePath: process.env.ZEN_BROWSER_PATH,
      },
    },
  });
}

/**
 * Playwright Configuration - SIRES E2E Tests
 */
export default defineConfig({
  testDir: "./src/test/e2e",
  testMatch: "**/*.e2e.ts",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: "http://localhost:5173",

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video on failure */
    video: "on-first-retry",

    /* Context options */
    viewport: { width: 1280, height: 720 },

    /* Action timeout */
    actionTimeout: 5000,

    /* Navigation timeout */
    navigationTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects,

  /* Run local dev server before starting the tests */
  webServer: {
    command:
      'docker-compose -f ../docker-compose.yml up -d backend mysql redis && until [ "$(curl -s -o /dev/null -w \'%{http_code}\' http://localhost:5000/api/v1/auth/login)" != "000" ]; do sleep 1; done && docker-compose -f ../docker-compose.yml stop frontend && npm run dev -- --host 0.0.0.0 --port 5173',
    url: "http://localhost:5173",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
