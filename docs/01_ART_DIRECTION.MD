# ART DIRECTION

## Visual Identity

Keywords:

- HUD / FUI (heads-up display, technical overlay)
- Streetwear from 90s and Y2
- Editorial archive
- Analog digital hybrid

---

# Reference Feeling

The design should resemble:

- fashion technical sheets
- scanned magazines
- experimental UI systems
- game interfaces

---

# Layout Philosophy

Use controlled chaos.

Elements should feel manually assembled.

Characteristics:

- overlapping panels
- asymmetric composition
- cropped images
- technical labels
- annotations
- visual noise

---

# Material Language

Use:

- paper texture
- scan lines
- photocopy artifacts
- grain
- tape effects
- imperfect alignment

Avoid:

- clean corporate perfection

---

# Surface Registers

> Added 2026-09-02 — after `/profile` shipped (2026-08-28) as a manga-panel
> collage, the question came up of how far Profile, Contact, and the
> certifications page ("DISTINCTIONS" in the nav) had drifted apart. The answer:
> they haven't drifted — they share a spine and vary in two deliberate ways. This
> section names that system so the variation reads as intentional. One surface
> (`/certifications`) had broken spine rules; see "The Record register" below and
> `09_IMPLEMENTATION_ROADMAP.md` Phase 3.5.

## The Sheet — the shared spine

Every routed surface (`/`, `/profile`, `/certifications`, `/projects`, `/contact`)
sits on the same substrate. These do **not** vary by register:

- **Newsprint ground** — `--paper` `#e4e4e2`, never pure white (`02_DESIGN_SYSTEM.MD`).
- **The collage grid** — `grid-area` placement, `z-index` = meaning, ±2° rotation
  cap, hard-offset shadow = stack depth. The "three controlled deviations only"
  rule in `12_COLLAGE_SYSTEM.md` governs all of them, not just Home.
- **The three plate tones** — `--light` (Paper White / Ink), `--mid` (Field Olive /
  Paper White), `--dark` (Ink / inverse), with the audited ratios in
  `02_DESIGN_SYSTEM.MD`. Shared primitive in code — `channelLayout.ts`'s `SLOT_TONE`
  cites `CertWall.tsx`'s `TileTone`.
- **Mono metadata** — every kicker, label, meta line, and status readout is
  tracked-uppercase JetBrains Mono (`02_DESIGN_SYSTEM.MD` Mono role).
- **`border-radius: 0`** — enforced by `tailwind.config.ts`; no register overrides it.
- **Mechanical motion** — hard-cut, `--ease-hard`, small (`07_ANIMATION_GUIDELINES.md`).
  No register uses soft/eased/bouncy motion.
- **One Oxblood content mark per screen** — the "open to work" chip / marker, and
  nothing else (`02_DESIGN_SYSTEM.MD`). Focus-ring colour is **tone-dependent**,
  not always Oxblood: next to a Field Olive plate the ring is Ink or Paper White
  (Oxblood on olive is the banned 1.90:1 pair) — `05_ACCESSIBILITY.MD` owns the pairs.
- **Right-to-left page turn** + its keyboard map (`03_UX_ARCHITECTURE.MD`,
  `05_ACCESSIBILITY.MD`).

## The registers — what actually varies

Two things, and only two: **display type** and **decorative vocabulary**.

| Register | Surface | Display type | Decorative vocabulary |
|---|---|---|---|
| **Expressive** | `/profile` | LT Remark display (transparent-stroke middle line) + one `--font-hand` scrap | `clip-path` angled panels, the diagonal gutter sweep, outlined "SFX" onomatopoeia, the speech-bubble creed tail |
| **Instrument** | `/contact` | JetBrains Mono only — no serif display | Ink connector "wires" tucked behind plates, the mechanical proximity dock (≤1.1 scale), an illustrated figure bleeding off the bottom edge, hand-cut `clip-path` plate edges (see "Hand-cut edges", below) |
| **Record** | `/certifications` | LT Remark titles + Mono meta | Faint blueprint-grid paper, hairline corner registration marks, the vertical "Certificate archive" ghost title, hand-cut `clip-path` tile edges (a 2–12px irregular cut, constant at every tile size), strictly grid-aligned mats (no rotation — see below) |

A surface's register is a fixed choice, not a menu. A new decorative element that
doesn't belong to its surface's register needs a case made for it, per
`MASTER_AGENT.md`'s "why does this exist?" test.

## Placement — every routed surface

- **`/` (Home)** — **Sheet baseline**, no added register. Home is what
  `12_COLLAGE_SYSTEM.md` was written for and what Phase 3.5's "match Home" refers
  to; it carries the spine and the seven composition roles, nothing register-specific.
- **`/profile`** — Expressive.
- **`/certifications`** — Record.
- **`/projects`** — **Sheet baseline** for now: the scattered-plate composition
  (`projectLayouts.ts`) plus the `.sheet-kg` giant-type layer are spine idioms
  (overlap + the "one exception is the hero" pattern), not a register. Promote it
  to its own register only if a case is made.
- **`/contact`** — Instrument.

## The Record register does not rotate

The rest of the Sheet rotates within the ±2° cap. `/certifications` deliberately
does not — every mat is grid-aligned. "Machine-true" is a **property of the Record
register**, not an exception to the rotation rule: an archivist's wall of
documents reads as authoritative precisely because it is square to the page, and
the contrast with the rotated surfaces around it is the point. No exception note
is needed anywhere for this.

## Hand-cut edges are how Record expresses the hand

*Added 2026-09-04, `sdd/design-import-sections`.*

The section above bans rotation on this register and gives the reason: an
archivist's wall reads as authoritative because it is square to the page. That
leaves Record with no way to say *handmade* at all — every other surface says it
with a tilt.

It says it with the **cut** instead. Each tile's outline is a
`clip-path: polygon()` whose four corners sit a few pixels off true, as though the
mat were trimmed by hand rather than die-cut. The tile stays axis-aligned — its
bounding box is still square to the grid, still occlusion-safe, still
hit-testable at its centre — and the irregularity lives entirely in the outline.

Two rules make this a register trait rather than a one-off effect:

1. **The cut depth is an absolute length, never a percentage.** A hand wanders by
   millimetres, not by a fraction of the sheet. A fixed `4px` nick reads as the
   same tool on a large tile and a small one; `1%` reads as two different tools.
   It also means the shape is identical at every breakpoint, so no `@media` rule
   ever overrides a `clip-path`.
2. **The cut is on a fill layer, never on the interactive element.** `clip-path`
   clips the focus ring along with everything else. The host element keeps its
   rectangle — and its `outline` — while a `position: absolute; inset: 0;
   z-index: -1` pseudo-element carries the background and the clip. The ink edge
   and the plate shadow are a `filter: drop-shadow()` chain on the *unclipped*
   host, which traces the clipped child's silhouette; a `border` or `box-shadow`
   on the clipped layer is drawn on its rectangle and clipped away.
   `project-field.css`'s `.pf-record__figure` is the reference implementation.

**Contact (Instrument) uses the same mechanism**, on its channel plates, for the
same reason — it does not rotate either. The vocabulary is shared; what stays
register-specific is everything else on the tile.

## Masthead

`02_DESIGN_SYSTEM.MD` reserves LT Superior Serif for the masthead — one instance
per screen. Where that instance lives by register:

- **Home** — the painted name on the canvas is the masthead.
- **Expressive** (`/profile`) — the LT Remark identity stack is the display voice;
  there is no separate Superior Serif masthead (the name *is* the composition).
- **Record** (`/certifications`) — the page title ("CERTIFICATE ARCHIVE"). Mat
  titles use LT Remark, never Superior Serif — `cert-wall.css` already notes this.
- **Instrument** (`/contact`) — the "CHANNELS" title, set in Mono, is the page's
  masthead slot; Instrument runs no serif at all.
