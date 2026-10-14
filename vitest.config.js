import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["shared/**/*.test.js", "server/**/*.test.js", "netlify/**/*.test.js", "api/**/*.test.js"] },
});
