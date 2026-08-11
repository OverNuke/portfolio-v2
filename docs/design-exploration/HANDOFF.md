# Handoff Spec — Home, three design directions

Status: **exploration, awaiting a decision.** Nothing here is wired into the
app. This document is what to build once Keff picks 01, 02, 03, or a
combination — plus everything the proofs already decided so it does not get
re-decided by accident.

Source of truth for content: `src/routes/routes.ts`, `src/content/data.ts`.
Source of truth for tokens: `src/styles/tokens.css`. The proofs re-declare a
subset inline; they do not fork it.

---

## Overview

Home is currently `shell/Shell.tsx` + `shell/collage/Canvas.tsx` — a masthead,
an olive index plate carrying `NavItem`, a stack rail, and a contact strip.
All three directions replace that composition with:

1. one photograph (`profile-farming-aura-02.png`, the seated cutout),
2. one piece of oversized type,
3. a module readout that changes with the selection,
4. `OptionWheel` as the only navigation,
5. the stack, lower-right, as secondary type.

The Index plate and the profile plate are gone in all three. `/profile`,
`/certifications`, `/projects` and `/contact` remain real routes.

**`/contact` is now in the index.** Today it is deliberately excluded, because
Home carries the channel list itself (`Canvas.tsx`, "WHY CONTACT IS ON HOME").
None of these compositions carry a channel list, so the route needs a way in,
and the wheel is the only navigation on the page. If a direction ships, either
keep contact in the wheel or re-introduce a channel strip — not neither.

---

## Layout

| | Direction 01 | Direction 02 | Direction 03 |
|---|---|---|---|
| Field | Paper `#F6F6F4` | Near-black `#0E0E0E` | Paper `#E4E4E2` + full-height ink block, right `46vw` |
| Big type | Surname, flush left, `clamp(3.6rem, 17vw, 15rem)` | Module title, right column, `clamp(2rem, 5.6vw, 4.75rem)` | Module title centred **on the seam**, `clamp(2.4rem, 7vw, 6.2rem)` |
| Figure | Bottom-centred, `translateX(-42%)`, `78vh` | Left, bleeding off the edge, `82vh` | Straddling the seam at `54%`, `80vh` |
| Wheel | Left column, bottom | Right column, `side="right"` | Left column, bottom |
| Stack | Lower right, right-aligned list | Lower right, 4-column hairline lattice | Lower right on the ink block, staggered indents |
| Chrome | None | 44px header + 30px status bar + visible 12-col grid | None |

Page margin `--m` in all three: `clamp(20-22px, ~4vw, 56-64px)`.
Space scale is the app's: 4 / 8 / 12 / 16 / 24 / 32 / 48.
`border-radius: 0` is enforced globally, as in `tokens.css`.

**Ink budget.** At 1440×900 no direction covers more than ~55% of the frame.
This is the rule that keeps them from drifting back into the collage; check it
before adding anything.

---

## Design tokens used

| Token | Value | Usage |
|---|---|---|
| `--paper-white` | `#F6F6F4` | 01 field; 03 blend-source colour |
| `--paper` | `#E4E4E2` | 03 field |
| `--ink` | `#111111` | Type on paper; 02 and 03 ink block |
| `--ink-inverse` | `#F2F2F2` | Type on ink |
| `--gray` | `#5F5B55` | Secondary metadata on paper (≥7:1) |
| — | `#9A9A9A` | Secondary metadata on `#0E0E0E` (6.3:1). New; 02 only |
| `--font-serif-display` | LT Superior Serif ExtraBold | 01 masthead, 01/03 wheel + title |
| `--font-serif-edit` | LT Remark | Lede, 03 wheel |
| `--font-display` | Archivo Narrow 500/700 | 02 title and wheel only |
| `--font-mono` | JetBrains Mono | Every label, index, readout, stack entry |
| `--t-meta` / `--t-micro` | `0.6875rem` / `0.5625rem` | Labels / ticks |
| `--track-label` | `0.22em` | All uppercase mono |
| `--ease-hard` | `cubic-bezier(.7,0,.3,1)` | Every transition |
| `--dur-turn` | `200ms` | Section swap, progress track |
| `--dur-micro` | `90ms` | Nothing yet; reserved |

**Retired for this exploration:** `--field-olive*`, `--olive-edge`,
`--oxblood*`, `--warning-yellow`, `--scan-stock`. If a direction ships, either
delete them from `tokens.css` or write down where they still apply — leaving
them declared and unused is how the palette drifted last time.

**One point of colour**, direction 03 only: the photograph is not grayscaled,
so the oxblood sneaker stays red. It is pixels in a photo, not a token, and it
must not become one.

---

## Components

| Component | Source | Props / notes |
|---|---|---|
| `OptionWheel` | React Bits, JS + CSS variant | Drop in unchanged. `items`, `defaultSelected`, `onChange`, `side`, `fontSize`, `spacing`, `curve`, `tilt`, `blur`, `fade`, `minOpacity`, `smoothing`, `inset`, `loop`, `draggable`. Suggested home: `src/components/option-wheel/`. |
| `option-wheel.js` (this folder) | Vanilla port | **Delete on port.** Exists only because the proofs run from `file://`. Its header lists the four behaviours that must be carried over. |
| `NavItem` | `shell/collage/NavItem.tsx` | Not used. The wheel replaces it. Keep the component if `/projects` still wants it; delete it from Home. |
| `SkillBadge` | `components/skill-badge/` | Not used. The stack is plain `<li>` type, no icon. `SKILLS.filter(s => s.core)` still drives the list, so the `core` flag stays. |
| `ProfilePlate` | `components/profile-plate/` | Removed from Home. Still used by `/profile`. |

### Wheel settings per direction

| | 01 | 02 | 03 |
|---|---|---|---|
| `fontSize` (rem, desktop) | 2.1 | 1.7 | 1.9 |
| `spacing` | 1.55 | 1.6 | 1.5 |
| `tilt` / `curve` | 4.5 / 0.7 | 4 / 0.8 | 6 / 1 |
| `blur` / `fade` / `minOpacity` | 0.9 / 0.2 / 0.62 | 0.8 / 0.2 / 0.66 | 0.9 / 0.2 / 0.66 |
| `side` | left | right (left below 1024) | left |
| `loop` | true | true | true |
| `soundUrl` | **empty** — no audio in any direction | | |

`fontSize` scales ×0.78 at ≤1024 and ×0.62 at ≤640. Row height is baked in at
construction, so a breakpoint crossing must **rebuild** the wheel, carrying the
current index across (`sections.js › build()`).

---

## States and interactions

| Element | State | Behaviour |
|---|---|---|
| Page | `Space` | Next module. Bound at document level; ignored when focus is inside `a[href], button, input, textarea, select, summary, [contenteditable], [role=button], [role=link]`. `preventDefault()` so the page does not scroll. |
| Wheel | `↑ ←` / `↓ →` | Previous / next, one step, snapped. |
| Wheel | `Home` / `End` | First / last. Added on top of upstream. |
| Wheel | Scroll | Continuous on a touchpad, one step per notch on a mouse; snaps 140ms after the last event. |
| Wheel | Drag | Engages after 4px of movement, then captures the pointer. Under 4px it is a click and selects the item. |
| Wheel | Click on an option | Selects it by shortest path (loop-aware) and returns focus to the listbox. |
| Wheel | `:focus-visible` | 2px `currentColor` outline, 4px offset. **Added** — upstream sets `outline: none` and gives nothing back. |
| Option | Selected | Heavier weight + a marker: 01 a 12×2px rule, 02 a 6px square, 03 a triangle. Never colour alone. |
| Touch control | Default | 44×44 hit area, 26px ruled square, chevron. `pointer: coarse` only. |
| Touch control | Pressed | Square fills, chevron hides. No transition. |
| Touch control | `:focus-visible` | 2px outline, 2px offset. |
| Readout / lede / title | Selection change | Fade + 6px rise out over 130ms, content swap, fade back. 01 swaps the readout and lede; 02 also swaps the title, the ghost numeral and the progress track; 03 swaps the seam-crossing title. |

Nothing anywhere depends on hover.

---

## Responsive behaviour

| Breakpoint | Changes |
|---|---|
| Desktop (>1024px) | Absolute overlap composition as specified above. |
| Tablet (≤1024px) | 01 and 03 collapse the absolute layer to a flex column in DOM order (identity → module → stack → wheel), with the photograph absolute behind it, bleeding right. 02 keeps its column but left-aligns it and re-anchors the wheel to `side="left"`. 03 rotates its seam: the ink block becomes a bottom band and the figure stands on it. Wheel font ×0.78. |
| Mobile (≤640px) | Wheel font ×0.62; wheel pinned to the foot of the column. 02 drops the role and Space hint from its bars and folds the stack lattice to 2 columns. 03 hides the lede and the big vertical name. The touch control appears (coarse pointer). |

The desktop compositions are built on overlap, and overlap does not survive a
narrow viewport — you get type across a face. That is why the switch is a
layout mode change, not a scale-down.

---

## Edge cases

- **Long module title.** 02 wraps to two lines and the column absorbs it. 03 is
  `white-space: nowrap` and centred on the seam — a title longer than ~19
  characters at 1440 will start to crowd the margins. If module names grow,
  either drop 03's clamp maximum or allow a wrap with `text-align: center`.
- **Short module title.** 03's blend only reads if the title crosses the seam.
  Centring it on the seam guarantees that for any string length; flush-left or
  right-aligned does not. Do not "fix" the offset back to the margin.
- **More than 4 modules.** The wheel loops, so the count is free. Above ~7 the
  furthest options fall below the opacity floor — raise `minOpacity` and
  re-measure rather than lowering `fade`.
- **Fewer than 2 modules.** `createOptionWheel` returns `null` on an empty list;
  a single item renders and never moves. Neither is a real state here.
- **Missing portrait.** `alt=""` and no layout dependency on the image box in
  01 and 02 (height-driven), so a failed load leaves the type composition
  intact. 03's seam still reads. No skeleton, no spinner — it is one static
  asset on a page with no data fetching.
- **`color-mix` unsupported.** Options fall back to `--ow-text-color` and the
  active option loses its colour interpolation. Weight, the marker and opacity
  still separate it. Acceptable degradation; do not add a JS fallback.
- **Reduced motion.** Smoothing drops to 1ms and per-step blur to 0 at
  construction; every CSS transition goes to `0ms`. The wheel still reads as a
  wheel through position and opacity.

---

## Animation / motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Wheel options | Selection change | Exponential smoothing toward target; transform + opacity + blur | `smoothing: 200ms` time constant | — (rAF, not CSS) |
| Readout / lede / title | Selection change | Opacity 1→0, `translateY(6px)`, swap, back | 200ms out, 130ms hold | `--ease-hard` |
| Progress track (02) | Selection change | `scaleX` | 200ms | `--ease-hard` |
| Touch control | Press | Fill swap | 0ms | — |

No entrance animation, no loop, no autoplay, no parallax, no scroll-linked
motion. Under `prefers-reduced-motion: reduce` all of the above is 0ms and the
rAF loop settles on the first frame.

---

## Accessibility notes

Verified in Chromium at 1440×900, 834×1112 and 390×844.

- **Focus order:** wheel (single tab stop, `tabindex="0"`) → touch control.
  There is nothing else focusable on the page. Real links live inside the
  modules the wheel navigates to.
- **Roles:** `role="listbox"` on the wheel with `aria-label="Portfolio
  modules"`; `role="option"` + `aria-selected` per item; `aria-activedescendant`
  tracks the selection.
- **Announcements:** a `role="status" aria-live="polite"` region reads
  "*Projects, module 3 of 4*". This is not optional — `aria-activedescendant`
  only announces while the listbox has focus, and Space is normally pressed
  with focus on `<body>`.
- **Heading:** exactly one `<h1>`, visually hidden, carrying
  `ABOUT_PROFILE.fullName` and the role. The painted name fragments are
  `aria-hidden`.
- **Image:** `alt=""`. The photograph duplicates the heading and carries no
  information the page does not state in text — same call as the existing
  profile plate.
- **Contrast, measured from rendered pixels, not from computed styles:**

  | | nearest option | 1 step | 2 steps |
  |---|---|---|---|
  | 01 | 17.5:1 | 9.6:1 | 4.9:1 |
  | 02 | 17.2:1 | 9.1:1 | 5.2:1 |
  | 03 | 14.8:1 | 8.8:1 | 4.9:1 |

  All wheel type is ≥24px, so the AA bar is 3:1; every step clears 4.5:1
  anyway. Hierarchy in the wheel comes from **opacity over ink**, never from a
  lighter grey — a lighter grey at 60% opacity lands near 2.8:1.
- **Decorative chrome:** 02's grid hairlines are 5.5% and its ghost numeral 5%;
  03's cropped letters are 10–12%. All `aria-hidden`, all carrying no
  information, all well under the 3:1 non-text bar because none of them are UI.
- **Hit targets:** touch control 44×44 (WCAG 2.2 SC 2.5.8 floor is 24px).
- **Semantics:** `<main>`, `<h1>`, `<h2>`, `<ul>`/`<li>` for the stack, a real
  `<button>` for the touch control.

Not yet done: a screen-reader pass with NVDA or VoiceOver, and a check on iOS
Safari where `100dvh` and `pointer: coarse` both matter. Worth doing on the
chosen direction, not on all three.

---

## Port checklist (once a direction is chosen)

1. `pnpm add` nothing — copy the React Bits component into
   `src/components/option-wheel/` with its CSS.
2. Move `SECTIONS` into `routes.ts`: add a `lede` field to `RouteConfig`, drop
   `sections.js`.
3. Re-implement the composition as `shell/collage/Canvas.tsx` + a new
   `home.css`, keeping the rule already on record: the component applies class
   names only, never an inline style, never a pixel top/left.
4. Carry over the four additions from `option-wheel.js`'s header — Space,
   touch control, live region, reduced motion — as a thin wrapper around the
   React component, not as edits to it.
5. Delete `hm-plate`, `NavItem` from Home, the stack rail, and the contact
   strip; decide contact's fate per the note above.
6. Wire `onChange` to the existing turn machine (`src/turn/`) rather than to
   `navigate()` directly, so the page transition stays the one the app already
   has.
7. Add the portrait to `src/assets/plates/portrait/` (it is already there as
   `profile-farming-aura-02.png`) and delete `docs/design-exploration/`.
