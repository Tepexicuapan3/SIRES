import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROMIUM_ARGS = [
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-sandbox",
];

const smokePort = Number(process.env.PLAYWRIGHT_SMOKE_PORT ?? "4173");
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${smokePort}`;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.resolve(currentDir, "../src/test/e2e"),
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"]],
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
          args: [...CHROMIUM_ARGS],
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
