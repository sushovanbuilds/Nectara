import { defineConfig } from "@playwright/test";

const PORT = 3100;
// Uses the installed Chrome by default so no browser download is needed.
// On CI: `npx playwright install chromium` and set PW_CHANNEL= (empty) to use the bundled one.
const channel = process.env.PW_CHANNEL === undefined ? "chrome" : process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: "tests-e2e",
  // Demo-mode data lives in the server's memory, so run one test at a time against one server.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, channel, trace: "retain-on-failure" },
  webServer: {
    // Needs a production build first: `npm run test:e2e` does both.
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Empty AI keys win over .env, so e2e never spends the free quota and the AI paths stay deterministic.
    env: { NECTARA_DEMO: "true", AUTH_SECRET: "e2e-auth-secret", QR_SECRET: "e2e-qr-secret", GEMINI_API_KEY: "", GROQ_API_KEY: "", RATE_LIMIT_MULTIPLIER: "100" },
  },
});
