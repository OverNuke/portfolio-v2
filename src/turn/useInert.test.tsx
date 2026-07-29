import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { setInert, useInert } from "./useInert";

/**
 * Task 2.3 (sdd/phase2-app-shell), design D4: React 18 has no `inert` prop,
 * so `setInert` is an imperative attribute pair — verified via
 * `toHaveAttribute` because jsdom reflects the `inert` ATTRIBUTE, not the
 * (unsupported) live property.
 */
describe("setInert", () => {
  it("sets both the inert attribute and aria-hidden together when turning on", () => {
    const el = document.createElement("div");
    setInert(el, true);

    expect(el).toHaveAttribute("inert");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("removes both the inert attribute and aria-hidden together when turning off", () => {
    const el = document.createElement("div");
    setInert(el, true);
    setInert(el, false);

    expect(el).not.toHaveAttribute("inert");
    expect(el).not.toHaveAttribute("aria-hidden");
  });
});

describe("useInert", () => {
  it("applies inert+aria-hidden to the ref target when `on` is true", () => {
    const el = document.createElement("div");
    const ref = { current: el };

    renderHook(() => useInert(ref, true));

    expect(el).toHaveAttribute("inert");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("does not apply inert+aria-hidden when `on` is false", () => {
    const el = document.createElement("div");
    const ref = { current: el };

    renderHook(() => useInert(ref, false));

    expect(el).not.toHaveAttribute("inert");
    expect(el).not.toHaveAttribute("aria-hidden");
  });

  it("clears inert+aria-hidden on unmount", () => {
    const el = document.createElement("div");
    const ref = { current: el };

    const { unmount } = renderHook(() => useInert(ref, true));
    expect(el).toHaveAttribute("inert");

    unmount();

    expect(el).not.toHaveAttribute("inert");
    expect(el).not.toHaveAttribute("aria-hidden");
  });
});
