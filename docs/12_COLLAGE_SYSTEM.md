# COLLAGE SYSTEM — PLATES & THE OVERLAP GRID

> Added 2026-07-27 after Keff flagged that the v1 Home read as a dashboard
> with a skin on it rather than as an underground archive sheet. This doc
> **supersedes the "Layout" section of `11_HANDOFF_HOME.md`**; every other
> section of that file (tokens, states, keyboard map, motion, edge cases)
> still stands.
>
> Reference: the akatachi wldd product sheet named in
> `10_PROJECT_MANIFESTO.md`. Proof: `home.design-proof-v3.html`.
>
> **v3 (same day)** applied Keff's zoning sketch: name and modules left,
> note + two plates centre, big cropped figure right, technology badges
> bottom-right. It also removed the bio from Home, added a social row and
> a glitch layer, and replaced the generated hero with Keff's own
> illustrations. Sections below are current as of v3.

---

## The diagnosis

v1 obeyed every rule in `02_DESIGN_SYSTEM.MD` and still felt wrong, which
means the rules were not the problem. The problem was **composition**.

v1 was a dashboard: rectangular regions, shared edges, one 2px rule
between neighbours, every element inside exactly one box. That produces
order through *alignment*.

The reference produces order through *stacking*. Nothing on that page
shares an edge with anything else. Plates lie on top of one another at
1–2°, a single image bleeds off two edges at a scale nothing else
approaches, and the type is set with total precision on top of all of it.
Order comes from depth and from consistent treatment, not from a grid you
can see.

`10_PROJECT_MANIFESTO.md` already said this — *"panels of different weight
and size doing different jobs on the same page, no pretense that
everything has to be the same size to be organized."* v1 read it as
permission for a 1.35fr / 1fr split. It meant this.

---

## The pattern: precision underneath, chaos on top

The grid is not gone. It is 12 × 12 and it is deliberately broken.

```css
.canvas {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(12, 1fr);
  overflow: hidden;
}
.plate { transform: rotate(var(--rot, 0deg)); box-shadow: var(--plate-shadow); }
```

Every element is placed with `grid-area`, so relationships survive any
viewport — no magic pixel offsets, nothing to re-tune per screen size.
Chaos is then applied on top as three controlled deviations, and only
these three:

1. **Overlapping areas.** Two plates may claim the same cells. Which one
   wins is `z-index`, and `z-index` is meaning: interactive > content >
   decoration.
2. **Rotation**, capped at ±2°.
3. **Shadow**, which is how you read the stack order.

Nothing else. No random offsets, no per-instance nudging, no
`position: absolute` with pixel coordinates. If a plate needs to move, it
moves by a grid cell.

**The one exception is the hero**, which is absolutely positioned because
it must bleed past the canvas on two edges — something a grid item cannot
do while remaining in flow.

---

## Composition roles

Home is built from seven roles. Each has one job. A new element that
doesn't fit one of these needs a case made for it, per
`MASTER_AGENT.md`'s "why does this exist?" test.

| Role | Job | Count on Home |
|---|---|---|
| **Frame** | The machine-exact border: system header and status bar. Never rotated, never overlapped, always full-bleed horizontally. This is the "precision" half of the manifesto's central tension. | 2 |
| **Hero** | One image at a scale nothing else approaches, bleeding off two edges. Establishes that this is a printed sheet, not a screen. | 1, always exactly 1 |
| **Type field** | Identity set directly on the page — no plate, no card. Its authority comes from size and from *not* being in a box. | 1 |
| **Plate** | Anything lying on the page: nav items, photos, notes, records. Bordered or photo-bordered, shadowed, rotated. | 8–11 |
| **Bar** | Black label strips with cream text, cascading with a staggered left margin. Carries spec/status data. Reads as typeset caption, not as UI. A single bar may take the Signal Red `.bar--accent` skin (see Plate variants) to call out one featured/status flag — never ambient wallpaper. | 5 |
| **Chrome** | Reticles, barcode, serial, registration mark, tape, scale figures. Field Olive or Warning Yellow. Always `aria-hidden`. | 4–6 |
| **Annotation** | The handwritten scrap. Exactly one per screen — two reads as a gimmick. | 1 |
| **Badge field** | A dense block of small tags. Typographic mass, not a list — it should read as one grey-ish rectangle from across the room and resolve into names up close. | 1 |
| **Channel row** | Social/contact icons as a single joined strip with an Ink label cap. One per screen, on Home and again in the Contact module. | 1 |

---

## Plate variants

_Implemented 2026-07-30 (Phase 3 content) in `src/styles/plate.css`, shared by the Profile/Projects/Skills modules. Home's `.nav-item`/`.spec-bar` (`src/shell/collage/collage.css`) predate this file and do the same job under different names — not yet migrated onto these shared classes._

| Variant | Surface | Border | Shadow | Use |
|---|---|---|---|---|
| `.plate` | Paper White | 2px Ink | `--plate-shadow` | Nav items, field notes — anything typographic |
| `.plate--photo` | Paper White, 7px inset | none (the inset border *is* the frame) | `--plate-shadow` | Photographs and screenshots, with a caption row beneath |
| `.plate--detail` | Paper White, 5px inset | **2px Signal Red** | `--plate-shadow-sm` | Small crops that need to be pointed at. The red frame is a UI element (4.03:1 on paper, 4.74:1 on paper white) — it is never text |
| `.plate--flat` | Paper | none | none | A plate that should read as part of the page rather than on top of it |
| `.bar` | Ink | none | `--plate-shadow-sm` | Spec cascade |
| `.bar--accent` | Signal Red | none | `--plate-shadow-sm` | One callout bar per screen, max — a status flag or featured tag, styled as a red label block (the poster reference's red tag chips). Paper White text at any size (4.74:1). Ink text permitted only at 19px+ bold / 24px+ (3.68:1, large-text/UI threshold only) — never small Ink text on this fill |

**Reference implementation (added 2026-07-28):** `docs/home.design-proof-v3.html`'s `.status-flag` is the first built instance of `.bar--accent` — a louder, red restyle of the `AVAILABLE` status already carried by the real (non-hidden) spec bar in `.spec-cascade`. Because it duplicates rather than adds information, it's `aria-hidden="true"` and joins `.scrap` in the ≤1180px shed list. It sits at `grid-area: 1 / 10 / 3 / 13` — the top-right pocket, the closest open ground to the identity block once `.field-note` claims columns 6–9. Any future `.bar--accent` use that carries *unique* information (a featured-project flag, say) must not be `aria-hidden` and must not be shed.

New tokens:

| Token | Value | Note |
|---|---|---|
| `--plate-border` | `2px` | |
| `--plate-shadow` | `3px 4px 12px rgba(17,17,17,0.22)` | |
| `--plate-shadow-sm` | `2px 3px 7px rgba(17,17,17,0.18)` | |
| `--rot-max` | `2deg` | Documentation of the cap; enforce it in review |
| `--font-hand` | `"Segoe Script","Bradley Hand","Snell Roundhand",cursive` | Annotation only |

**On shadows.** `02_DESIGN_SYSTEM.MD` bans "floating glass panels" and
`MASTER_AGENT.md` says weight should come from structure, not decoration.
A plate shadow is not decoration: with overlapping elements it is the only
cue for what is on top of what, and depth is the organising principle
here the way alignment was in v1. It is a hard-offset physical shadow — a
photo lying on paper — not a soft glow, not a gradient, and never on the
Frame.

**On `.bar--accent` (added 2026-07-28).** This is the red-tag-block
decoration from the akatachi/wldd-adjacent reference sheets — small red
label rectangles doing the same job as a black `.bar`, just carrying the
one thing on the page that should read as "hot." It is not a new accent
color (Signal Red already exists and already means "highlight/active
state" per `02_DESIGN_SYSTEM.MD`'s Color Philosophy) — it's a new
*surface* for the existing one, which is why it needs no fresh
justification the way Field Olive did. Two rules keep it from becoming
the ornament-for-its-own-sake the manifesto rules out:

1. **One per screen, two only if both carry genuinely distinct
   information.** Same anti-gimmick logic as Annotation ("two reads as a
   gimmick") — a scattered field of red blocks stops reading as a callout
   and starts reading as wallpaper.
2. **It must carry real, unique text, or be `aria-hidden`.** If the bar's
   text is a decorative restyle of information that already exists
   elsewhere in accessible form (e.g. the same status word already in an
   Ink bar), it is `aria-hidden` and may be shed at narrow widths like the
   Annotation scrap. If it is the *only* place a piece of information
   appears, it is real content — normal DOM order, never `aria-hidden`,
   never shed.

It goes through the same placement rules as every other plate: collision
against keep-out rectangles, rotation capped at ±2°, never on top of text
or a hit target.

---

## Rotation and stagger

Rotations are authored per position, not randomised. Randomising at
runtime makes the page different every visit, which reads as broken
rather than as handmade.

- Cap: **±2°**. Past that, text legibility drops and the rotated bounding
  box starts eating its neighbours' space at narrow widths.
- Alternate sign down a stack (`-0.8, +0.6, -0.4, +0.9, -0.6`). A stack
  that leans consistently one way reads as a mistake.
- Pair rotation with a staggered `margin-left` (nav: 0/18/7/26/12px;
  spec bars: 4/30/14/46/22px). The stagger does more work than the
  rotation does — it's what makes the cascade read as hand-placed.
- Overlap adjacent stack items by `margin-top: -6px` so they physically
  sit on each other.

---

## Accessibility guardrails

Overlap is where this composition can quietly break, so these are rules,
not guidance. All four are automatically verified — see the audit below.

**1. No plate may obscure text or a hit target.**
Overlap is only allowed on a plate's empty margin, on an image, or on the
hero. This is the rule that bit twice while building the proof: the nav
stack landed on the identity's tag row, and the annotation scrap landed
on a record chip's name. Both were invisible in review and obvious to a
script.

**2. Stack order follows meaning.**
`z-index`: interactive (20–30) > content plates (10–19) > decorative
(1–9). Hovering or focusing a nav plate raises it to the top of its stack
— the overlap itself is the affordance, which is why the hover state also
deepens the shadow.

**3. Visual order never overrides DOM order for content.**
Plates are placed with `grid-area`, which does not affect tab order.
Flex/grid `order` is used exactly once on Home — to move the hero on
mobile — and only because the hero is `aria-hidden` decoration that holds
no focus and carries no content. **Never use `order` on anything a user
can read or reach.**

**4. Rotation stays off interactive geometry.**
A rotated button's hit box is its rotated bounding box, so at ±2° the
effective target is very slightly larger, never smaller. The 24px minimum
(SC 2.5.8) is measured on the unrotated box, and all rotation goes to
zero below 900px.

### Shed order

As the viewport narrows, overlap turns into occlusion. The collage
**sheds plates in a fixed priority order** rather than compressing them.
Everything shed is decorative or duplicated elsewhere; nothing carrying
unique content is ever shed.

| Breakpoint | Shed | Why it's safe |
|---|---|---|
| ≤1180px | Await placeholder | Holds no information |
| | Annotation scrap | `STATUS / AVAILABLE` bar says the same thing |
| | Scale figures | Pure scale reference |
| | Serial + barcode | Decorative chrome |
| | `.bar--accent`, if `aria-hidden` | Only sheds when its text duplicates an Ink bar elsewhere; never shed if it's the sole source of that information |
| ≤900px | Detail crop, hero repositioned to a 190px banner | Collage collapses to a single-column stack; all rotation → 0, all overlap → 0, all `transform: none` |

### Automated audit

`scripts/audit.mjs` (added 2026-07-29, task 4.1 of
`sdd/phase4-audit-e2e-docs`) runs at 1440/1280/1100/390 and asserts, for
every interactive element: its centre point hit-tests to itself (no
occlusion), its unrotated box is ≥24×24, and no text node is clipped by
an ancestor (elements marked `data-truncate="ellipsis"` — `.nav-label`,
`.nav-sub`, `.spec-bar .v` — are exempt; their truncation is intentional).
Run it with `pnpm run audit:collage` (always `pnpm run`, never the bare
`pnpm audit` shorthand — that resolves to pnpm's own dependency-audit
subcommand instead).

Current measured state: **zero occlusions, zero undersized targets, zero
clipped text, focus order identical at all four widths.** Now wired into
CI (`.github/workflows/ci.yml`) on every push and pull request — the
"wire this into CI" note above is resolved.

---

## GLITCH — the decay layer

Added at Keff's request (kokonutui `matrix-text` was the reference).
`07_ANIMATION_GUIDELINES.MD` already lists "glitch" as an allowed effect,
so this needed a **home** rather than a justification: scattered
everywhere, decay stops reading as atmosphere and starts reading as a
broken page.

**Where it lives:** module labels on hover/focus, and system readouts
(header build/mode, status bar) on a slow ambient timer. The decay is on
the parts where the machine talks about itself. The name is deliberately
excluded — `NameRevealIntro` already owns that moment, and two
typographic effects on one string compete.

**Mechanics.** A left-to-right scramble-settle: 5 frames at 55ms (275ms
total), each frame locking in one more character. Charset is ASCII-only
(`#%&$@*+=<>/\|01?!`). Ambient decay fires on one readout every 6–11s,
never two at once, and pauses when the tab is hidden.

Two rules make it safe rather than merely stylish, and both are the
`NameRevealIntro` lesson applied earlier this time:

1. **Only an `aria-hidden` visual copy scrambles.** A `.visually-hidden`
   twin carries the real string. Verified against the real accessibility
   tree mid-scramble: buttons expose `"PROFILE IDENTITY / EXPERIENCE"`
   while the visible glyphs read `P1%<|#/`. Never scramble a node that
   assistive tech reads.
2. **Monospace + ASCII means every substitution is the same width.** No
   reflow, no layout shift, no thrash on a rotated plate.

Fully disabled under `prefers-reduced-motion` — the label never changes
at all, it does not merely animate faster. On the flash question: WCAG
2.3.1 concerns large-area luminance change, not glyph substitution, and
this is ~18 char-changes/sec inside a label a few centimetres wide. It is
not a flash risk, but keep it off large text and never let it run
continuously.

```
.glitch            wrapper
  .glitch-vis      aria-hidden, gets scrambled
  .visually-hidden the real string, never touched
```

---

## Colour: what the collage adds

No new colours. Two new *placements*, both verified:

- Field Olive now also appears on **Paper White** plate surfaces (nav
  counts, field-note keys): **6.79:1**, passes AA at any size. Its ban on
  Ink fills is unchanged — that is why `.nav-count` still swaps to
  `--ink-inverse` when a nav plate inverts on hover.
- Signal Red now appears as a **2px detail-plate frame** on Paper White:
  **4.74:1**, clears the 3:1 non-text threshold. Still never small text.
- Signal Red now also appears as a **solid `.bar--accent` fill** (added
  2026-07-28): Paper White text on Signal Red is **4.74:1**, passes AA at
  any size; Ink text on Signal Red is **3.68:1**, large-text/UI threshold
  only — same two figures as the existing Signal-Red/Paper-White and
  Signal-Red/Ink pairs already computed above and in `02_DESIGN_SYSTEM.MD`,
  just applied to a fill instead of a border. No new pair to verify.

> **Chrome on a Signal Red fill (added 2026-07-30).** The Chrome role row
> above specifies Field Olive or Warning Yellow. Neither is usable on a
> Signal Red surface, so chrome sitting **on** a `.bar--accent` fill uses
> **Paper White**:
>
> | Pair | Ratio | Verdict |
> |---|---|---|
> | Field Olive `#4f5a3c` on Signal Red `#c63c32` | **1.43:1** | Unusable — effectively invisible |
> | Warning Yellow `#d6c76a` on Signal Red `#c63c32` | **2.99:1** | Below the 3:1 non-text floor |
> | Paper White `#f6f6f4` on Signal Red `#c63c32` | **4.74:1** | Used — already this plate's documented text colour |
>
> Field Olive at 1.43:1 is the decisive figure: two mid-dark surfaces with
> near-identical relative luminance, so the bracket would not be seen at all.
> Warning Yellow lands just under the 1.4.11 threshold; pure decoration is
> technically exempt from 1.4.11, but this system documents every pair it
> uses and does not ship sub-threshold marks. The load-bearing reason for
> Paper White is positive, not merely eliminative: it is **already** the
> plate's documented text colour at 4.74:1, so chrome introduces no third
> colour onto a two-colour plate and no new pair to verify. Field Olive and
> Warning Yellow remain the chrome colours on Paper / Paper White surfaces —
> this note narrows the rule for Signal Red fills only.
>
> The same Chrome row also says chrome is *"always `aria-hidden`."*
> Pseudo-element chrome (`::before`/`::after` with `content: ""`) satisfies
> that requirement **by construction** — it produces no accessibility-tree
> node, so the attribute is inapplicable rather than omitted. The rule's
> intent is preserved; only its mechanism differs from element-based chrome.
>
> **Also note:** the Plate-variants table row for `.bar--accent` says "One
> callout bar per screen, max", which contradicts prose rule 1 below it
> ("One per screen, two only if both carry genuinely distinct information").
> The prose governs. Home's two plates are compliant — and more clearly so
> after phase 4.2, which gives each a unique hype line.

All 17 pairs used in v2 were computed. Zero failures. The three banned
combinations (Field Olive on Ink 2.57:1, Signal Red as small text 4.03:1,
Warning Yellow as any text 1.35:1) remain absent.

---

## What this replaces

| v1 | v2 |
|---|---|
| Fixed 296px nav column with 1px dividers | Stack of overlapping index-card plates, staggered and rotated |
| Spec sheet as a `116px / 1fr` table | Cascade of black label bars with staggered left margins |
| Photo plate in a fixed grid cell | Photo, detail and placeholder plates at overlapping grid areas |
| `LATEST_RECORDS` strip spanning the panel foot | Three small record plates stacked bottom-right, over the hero |
| System log block in the nav footer | Field note plate — one real remark, not fabricated telemetry |
| Bio paragraph under the name (v2) | Removed from Home entirely — it belongs in the Profile module. Home states who, what, and status; the argument lives one page-turn away |
| `LATEST_RECORDS` chips (v2) | Dense technology badge field, bottom-right |
| Contact only as a spec bar | Channel row on Home (GitHub / LinkedIn / Email / X) + full terminal in the Contact module |
| Static labels | Glitch decay layer on module labels and system readouts |
| Generated placeholder hero | Keff's own illustrations, screenprinted via the `lineart` preset |
| No dominant image | Hero bleeding off two edges at ~45% of the viewport |
| 7 spec rows | 5 bars; `SYS. VERSION` and `TOOLS` dropped as duplicates of the header build field and the tag row |

Unchanged from v1 and still binding: the token set, the page-turn
(right-to-left, 200ms, hard cut, crease), the keyboard map (Left =
forward), focus-return on close, `inert` on the shell, `#main-content`
carrying the real name and role for the `NameRevealIntro` dependency, and
the reflow release below 768px.

---

## Implementation notes

- The overlap grid is plain CSS Grid. **Do not** reach for a masonry or
  drag-and-drop layout library; there is nothing to compute at runtime.
- With Tailwind, author plate placements in a component stylesheet rather
  than as utility soup — `grid-area: 5 / 5 / 7 / 9` as twelve arbitrary
  values is unreadable, and these positions are design decisions that
  deserve to live somewhere a designer can find them.
- Keep every `grid-area` for one screen in a single block, in composition
  order, so the layout can be read as a whole.
- The hero uses `image-rendering: pixelated`. This is deliberate: the dot
  screen is the image, and smooth-scaling a 1-bit dither turns it to grey
  mush. Turn it back to `auto` only where the image is scaled *down* hard
  (the mobile banner does exactly this).
