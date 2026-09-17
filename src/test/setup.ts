import "@testing-library/jest-dom/vitest";

// jsdom does not implement matchMedia. Every prefers-reduced-motion spec
// (Phase 2/3 Tier-A layers) depends on this stub existing — without it
// those specs fail at the matchMedia call site, not at the assertion.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
