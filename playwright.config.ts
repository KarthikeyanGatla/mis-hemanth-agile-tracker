import { defineConfig } from "@playwright/test";

const DB = "file:./e2e.db";

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  use: { baseURL: "http://localhost:3120" },
  webServer: {
    // Fresh, isolated database each run so e2e never touches dev data.
    command: `rm -f e2e.db && npx prisma migrate deploy && npx prisma db seed && npm run build && npm start -- -p 3120`,
    env: { DATABASE_URL: DB, AUTH_TRUST_HOST: "true", AUTH_SECRET: "e2e-secret" },
    url: "http://localhost:3120/login",
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
