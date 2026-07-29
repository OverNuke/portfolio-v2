import { describe, expect, it } from "vitest";

/**
 * Task 1.2 (sdd/phase2-app-shell): proves BrowserRouter/MemoryRouter resolve
 * as named exports from whichever router package actually landed at install
 * time — react-router@^7.1.0 (design D2) if BrowserRouter/MemoryRouter
 * resolve from `react-router` on this Node version, otherwise the
 * react-router-dom@^6.30 fallback. See package.json for which one is real.
 */
describe("react-router smoke test", () => {
  it("resolves BrowserRouter and MemoryRouter without throwing", async () => {
    const routerModule = await import("react-router");

    expect(routerModule.BrowserRouter).toBeTypeOf("function");
    expect(routerModule.MemoryRouter).toBeTypeOf("function");
  });
});
