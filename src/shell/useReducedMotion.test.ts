import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Task 2.5 (sdd/phase2-app-shell). Shared hook design flagged in batch 3
 * (`TurnProvider`'s local `prefersReducedMotion()` inline check) and named
 * in design's file layout under `shell/`. `useSyncExternalStore` over
 * `matchMedia`, feature-detected so it never throws where `matchMedia` is
 * absent (jsdom 25 has none — confirmed via grep before writing this test).
 */
describe("useReducedMotion", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    } else {
      // @ts-expect-error -- restoring jsdom's default absence of matchMedia
      delete window.matchMedia;
    }
  });

  it("returns false when matchMedia is unavailable (jsdom default)", () => {
    // @ts-expect-error -- simulate jsdom's real environment
    delete window.matchMedia;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("reflects matchMedia's current match state", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("subscribes/unsubscribes via addEventListener/removeEventListener on mount/unmount", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener,
      removeEventListener,
    }) as unknown as typeof window.matchMedia;

    const { unmount } = renderHook(() => useReducedMotion());
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
