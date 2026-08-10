import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    // configDefaults.exclude REPLACES, it does not append — spreading it
    // keeps node_modules/.git excluded while also excluding Playwright
    // specs (task 1.3), which live outside jsdom's remit entirely.
    // "**/.claude/**" guards against a stray git worktree under
    // .claude/worktrees/ (e.g. from an isolated agent run) getting its own
    // node_modules swept into this project's test run. "_to_delete/**" is a
    // leftover staging/backup dir (untracked) with a stale component copy —
    // not part of the app, but vitest's default glob would still pick it up.
    exclude: [...configDefaults.exclude, "e2e/**", "**/.claude/**", "_to_delete/**"],
  },
});
