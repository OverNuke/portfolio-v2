import type { Config } from "tailwindcss";

/**
 * Colors, typography, space, motion, plate, and z-index scales mirror
 * src/styles/tokens.css — that file is the single source of truth (see
 * docs/11_HANDOFF_HOME.md, docs/12_COLLAGE_SYSTEM.md). Never hardcode a raw
 * value here; add a CSS var + entry in both places if the palette/scale
 * ever changes.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-white": "var(--paper-white)",
        ink: "var(--ink)",
        "ink-inverse": "var(--ink-inverse)",
        // Replaces Tailwind's default gray scale entirely (e.g. text-gray-500
        // no longer exists) — intentional, per design D1. Do not restore it.
        gray: "var(--gray)",
        "warning-yellow": "var(--warning-yellow)",
        "field-olive": "var(--field-olive)",
        "field-olive-deep": "var(--field-olive-deep)",
        // Replaces the retired signal-red pair (2026-08-05). One token, not
        // two — oxblood passes AA at any text size, so there is no
        // large-text/small-text split to mirror.
        oxblood: "var(--oxblood)",
        "oxblood-hi": "var(--oxblood-hi)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        hand: ["var(--font-hand)"],
      },
      fontSize: {
        "display-xl": "var(--text-display-xl)",
        "display-lg": "var(--text-display-lg)",
        "display-md": "var(--text-display-md)",
        "display-sm": "var(--text-display-sm)",
        body: "var(--text-body)",
        meta: "var(--text-meta)",
        micro: "var(--text-micro)",
      },
      letterSpacing: {
        label: "var(--track-label)",
        micro: "var(--track-micro)",
      },
      spacing: {
        "2xs": "var(--space-2xs)",
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        "2xl": "var(--space-2xl)",
        "rule-hair": "var(--rule-hair)",
        "rule-thick": "var(--rule-thick)",
        "hit-min": "var(--hit-min)",
      },
      transitionTimingFunction: {
        hard: "var(--ease-hard)",
      },
      transitionDuration: {
        micro: "var(--dur-micro)",
        cut: "var(--dur-cut)",
        turn: "var(--dur-turn)",
      },
      borderWidth: {
        plate: "var(--plate-border)",
      },
      boxShadow: {
        plate: "var(--plate-shadow)",
        "plate-sm": "var(--plate-shadow-sm)",
      },
      zIndex: {
        "plate-decor": "var(--z-plate-decor)",
        "plate-content": "var(--z-plate-content)",
        "plate-interactive": "var(--z-plate-interactive)",
        frame: "var(--z-frame)",
        layer: "var(--z-layer)",
        crease: "var(--z-crease)",
        wheel: "var(--z-wheel)",
        intro: "var(--z-intro)",
      },
    },
    // border-radius: 0 everywhere, enforced at the config level so
    // rounded-* utilities are inert rather than merely discouraged by convention.
    borderRadius: {
      none: "0px",
      sm: "0px",
      DEFAULT: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "0px",
    },
  },
  plugins: [],
} satisfies Config;
