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
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
