const path = require("node:path");

const { defineConfig, devices } = require("@playwright/test");

const CHROMIUM_ARGS = [
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-sandbox",
];

const authPort = Number(process.env.PLAYWRIGHT_AUTH_PORT ?? "4174");
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${authPort}`;

const harnessMode = process.env.PLAYWRIGHT_AUTH_HARNESS_MODE ?? "backend-real";
const apiBaseUrl =
  process.env.PLAYWRIGHT_API_BASE_URL ?? "http://backend:5000/api/v1";
const useMsw = process.env.VITE_USE_MSW ?? "false";

module.exports = defineConfig({
  testDir: path.resolve(__dirname, "../src/test/e2e"),
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: process.env.PW_AUTH_REPORTER === "line" ? "line" : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    navigationTimeout: 25_000,
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
    command: `PLAYWRIGHT_AUTH_HARNESS_MODE=${harnessMode} PLAYWRIGHT_API_BASE_URL=${apiBaseUrl} VITE_USE_MSW=${useMsw} bun run dev -- --host 0.0.0.0 --port ${authPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
