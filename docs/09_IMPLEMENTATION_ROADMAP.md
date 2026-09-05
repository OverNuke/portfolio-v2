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

- Profile module — merged into Home 2026-08-12 (the editorial Home
  redesign carried the identity content, so `/profile` was briefly
  redundant), then **reinstated as its own route 2026-08-28** as **PAGE
  01**. This branch's editorial direction produced a real Profile screen —
  a manga-panel portrait collage beside an identity type stack, from the
  `Profile Page UI Mockups` handoff — that Home has no room for.
  `src/components/profile-hero/` + `src/routes/ProfilePage.tsx`. Routes are
  now `/profile`, `/certifications` (PAGE 02), `/projects` (PAGE 03),
  `/contact` (PAGE 04).
- Project database
- ~~Skills module~~ — removed 2026-07-31: ships as part of the Home
  collage instead (Skills badge field + ~~Certificate/Award plates~~), not
  a standalone routed page. See `12_COLLAGE_SYSTEM.md`.
  _(Updated 2026-08-01: Certificate/Award plates have since moved off Home
  into their own routed module, `/certifications` — see
  `03_UX_ARCHITECTURE.MD`. The Skills badge field is unaffected and still
  ships as part of the Home collage as described.)_

---j

## Phase 3.5

Update module and components to use an editorial design style (added
2026-08-12): redesign `/certifications`, `/projects`, `/contact` to match
Home's editorial language (serif-display/serif-edit type roles + the
module readout pattern from `src/shell/wheel/wheel.css`). Mock up in
`docs/design-exploration/` before porting to React, per the existing
three-directions convention — nothing in `src/` changes until a direction
is picked.

_(Updated 2026-08-12: `/projects` went beyond the page-frame-only scope
this phase describes above. Keff sanctioned overturning
`project-sheet.css`'s "never touch, never rotate, never overlap" rule for
this module specifically — the composition itself was rebuilt as a
scattered, asymmetric layout (`projectLayouts.ts`), not just given a new
header. See `project-sheet.css`'s own header comment for the full record.
`/certifications` and `/contact` are unaffected and still follow this
phase's original page-frame-only scope.)_

_(Updated 2026-09-02: the target is now stated precisely. `/certifications`,
`/projects`, and `/contact` each conform to their **surface register**
(`01_ART_DIRECTION.MD`) on the shared "Sheet" spine — not "match Home's
editorial language" loosely. `/profile` (Expressive) and `/contact`
(Instrument) already do. Open task: bring `/certifications` (Record) back
onto the spine — it currently ships three deviations imported from the bento
handoff:_
- _`border-radius: 8px` on portrait mats + ledger scans → back to `0`
  (`cert-wall.css`'s `--cw-radius` and its allowlist; `certifications-page.css`;
  `CertLedger` scan style)._
- _`320ms` `ease-soft` tile hover → `--dur-micro` / `--ease-hard`
  (`cert-wall.css`; drop the "one soft-cut exception" comment)._
- _zero rotation → **kept**, now a defined Record-register trait, no change._

_This is a CSS-only follow-up; the specs above already record the ruling.
Verify with `pnpm run audit:collage` and a browser pass at desktop /
tablet-portrait / 390px.)_

_(Updated 2026-09-04, `sdd/design-import-sections`. The three deviations above
are now **resolved by reconciliation rather than by blind revert** — the Claude
Design import of 2026-09-04 rebuilds the Record register's tile surface, which
changes what two of the three deviations even mean.)_

- _**`border-radius: 8px` — partly moot, partly still a revert.** The landscape
  wall's mats no longer have corners to round: under the hand-cut `clip-path`
  tiles (`01_ART_DIRECTION.MD`, "Hand-cut edges") the polygon **is** the corner
  treatment, and `border-radius` on the host has nothing to act on. The
  `--cw-radius` allowlist loses two of its three entries in the same change —
  `.cert-mat` (superseded by the clip) and `.cert-pager__dot-glyph` (the dot
  pager is replaced by square "01"/"02" number tabs). **Still open, unchanged,
  and still a straight revert to `0`:** `[data-sheet="portrait"] .cert-mat__scan`
  and `CertLedger`'s `.cert-row__scan`. The portrait ladder and the ledger are
  out of scope for the import (the mockup is landscape-only), so they keep their
  8px until someone reverts it deliberately._
- _**`320ms` `ease-soft` tile hover → `--dur-micro` / `--ease-hard`. Unchanged;
  execute as written.** Worth recording that the 2026-09-04 mockup asks for the
  opposite — its card transition is `.32s cubic-bezier(.2,.85,.2,1)`, i.e.
  exactly the soft cut currently shipped. **It was overruled.** Doc 07's
  2026-09-02 withdrawal ("Mechanical hard-cut motion is spine, not a per-surface
  choice … that exception is withdrawn") is a later-dated correction to a project
  specification; a design mockup is not one, and the conflict order puts Project
  Vision above Implementation. The hover keeps its lift and its shadow deepen —
  only the duration and curve change._
- _**zero rotation → kept**, now a defined Record-register trait, no change. The
  import rotates all thirty-plus of its elements; every one of them ships at
  `0deg`. The checklist is in
  `docs/design-exploration/design-import-2026-09-04/HANDOFF.md` §2.4._

_No longer CSS-only: the import also replaces the dot pager with numbered tabs,
adds arrow-key sheet paging (which `/certifications` does not have today), and
rebuilds `/contact` and `/projects`. Verify with `pnpm run audit:collage`,
`pnpm e2e`, and a browser pass at desktop / tablet-portrait / 390px._

---

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
