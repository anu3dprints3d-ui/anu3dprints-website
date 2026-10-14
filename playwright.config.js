import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env.local"); // optional; CI can pass real env vars instead
} catch {
  /* no .env.local */
}

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  // Requires a real .env.local pointing at a Supabase project with migrations + seed applied.
  webServer: { command: "npm run build && node server/index.js", env: { PORT: String(port) }, port, reuseExistingServer: true, timeout: 300_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-320", use: { ...devices["Pixel 5"], viewport: { width: 320, height: 640 } } },
    { name: "mobile-390", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
  ],
});
