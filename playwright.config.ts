import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3210);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    colorScheme: "dark",
    screenshot: "only-on-failure",
    // Allow a pre-installed Chromium (e.g. CI images) instead of downloading one.
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {}),
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `sh scripts/start-standalone.sh`,
        url: `http://localhost:${PORT}/api/health`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          PORT: String(PORT),
          HOSTNAME: "127.0.0.1",
          DATABASE_PATH: process.env.E2E_DATABASE_PATH ?? "./data/e2e.db",
          WEATHER_PROVIDER: "mock",
          QUOTE_PROVIDER: "local",
        },
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    // Chromium-based mobile emulation so a single browser install covers both projects.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
