import { defineConfig, devices } from "@playwright/test";

const CHROMIUM_ARGS = [
  "--disable-dev-shm-usage",
  "--ipc=host",
  "--disable-gpu",
  "--no-sandbox",
];

export default defineConfig({
  testDir: "./src/test/e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
    navigationTimeout: 10000,
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
});
