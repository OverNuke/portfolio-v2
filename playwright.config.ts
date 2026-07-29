import { defineConfig } from "@playwright/test";

/**
 * Task 1.3 (sdd/phase2-app-shell, design D9): @playwright/test as a real
 * devDependency, not ad-hoc npx. webServer runs the built app via
 * `pnpm run preview` (vite preview's default port, 4173) — no shell-only
 * operators, so this resolves the same way on Windows and POSIX/CI.
 *
 * `pnpm e2e` builds first (see package.json) so this always previews a
 * fresh dist/, never a stale one.
 */
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
  },
  webServer: {
    command: "pnpm run preview",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
