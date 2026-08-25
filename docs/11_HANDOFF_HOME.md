# HANDOFF SPEC — HOME (NODE 001)

> Companion files: `home.design-proof-v2.html` (current) and
> `home.design-proof.html` (v1, superseded layout) — a runnable, self-contained
> mockup of everything specified below. Where this doc and the proof
> disagree, this doc wins; the proof is the visual argument, not the
> contract.
>
> Sources of truth this spec obeys, and does not restate:
> `02_DESIGN_SYSTEM.MD` (palette), `03_UX_ARCHITECTURE.MD` (navigation),
> `05_ACCESSIBILITY.MD` (a11y), `07_ANIMATION_GUIDELINES.MD` (motion),
> `06_FRONTEND_STACK.MD` (React + Vite + TS + Tailwind + Framer Motion).

---

## Overview

Home is the resting state of the whole application. It is a **fixed,
single-viewport dashboard** — the shell never scrolls at desktop widths.
Every module opens *over* Home via the right-to-left page turn and closes
back to it.

Home has a second, non-obvious job. Everything painted on the collage
canvas (masthead, KG initials, the reserved hero slot) is `aria-hidden`
(see `05_ACCESSIBILITY.MD` → *Decorative / Auto-Playing Animations*), so
Home's `#main-content` must carry the name and role in real accessible
markup on its own — the `<h1>`-adjacent identity block and PROFILE readout
below are Home's ONLY accessible carriers of that information, and must
not be removed or reduced to an image. (Corrected 2026-08-24,
`sdd/drop-intro-hero-placeholder`: this requirement was previously framed
as satisfying `NameRevealIntro`'s own dependency — that component has
since been removed, and the requirement stands on its own merits, not as
an equivalent to anything.)

**Answers the open question from the 2026-07-27 style audit:** yes,
`#main-content` now contains equivalent real content. Keep it that way.

---

## Layout

> **SUPERSEDED 2026-07-27 by `12_COLLAGE_SYSTEM.md`.** The shell grid
> below described a dashboard: fixed regions sharing 2px edges. Keff
> flagged that it read as a skinned SaaS layout rather than as the
> underground archive sheet in the reference, and he was right. Home is
> now an overlap grid with plates laid over a bleeding halftone hero.
> Read `12_COLLAGE_SYSTEM.md` for the composition; keep this section only
> as the record of what the frame (header + status bar) still does, since
> those two regions are unchanged and deliberately exact.


### Shell grid

```
┌──────────────────────────────────────────────────┐
│ SYSTEM HEADER                            44px    │
├────────────────┬─────────────────────────────────┤
│ NAV MODULE     │ CONTENT PANEL                   │
│ 296px          │ 1fr                    1fr      │
│                │  ┌──────────────┬────────────┐  │
│                │  │ readout-main │ spec-sheet │  │
│                │  │ 1.35fr       │ 1fr        │  │
│                │  └──────────────┴────────────┘  │
│                ├─────────────────────────────────┤
│                │ LATEST_RECORDS strip     auto   │
├────────────────┴─────────────────────────────────┤
│ STATUS BAR                               30px    │
└──────────────────────────────────────────────────┘
```

- Outer: `display: grid; grid-template-rows: 44px minmax(0,1fr) 30px;
  height: 100dvh`. Use `dvh`, not `vh` — mobile browser chrome otherwise
  clips the status bar.
- `minmax(0, 1fr)` on every flexible track. Without the `0` minimum,
  nowrap text in the identity block forces the grid wider than the
  viewport and reintroduces horizontal scroll.
- Body columns: `grid-template-columns: var(--nav-w) minmax(0,1fr)`.
- **No `border-radius` anywhere.** Enforce with a global
  `*, *::before, *::after { border-radius: 0 }` so a Tailwind utility or
  a third-party component can't reintroduce it.

### Rules and seams

| Boundary | Weight | Token |
|---|---|---|
| Under system header | 2px | `--rule-thick` / `--ink` |
| Nav module → content panel | 2px | `--rule-thick` / `--ink` |
| Above status bar | 2px | `--rule-thick` / `--ink` |
| Above LATEST_RECORDS strip | 2px | `--rule-thick` / `--ink` |
| Between nav items, panel heads, spec rows | 1px | `--rule-hair` / `--ink` |
| Spec-row separators | 1px dotted | `--rule-hair` / `--gray` |

2px = a structural boundary between regions. 1px = a division *within*
a region. Don't mix them; the weight is the information.

---

## Design Tokens Used

Ship these as CSS custom properties on `:root` and mirror them into
`tailwind.config.ts` via `theme.extend` so both raw CSS and utilities
resolve to the same value. **No raw hex outside the token block.**

### Color

| Token | Value | Usage |
|---|---|---|
| `--paper` | `#E4E4E2` | Page + panel base surface |
| `--paper-white` | `#F6F6F4` | Raised surfaces: keycaps, close button, photo plate |
| `--ink` | `#111111` | Text, borders, tag/wordmark fills |
| `--ink-inverse` | `#F2F2F2` | Text on Ink or Signal Red fills |
| `--gray` | `#635D54` | Meta text, captions, secondary labels, log lines |
| `--signal-red` | `#C63C32` | Focus ring, live dot, wordmark edge, `:active` fill — **large text / UI only** |
| `--signal-red-text` | `#8F2C24` | Small red text: links, `AVAILABLE`, the `◄ OPEN` affordance |
| `--warning-yellow` | `#D6C76A` | Tape fill only. **Never a text color.** |
| `--field-olive` | `#4F5A3C` | Structural technical chrome: panel status, reticles, barcode, serial, log `[ok]`, olive outline tag. **Paper backgrounds only.** |

Verified contrast for every pair actually used on Home (computed, not
estimated):

| Pair | Ratio | Requirement | Result |
|---|---|---|---|
| Ink on Paper | 14.83:1 | 4.5 | PASS |
| Gray on Paper | 5.12:1 | 4.5 | PASS |
| Field Olive on Paper | 5.77:1 | 4.5 | PASS |
| Signal Red — Text on Paper | 6.46:1 | 4.5 | PASS |
| Ink-inverse on Ink | 16.87:1 | 4.5 | PASS |
| Ink-inverse on Signal Red (`:active`) | 4.58:1 | 4.5 | PASS |
| Ink on Warning Yellow (tape) | 11.00:1 | 4.5 | PASS |
| Ink on Paper White | 17.45:1 | 4.5 | PASS |
| Signal Red focus ring on Paper | 4.03:1 | 3.0 | PASS |
| Signal Red focus ring on Ink hover fill | 3.68:1 | 3.0 | PASS |
| Field Olive reticles/borders on Paper | 5.77:1 | 3.0 | PASS |

Banned combinations, all absent from the implementation — add a lint rule
or a review checkbox for each:

- Field Olive on an Ink fill — **2.57:1**. This is why `.nav-count`
  switches from Field Olive to `--ink-inverse` on hover/focus, when the
  nav item's background flips to Ink. Any future olive element that sits
  on a surface which can invert needs the same swap.
- Signal Red as small text — 4.03:1. Use `--signal-red-text`.
- Warning Yellow as any text — 1.35:1. Fill only, Ink text on top.
- Signal Red on Ink — 3.68:1, large-bold only. This is why the wordmark's
  `_` separators are `--ink-inverse` and the red lives on the wordmark's
  3px right edge (a non-text UI element on Paper) instead.

### Typography

| Token | Value | Usage |
|---|---|---|
| `--font-display` | `"Archivo Narrow", "Arial Narrow", Haettenschweiler, sans-serif` | Wordmark, nav labels, identity, role, page titles, record names |
| `--font-mono` | `"JetBrains Mono", "SFMono-Regular", Consolas, Menlo, monospace` | Everything else — all metadata, body copy, labels, status |
| `--text-display-xl` | `clamp(2.5rem, 5.4vw, 4.75rem)` | Family name (the graphic mark) |
| `--text-display-sm` | `clamp(1.25rem, 2.1vw, 1.875rem)` | Given name |
| `--text-display-lg` | `clamp(1.375rem, 2.1vw, 1.875rem)` | Role line, page titles |
| `--text-display-md` | `clamp(1.125rem, 1.5vw, 1.4rem)` | Wordmark |
| `--text-body` | `0.875rem` (14px) | Bio, page body copy |
| `--text-meta` | `0.6875rem` (11px) | Panel titles, spec values, header meta |
| `--text-micro` | `0.5625rem` (9px) | Corner marks, serials, keycaps, log lines |
| `--track-label` | `0.22em` | Uppercase technical labels |
| `--track-micro` | `0.42em` | Eyebrow / widest tracked labels |

Self-host both families (`@fontsource/archivo-narrow`,
`@fontsource/jetbrains-mono`) with `font-display: swap`. Do not load from
a CDN — the fallback stacks above are what render on a cold cache, and
`Arial Narrow` is meaningfully wider than Archivo Narrow. Test the
identity block against the fallback before shipping.

9px is genuinely small. It is acceptable **only** for non-essential
technical chrome (serials, corner marks, log lines) where the information
is also available elsewhere or is decorative. Never set a link, a control
label, or unique information at `--text-micro`.

### Space and structure

| Token | Value | Usage |
|---|---|---|
| `--space-2xs` … `--space-2xl` | 4 / 8 / 12 / 16 / 24 / 32 / 48px | 4px base scale, no off-scale values |
| `--rule-hair` | 1px | Intra-region divisions |
| `--rule-thick` | 2px | Region boundaries |
| `--radius` | 0 | Non-negotiable |
| `--header-h` | 44px | System header |
| `--status-h` | 30px | Status bar |
| `--nav-w` | 296px (240px ≤1100px) | Nav module column |
| `--hit-min` | 24px | WCAG 2.2 SC 2.5.8 floor |

### Motion

| Token | Value | Usage |
|---|---|---|
| `--ease-hard` | `cubic-bezier(0.7, 0, 0.3, 1)` | Every transition on Home. Literal values live in `src/styles/tokens.css`'s Motion block (provenance note there — `NameRevealIntro`, which originally defined this curve, was deleted `sdd/drop-intro-hero-placeholder`, 2026-08-24). |
| `--dur-micro` | 90ms | Hover / focus state changes |
| `--dur-cut` | 140ms | Small clip wipes |
| `--dur-turn` | 200ms | Full-viewport page turn |

**Deviation flagged for your approval:** `07_ANIMATION_GUIDELINES.MD`
specifies the page turn should match the hard-cut curve's `duration: 0.14`.
That value was tuned for a text-height wipe inside the now-deleted
`NameRevealIntro` component. Applied to a full 1440px-wide viewport it
reads as a dropped frame rather than a turn — the eye never registers the
crease. **Recommend 200ms with the same curve**, which preserves the
mechanical character while making the direction legible. The easing is
unchanged, so nothing about the feel softens. If you'd rather stay literal
to the doc, change `--dur-turn` to `140ms` and the two `setTimeout` values
in the proof; nothing else moves.

---

## Components

| Component | Variant | Props | Notes |
|---|---|---|---|
| `SystemHeader` | — | `build`, `rev`, `location`, `mode` | Wordmark is an Ink fill with a 3px Signal Red right edge. Clock is `font-variant-numeric: tabular-nums` — required, or the layout jitters every second. |
| `Panel` | `default`, `inverted` | `title`, `status`, `children` | The `04_COMPONENT_RULES.MD` panel primitive. `title` renders in `panel-head` left, `status` right in Field Olive. Every panel gets both; a panel with nothing to report says `SYSTEM NOMINAL`, it doesn't drop the slot. |
| `NavModule` | — | `items[]` | Renders `NavItem` list + `SystemLog` + `SerialFooter`. |
| `NavItem` | `default`, `disabled` | `index`, `label`, `sub`, `count`, `pageId`, `disabled` | `<button>`, never a `<div>`. Grid: `34px 1fr auto`. Min-height 62px desktop / 48px mobile. |
| `SystemLog` | — | `lines[]` | Read-only. `[ok]` / `[--]` prefix in Field Olive, message in Gray. Decorative-adjacent but *true* — do not fabricate log lines that don't correspond to real build state. |
| `IdentityBlock` | — | `given`, `family`, `role`, `bio`, `tags[]` | Home's primary accessible carrier of name/role — everything else painted on the collage canvas is `aria-hidden` (re-grounded 2026-08-24, `sdd/drop-intro-hero-placeholder`; previously framed as the accessible equivalent of the now-removed `NameRevealIntro`). Given + family both `white-space: nowrap` and shrink via clamp — the family name must never wrap mid-name. |
| `SpecSheet` | — | `rows[]` | The PROFILE MODULE field list from `MASTER_AGENT.md` §4. `116px 1fr` grid. |
| `SpecRow` | `default`, `live` | `label`, `value`, `live` | `live` renders the value in `--signal-red-text` bold (used by `STATUS: AVAILABLE`). |
| `PhotoPlate` | `placeholder`, `image` | `src`, `alt`, `label`, `tape` | 2px Ink frame, `aspect-ratio: 4/3` (16/9 ≤1100px). `placeholder` is a −45° hatch. `alt` is required and must be real; if there's no meaningful alt the plate is decorative and needs `role="presentation"` instead. |
| `Tag` | `filled`, `outline` | `children` | `filled` = Ink/Ink-inverse. `outline` = Field Olive border + text on Paper. Min-height 24px even though the glyph is 9px. |
| `RecordChip` | `default` | `id`, `name`, `stack`, `status`, `year`, `pageId` | `<button>` that opens the Project Database page. Min-height 54px. Truncates with `text-overflow: ellipsis`, never wraps. |
| `StatusBar` | — | `hints[]`, `motionState`, `node` | Keycaps are Paper White with 1px Ink border. `motionState` reflects the live `prefers-reduced-motion` match, updated on `change`. |
| `PageLayer` | — | `open`, `title`, `tag`, `onClose`, `children` | The page-turn destination. `role="dialog" aria-modal="true"`. Body scrolls; shell doesn't. |
| `Crease` | — | `state` | 2px Ink vertical line animating `left` in lockstep with the layer's `clip-path`. Hidden entirely under reduced motion. |

---

## States and Interactions

| Element | State | Behavior |
|---|---|---|
| `NavItem` | Default | Transparent on Paper; label Ink, sub + index Gray, count Field Olive |
| `NavItem` | Hover | Background → Ink, all text → Ink-inverse (**including the count — Field Olive fails on Ink**); `◄ OPEN` affordance fades in at 90ms |
| `NavItem` | Focus-visible | Identical to hover, **plus** 2px Signal Red outline, 2px offset |
| `NavItem` | Active (pointer down) | Background → Signal Red, text → Ink-inverse |
| `NavItem` | Disabled | −45° Gray hatch at 13% alpha; label → Gray; `aria-disabled="true"` + `disabled`; no hover response; `cursor: not-allowed` |
| `RecordChip` | Hover / focus | Background → Ink, text and meta → Ink-inverse; same red focus ring |
| `PageClose` | Default → Hover | Paper White → Ink fill, Ink → Ink-inverse text |
| Any focusable | Focus-visible | `outline: 2px solid var(--signal-red); outline-offset: 2px`. One treatment site-wide. Never `outline: none` without a replacement of equal or greater visibility. |
| Live dot | Idle | `steps(1, end)` blink, 2.4s, opacity 1 → 0.25. **Not a fade** — a fade is organic; a hard step is mechanical. Suppressed under reduced motion. |
| Clock | Tick | Text-only update, 1s interval, tabular numerals |
| Shell | Page open | `inert` + `aria-hidden="true"` — unreachable by pointer, tab, and AT |

### Page-turn sequence

**Open** (Home → module):

1. `layer.hidden = false`, `data-open` set.
2. Shell goes `inert` + `aria-hidden`.
3. `clip-path: inset(0 0 0 100%)` → `inset(0 0 0 0)` over `--dur-turn`,
   `--ease-hard`. Visible area grows from the right edge leftward — the
   manga-order forward turn.
4. Crease animates `left: 100% → 0` on the identical timing.
5. On completion: focus moves to the page body, `aria-live="polite"`
   announces `"{MODULE} module opened."`

**Close** (module → Home), triggered by the close control, `Escape`,
`ArrowRight`, or browser back — all four run the same path:

1. `clip-path: inset(0 0 0 0)` → `inset(0 0 0 100%)`; Home is revealed
   from the left edge rightward.
2. Crease animates `left: 0 → 100%`.
3. Layer hidden, shell un-inerted, **focus returns to the exact control
   that opened the page** — never to `<body>`, never to the top of Home.
4. `aria-live` announces `"{MODULE} closed. Home."`

Guard both with a `busy` flag. Without it, a fast double-click leaves the
shell `inert` with no page on top — an unrecoverable dead state.

### Keyboard map — RESOLVED

The audit left this open. **Decision: the keyboard follows the visuals,
not Western convention.**

| Key | Context | Action |
|---|---|---|
| `ArrowLeft` | Focus on a nav item or record chip, Home | Open that module — forward, matching the leftward wipe |
| `ArrowRight` | Page open | Close, back to Home — matching the rightward reverse wipe |
| `Escape` | Page open | Close, back to Home |
| `Tab` / `Shift+Tab` | Anywhere | Normal DOM-order traversal. **Never remapped.** |
| `Enter` / `Space` | On any control | Native activation. Free, because every control is a real `<button>`. |

`05_ACCESSIBILITY.MD` requires picking one convention and staying
consistent with the visual direction. This is that choice. Arrow keys are
a **shortcut layer only** — every action they perform is also reachable
by Tab + Enter, so a user who never discovers them loses nothing.

---

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| **Desktop >1100px** | Full layout. Shell fixed at `100dvh`, nothing scrolls. Nav 296px. Readout split `1.35fr / 1fr`. Photo plate 4:3. |
| **Laptop 769–1100px** | Nav narrows to 240px. Readout collapses to one column; the spec sheet **stacks below** the identity rather than being hidden. The `.readout` region gains `overflow-y: auto` — **the shell still doesn't scroll; the content region does.** Plate → 16:9. |
| **Mobile ≤768px** | Nav collapses to a horizontal, snap-scrolling module rail under the header (48px tall). Panel head, system log, serial footer, sub-labels, counts, and the `◄ OPEN` affordance are all suppressed in the rail. Records strip stacks vertically. Header meta hidden. Tape hidden. Shell releases `overflow: hidden` and the page scrolls normally. |

Two things worth being explicit about, because both look like rule
violations and aren't:

**The mobile nav doesn't move in the DOM.** It collapses from a vertical
column to a horizontal rail by changing the list's axis only. `nav` still
precedes `main` in source order, so reading order and tab order are
unchanged. Do not reach for CSS `order` to put the identity above the nav
on mobile — that would desync visual and focus order (WCAG 1.3.2 / 2.4.3)
to save one swipe.

**No-scroll is released at ≤768px on purpose.** WCAG 1.4.10 requires
content to reflow without two-dimensional scrolling at 320 CSS px.
`MASTER_AGENT.md`'s conflict order puts Accessibility above Project
Vision, so reflow wins. This isn't a compromise of the vision — the
single-viewport rule was always about the *shell*, and
`03_UX_ARCHITECTURE.MD` already separates "the shell never scrolls" from
"content is free to be long."

Minimum supported width: **320px**. Verified no horizontal overflow at
1440 / 1024 / 390.

---

## Content Specifications

| Field | Limit | Truncation |
|---|---|---|
| Given name | ~22 chars at 390px | `nowrap` + ellipsis; clamp shrinks first |
| Family name | ~16 chars at 390px | `nowrap` + `overflow: hidden`, **no ellipsis** — a truncated family name is worse than a clipped one; if it clips, shrink the clamp floor rather than accept an ellipsis in the name |
| Role line | ~60 chars | Wraps to 2 lines max |
| Bio | 280–420 chars, max 46ch measure | Wraps freely; do not truncate |
| Nav label | 20 chars | `nowrap` |
| Nav sub-label | 28 chars | `nowrap` |
| Spec value | 34 chars | `nowrap` + ellipsis |
| Record name | 22 chars | `nowrap` + ellipsis |
| Record meta | 40 chars | `nowrap` + ellipsis |
| Log line | 44 chars | `nowrap` + ellipsis |

**International text:** the bio and role must survive roughly +35% length
(a Spanish translation of the same copy). Everything using `nowrap` is
already ellipsis-guarded except the family name, which shrinks instead.
The identity block contains `Í` and `Á` — verify the ascender isn't
clipped by `line-height: 0.88` in whatever font actually loads, including
the fallback.

---

## Edge Cases

- **No portrait asset yet.** `PhotoPlate` renders the hatched placeholder
  with `IMG_001 / SUBJECT`. This is the shipping state today. It must not
  look broken — the frame, label, and tape carry it.
- **Zero project records.** The `LATEST_RECORDS` strip renders one full-
  width chip: `NO RECORDS INDEXED / DATABASE EMPTY`, non-interactive,
  Gray. Do not collapse the strip — the empty state is information.
- **Fewer than three records.** The strip renders what exists; remaining
  columns stay empty Paper with their 1px left rules intact. The grid is
  visible structure, not a container to be hidden.
- **Long bio.** Above ~420 chars the readout starts to crowd at 1024px.
  The readout region scrolls there, so it degrades safely — but treat 420
  as the editorial limit, not a technical one.
- **Fonts fail to load.** Fallback stacks render immediately (`swap`).
  `Arial Narrow` is wider than Archivo Narrow; the identity clamp has
  headroom for it. Verify with fonts blocked in DevTools.
- **JavaScript disabled.** Home renders completely — it's static markup.
  The page-turn layer never opens, so nav items must be real links to
  addressable routes (see below), not JS-only buttons, or the whole
  archive becomes unreachable.
- **Very short viewport (<600px tall, desktop width).** The fixed shell
  will crowd. Below 600px height, apply the ≤1100px readout-scroll rule
  regardless of width: `@media (max-height: 600px)`.
- **Reduced motion.** Every animation collapses to ~0ms; the crease is
  removed entirely; the live dot stops blinking; the page turn becomes an
  instant swap. All navigation still works identically.

---

## Animation / Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| `PageLayer` | Open | `clip-path: inset(0 0 0 100%) → inset(0 0 0 0)` | 200ms | `--ease-hard` |
| `PageLayer` | Close | `clip-path: inset(0 0 0 0) → inset(0 0 0 100%)` | 200ms | `--ease-hard` |
| `Crease` | Open | `left: 100% → 0` | 200ms | `--ease-hard` |
| `Crease` | Close | `left: 0 → 100%` | 200ms | `--ease-hard` |
| `NavItem` | Hover / focus | `background`, `color` | 90ms | `--ease-hard` |
| `NavItem` `◄ OPEN` | Hover / focus | `opacity: 0 → 1` | 90ms | `--ease-hard` |
| `RecordChip` | Hover / focus | `background`, `color` | 90ms | `--ease-hard` |
| Live dot | Idle loop | `opacity 1 → 0.25`, `steps(1, end)` | 2.4s | steps |

No transforms, no springs, no overshoot, no opacity fades on navigation.
The only property that moves spatially is the clip boundary — which is
the point: the page doesn't *slide*, it is *revealed*.

Under `prefers-reduced-motion: reduce`, a single global rule forces all
durations to 0.001ms and removes the crease. Nothing else changes.

---

## Accessibility Notes

**Landmarks and headings**

- `<header>` → `<nav aria-label="Modules">` → `<main id="main-content">`
  → `<footer>`. One `<h1>` on the page; module names are `<h2>`.
- `<main id="main-content" tabIndex={-1}>` — the id and the negative
  tabindex belong to the page-turn focus-return contract: on close,
  `TurnProvider` (`turn/TurnProvider.tsx` ~L108) calls
  `getElementById("main-content").focus()` so focus lands back in the
  shell instead of on `<body>`. `tabIndex={-1}` makes that element
  programmatically focusable without adding it to the tab sequence. Proven
  by `e2e/turn-focus.spec.ts` and the Escape-focus assertion in
  `App.test.tsx` L100-118. (Corrected 2026-08-24: previously attributed to
  `NameRevealIntro` handing off focus — the intro merely borrowed the id
  via `focusTargetId`, and the contract predates and outlives it.) It must
  also contain the real name/role content — Home's only accessible
  identity carriers, since everything else on the canvas is `aria-hidden`.

**Focus order**

Header (no interactive elements) → nav items 01–04 (05 disabled, skipped)
→ identity block links → spec-sheet contact link → record chips 012/011/010
→ status bar (non-interactive). Strictly DOM order at every breakpoint.

**Focus management across the page turn**

Opening moves focus into the page body; the shell goes `inert` so nothing
behind it is tabbable. Closing returns focus to the originating control.
This is the part most likely to regress — write a test for it.

**ARIA**

- Grain, scanlines, reticles, barcode, tape, the `◄ OPEN` affordance, the
  live dot, and the nav index numbers are all `aria-hidden="true"`. They
  are texture and redundant decoration; narrating them is noise.
- `PageLayer`: `role="dialog" aria-modal="true"
  aria-labelledby="page-title"`.
- `PhotoPlate` placeholder: `role="img"` with a truthful `aria-label`.
- A visually-hidden `role="status" aria-live="polite"` region announces
  page open and close.
- `SpecSheet` is an `<aside aria-label="Profile specification">`.

**Target size (WCAG 2.2 SC 2.5.8, 24×24 minimum)**

This is the constraint the dense-label aesthetic fights hardest, and the
resolution is always the same: **grow the hit area, keep the glyph small.**
Nav items are 62px (48px mobile), record chips 54px, tags and the close
button 24px minimum despite 9px type. If a new component's visible mark is
smaller than 24px, it gets padding — it does not get a smaller target.

**Contrast**

Every pair verified above. The one live trap is Field Olive: it is fine on
Paper and fails on Ink. Any olive element on a surface that can invert
must swap to `--ink-inverse` in the inverted state, exactly as
`.nav-count` does.

**Motion**

`prefers-reduced-motion` is honored globally and reflected back to the
user in the status bar (`MOTION: FULL` / `MOTION: REDUCED`), updated live
on `change`. No flashing: the live dot's 2.4s step blink is far below the
3Hz threshold.

---

## Implementation Notes (React + Vite + TS + Tailwind + Framer Motion)

- **Tokens once.** `styles/tokens.css` holds `:root`. `tailwind.config.ts`
  maps them: `colors: { paper: 'var(--paper)', ink: 'var(--ink)', … }`.
  Set `borderRadius: { DEFAULT: '0', none: '0' }` so no utility can
  round a corner.
- **Routing.** `03_UX_ARCHITECTURE.MD` requires each page to be
  addressable. Use `react-router` with `/`, `/profile`, `/projects`,
  `/contact`. (`/skills` removed 2026-07-31 — its content moved to the
  Home collage, see `12_COLLAGE_SYSTEM.md`.) (Amended 2026-07-29, per `sdd/phase2-app-shell/spec`:
  nav items render as real `<button>`s calling `useNavigate()`/`go()`, not
  `<Link>` — an anchor does not natively activate on Space, which the
  keyboard map requires. JS-disabled reachability, which the `<Link>`
  approach was meant to preserve, is a documented non-goal for this SPA:
  `index.html` mounts an empty root via a module script, so with JS
  disabled nothing in the tree renders regardless of `<a>` vs `<button>`
  semantics — that guarantee would need a prerender/SSG step, which is out
  of scope.) Browser back still triggers the same reverse turn as the
  close control, via the turn machine's own `location.pathname` effect,
  not via anchor semantics. Drive `PageLayer` from the route, not from
  local state.
- **SUPERSEDED (`sdd/drop-intro-hero-placeholder/design` D2, 2026-08-24).**
  This recommendation was never implemented — verified by grep, `gsap` and
  `motion/react` were imported only by the now-deleted `NameRevealIntro.tsx`
  and nothing else in `src/`; `src/lib/` does not exist. The page turn that
  actually shipped is CSS (`clip-path` transition) plus the local
  `src/shell/useReducedMotion.ts` hook, not `AnimatePresence`. Do not
  restore a `lib/motion.ts` module on the strength of this paragraph — it
  would have zero importers. Original text, preserved for history: "The
  turn is one `motion.section` animating `clipPath` inside
  `<AnimatePresence mode="wait">`. `mode="wait"` is required — concurrent
  turns are the double-click dead state. `useReducedMotion()` selects the
  instant variant. Reuse the existing `HARD_CUT` constant from
  `NameRevealIntro.tsx`; export it to a shared `lib/motion.ts` rather than
  redefining it."
- **`inert`.** Supported in all current evergreen browsers. React 19
  supports it as a boolean prop. On React 18, set it imperatively via ref.
- **Do not** reach for a scroll library, a carousel, or a modal package.
  Everything here is a `<button>`, a grid, and one `clip-path`.

---

## Open Items

1. **Portrait asset.** `PhotoPlate` ships as a placeholder. Needs a real
   crop, a real `alt`, and a decision on whether it's halftoned at build
   time or via CSS.
2. **Real content.** Bio, role, objective, experience, project records,
   and the system-log lines are placeholder text in the proof. The log
   lines in particular should reflect true build state or be dropped —
   fabricated telemetry is exactly the "aesthetic for its own sake" that
   `10_PROJECT_MANIFESTO.md` rules out.
3. **Page-turn duration.** 140ms (literal to the doc) vs 200ms
   (recommended). Your call — see the Motion token table.
4. **Module page layouts.** Profile, Project Database, Skills, and
   Contact Terminal are stubs. Project Database needs its own handoff:
   the `PROJECT_00X` technical-record card from
   `04_COMPONENT_RULES.MD` is the densest component in the system and
   deserves the same treatment this doc gives Home.
5. **`styleguide.html` specificity bug** flagged in the 2026-07-27 audit
   (`.layout-mock > div` beating `.lm-spine`) is still unfixed. That file
   isn't in the repo tree — confirm whether it still exists anywhere
   before it drifts from `02_DESIGN_SYSTEM.MD` again.
