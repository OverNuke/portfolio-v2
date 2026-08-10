# IMPLEMENTATION ROADMAP

## Phase 1

Setup:

- React
- Vite
- TypeScript
- Tailwind

---

## Phase 2

Create:

- App shell
- Panel system
- Navigation

---

## Phase 3

Build:

- Profile module
- Project database
- ~~Skills module~~ — removed 2026-07-31: ships as part of the Home
  collage instead (Skills badge field + ~~Certificate/Award plates~~), not
  a standalone routed page. See `12_COLLAGE_SYSTEM.md`.
  _(Updated 2026-08-01: Certificate/Award plates have since moved off Home
  into their own routed module, `/certifications` — see
  `03_UX_ARCHITECTURE.MD`. The Skills badge field is unaffected and still
  ships as part of the Home collage as described.)_

---j

## Phase 4

Add, in sub-phases:

### 4.1 — Design planning

Finalize copy/content for new decorations, confirm color/contrast pairs against the /locked palette (no new tokens), sketch placement on the collage grid.

### 4.2 — Components

Implement the design as real components (grid-area placement only, per D5), respecting rotation cap and z-index bands.

### 4.3 — Spacing & visual verification

Tune placement across breakpoints; run `pnpm run audit:collage` at 1440/1280/1100/390px; manual check in a real browser via `pnpm dev`.

### 4.4 — Sound (optional)

Foundation + toggle only: user-initiated, off by default, persisted preference, no autoplay (WCAG 1.4.2). No specific soundscape locked in yet.

### 4.5 — Advanced effects

Textures, glitch/scan effects, per `docs/07_ANIMATION_GUIDELINES.md`'s mechanical/controlled motion philosophy — always with a hard `prefers-reduced-motion` fallback.

---

## Phase 5

Accessibility audit.
i18 system English and Spanish
