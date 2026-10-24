import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/frontend",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  use: {
    baseURL:
      process.env.SITE_URL ||
      "http://127.0.0.1:4173/awesome-paper-research-skills/",
    headless: true,
    launchOptions: process.env.PW_EXECUTABLE_PATH
      ? { executablePath: process.env.PW_EXECUTABLE_PATH }
      : undefined,
    viewport: { width: 1440, height: 1000 },
  },
  webServer: process.env.SITE_URL
    ? undefined
    : {
        command: "npm run preview -- --port 4173",
        url: "http://127.0.0.1:4173/awesome-paper-research-skills/",
        reuseExistingServer: !process.env.CI,
      },
});
