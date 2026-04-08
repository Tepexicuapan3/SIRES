const path = require("node:path");

const { defineConfig, devices } = require("@playwright/test");

const CHROMIUM_ARGS = [
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-sandbox",
];

const smokePort = Number(process.env.PLAYWRIGHT_SMOKE_PORT ?? "4173");
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${smokePort}`;

module.exports = defineConfig({
  testDir: path.resolve(__dirname, "../src/test/e2e"),
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.PW_SMOKE_REPORTER === "line" ? "line" : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: CHROMIUM_ARGS,
        },
      },
    },
  ],
  webServer: {
    command: `VITE_USE_MSW=true bun run dev -- --host 0.0.0.0 --port ${smokePort} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
