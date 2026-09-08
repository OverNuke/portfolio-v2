# DESIGN IMPORT — CONTACT · DISTINCTIONS · PROJECTS (2026-09-04)

Developer handoff for `sdd/design-import-sections`. One document, three
sections, because the three mockups share a single new visual mechanism
(hand-cut `clip-path` plate edges) and settling it once is the whole point
of writing this before any code.

> **Deviation on file.** The proposal's Affected Areas says *three* handoff
> docs, one per section. This is one. The mechanism in §0 is shared by all
> three sections and splitting it three ways would either duplicate it or
> leave two documents pointing at a third. Verify should read this as
> satisfying the "3 handoff docs" criterion by consolidation, not by
> omission.

**Sources.** The raw canvas exports, in this directory:

| File | Canvas |
|---|---|
| `Contact Section.dc.html` | 1440 × 900, 4 channel cards + figure + status tag |
| `Distinction Section.dc.html` | 1440 × 900, 9 cards over 2 pages + number tabs |
| `Projects Section.dc.html` | 1440 × 900, 3 circular nodes + foot index |

They are Claude Design canvas templates: `<x-dc>` wrapping inline-styled
markup plus a `DCLogic` component class. **Nothing in them is wired
verbatim.** `image-slot.js` and `support.js` are the canvas runtime and are
not portfolio code — they are never ported. What is extracted is geometry
(polygons, rects, transform math), interaction structure, and composition
intent. Everything else — palette, typefaces, texture, rotation — is
translated into this system's tokens and register rules, or rejected.

**Precedent for this workflow:** `docs/design-exploration/contact-channel-field-2026-08-20.md`.
That document's shape is followed here: measured values, decisions with the
rejected alternative recorded next to them, and a "what will bite whoever
skips this" section per module.

---

# §0 — CROSS-CUTTING DECISIONS

These apply to all three sections. Settle them here; the per-section
sections below only reference them.

## ADR-1 — Hand-cut shapes are CSS `clip-path: polygon()`, authored in the module stylesheet

**Decision.** Every new irregular plate shape in this change is a CSS
`clip-path: polygon(...)` written directly in the module's own stylesheet
(`channel-field.css`, `cert-wall.css`). No SVG `<clipPath>`, no new
`FieldShapeDefs`-style defs component, no per-record shape data in TS.

**Why, against this codebase's own precedent.** `FieldShapeDefs.tsx` exists
for exactly one reason, and its header says so outright: *"`clip-path` has no
union of `polygon()` and `circle()` in one declaration, so this is the only
shape on the field that needs a real path instead of a CSS primitive."* SVG
`<clipPath>` is this repo's documented **escape hatch for shapes CSS cannot
express** — it is not the house mechanism. Every shape in this change is a
convex quadrilateral, which `polygon()` expresses natively.

There is a second-order payoff. Decision P1 deletes the fused lobe, which is
the *only* consumer of `#pf-fused`. After this change lands, `FieldShapeDefs.tsx`
is deleted and **no shape anywhere in the repo needs an SVG `<clipPath>`.**
The rule becomes clean and stateable: *CSS `clip-path` in the stylesheet is
how shapes are cut; SVG `<clipPath>` is the escape hatch, currently unused.*

**Rejected alternatives.**

| Alternative | Why not |
|---|---|
| SVG `<clipPath clipPathUnits="objectBoundingBox">` per card | Normalises to a 0–1 unit square and scales each axis independently — a tall banner and a wide block get visibly different cut angles from the same path. That is the exact failure the `.pf-shape--fused` comment warns about ("a non-square box would turn the lobe into an ellipse"). Also puts geometry in a `.tsx` file for shapes that carry no logic. |
| Shape data in `certLayouts.ts` / `channelLayout.ts` | Those files are explicitly coordinate-free by design (`channelLayout.ts`: *"it holds no coordinates"*). A polygon is a coordinate. |
| `border-radius` / `corner-shape` | `border-radius: 0` is enforced globally in `tailwind.config.ts` + `tokens.css`. Not negotiable, and not the shape wanted anyway. |

## ADR-2 — Cut depth is in `px`, not `%` — and this is what answers "do polygons differ per breakpoint?"

**Decision.** Every polygon vertex is expressed in absolute length
(`4px`, `calc(100% - 2px)`), never in percentage of the box. Where a slant
must stay proportional on a very short tile, it is clamped:
`calc(100% - min(22px, 9%))`.

**Answer to the breakpoint question: no. Not at any tier. By construction.**

**Why.** The mockups author every cut as a percentage — `polygon(0 1%, 99.4% 0, 100% 99%, .6% 100%)`.
Percentages in `polygon()` resolve **per axis against the reference box**, so
`1%` is 1% of *height* and `.6%` is 0.6% of *width*. On the Contact mockup's
214 × 340 email card that is 3.4px and 1.3px. On its 162 × 520 GitHub banner
the same numbers would be 5.2px and 1.0px. The mockup tuned each card's
percentages by eye at one fixed pixel size; the numbers do not survive being
reused at another size, and they emphatically do not survive fluid `fr`
tracks.

More importantly, percentage is the wrong *model*. A hand-cut edge deviates
by millimetres because a blade wanders by millimetres — not by a fixed
fraction of the sheet. A 4px nick on a small tile and a 4px nick on a large
tile read as the same hand. A `1%` nick reads as 2px on one and 8px on
another, which reads as two different tools.

So the cut depth is constant at every card size, and therefore constant at
every breakpoint, and therefore **there is exactly one polygon per shape
variant for the whole responsive range.** No `@media` override of any
`clip-path` appears anywhere in this change. If one ever does, it is a bug.

## ADR-3 — The clipped layer is a pseudo-element; the edge and the shadow are a `filter` on the *unclipped* parent

This is the single most consequential structural decision in the change, and
it is forced by two hard constraints — one accessibility, one rendering.

**Constraint A — `clip-path` clips the focus ring.** `outline` is painted as
part of the element's rendering and is clipped away with everything else
outside the polygon. Putting `clip-path` on `a.cf-card` would silently
mutilate `a.cf-card:focus-visible`'s `2px solid var(--cf-focus)` at
`outline-offset: 3px` — an offset ring sits *entirely* outside the polygon
and would vanish outright. That is a keyboard-navigation regression that no
contrast tool and no unit test would catch.

**Constraint B — a `filter` on the same element as a `clip-path` is erased
by the clip.** This is not inferred; it is already written down in this
repo, in `project-field.css`'s `.pf-record__figure` comment:

> *"a clipped element cannot paint its own boundary. `border`, `outline` and
> `box-shadow` are all drawn on the shape's RECTANGLE and then clipped away
> with everything else outside the circle, and a filter declared on the same
> element as a `clip-path` runs before the clip and gets erased too.
> `drop-shadow` on the parent traces the child's alpha silhouette after it
> has been clipped, which is the only thing here that follows a circle."*

`.pf-record__figure` is the working reference implementation of the exact
pattern this change needs. It is not a new pattern; it is the existing one,
applied to two more modules.

**Decision — the three-layer contract, identical in both modules:**

| Layer | Carries | Never carries |
|---|---|---|
| **The host** (`a.cf-card`, `figure.cert-mat`) | hit area, focus ring, `transform`/`scale`, and the whole `filter` chain | `clip-path`, `background`, `border` |
| **The fill** (`::before`, `position:absolute; inset:0; z-index:-1`) | `background` (the tone), `clip-path` | text, focus, pointer events |
| **The content** (existing real children) | all type and glyphs | any shape concern |

`z-index: -1` on `::before` is safe: both hosts already establish a stacking
context (`position: relative` + a real `z-index` — `--z-plate-interactive`
on `.cf-card`, `--z-plate-content` on `.cert-mat`), so the fill cannot
escape behind an ancestor's background.

**The edge and the shadow, in one filter chain on the host:**

```css
/* The ink edge — four zero-blur drop-shadows, one per direction. This is
   `.pf-record__figure`'s "THE EDGE" verbatim, at rule-thick instead of
   1.5px. It traces the clipped alpha, so the edge FOLLOWS THE CUT — which
   a `border` cannot do, because a clipped element cannot paint its own
   boundary. */
--cut-edge:
  drop-shadow(2px 0 0 var(--ink)) drop-shadow(-2px 0 0 var(--ink))
  drop-shadow(0 2px 0 var(--ink)) drop-shadow(0 -2px 0 var(--ink));
```

**Shadow token conversion — verified, not assumed.** Every plate shadow in
`tokens.css` is a *single* layer with no spread, so each maps 1:1 onto
`drop-shadow()`:

| Token / literal | Value | As `drop-shadow()` |
|---|---|---|
| `--plate-shadow` | `3px 4px 12px rgba(17,17,17,.22)` | `drop-shadow(3px 4px 12px rgba(17,17,17,.22))` |
| `--plate-shadow-sm` | `2px 3px 7px rgba(17,17,17,.18)` | `drop-shadow(2px 3px 7px rgba(17,17,17,.18))` |
| `.cf-card:hover` literal | `5px 7px 18px rgb(17 17 17 / 30%)` | `drop-shadow(5px 7px 18px rgb(17 17 17 / 30%))` |

The tokens themselves are **not changed** — they stay `box-shadow` values for
the modules that still use them. The two modules in this change consume the
same numbers through `filter` instead. Do not add `--plate-shadow-filter`
tokens; that would be two sources of truth for one number.

> **⚠ Must be verified in a real browser before apply is signed off.**
> Constraint B is quoted from this repo's own notes and is consistent with
> the spec's filter-then-clip ordering, but the *positive* case — filter on
> the parent tracing a clipped child's alpha through a `z-index: -1`
> pseudo-element — has only ever been exercised here with a real child
> element (`.pf-shape`), not a pseudo-element. If a pseudo-element's alpha
> turns out not to feed the parent's filter as expected, the fallback is a
> real `<span className="cf-card__plate" aria-hidden="true" />` first child.
> That fallback costs one element and changes nothing else in this document.
> The mockups are **not** evidence either way: the Distinction mockup puts
> `filter: drop-shadow()` and `clip-path` on the same div *and* supplies a
> separate `inset:-4px` backing layer, so its edge comes from the backing,
> not from the filter — the filter there may well be doing nothing.

**What the mockups got wrong here, recorded so it isn't copied.** The
Contact mockup puts `box-shadow: 8px 10px 0 rgba(25,27,22,.2)` on the same
span as the `clip-path`. `box-shadow` is drawn on the border box and then
clipped away with the rest — that shadow does not render. The Distinction
mockup uses `filter: drop-shadow(...)` instead, which is closer, but on a
clipped element it hits Constraint B. Neither construction survives
translation; both are replaced by ADR-3.

## ADR-4 — Palette, typeface and texture are rejected wholesale; only structure is imported

The mockups carry their own visual system. None of it enters the codebase.

| Mockup value | Status | This system's value |
|---|---|---|
| `#efece1` page ground | rejected | `--paper` `#e4e4e2` (`02_DESIGN_SYSTEM.MD` is law) |
| `#191b16` "ink" | rejected | `--ink` `#111111` |
| `#20241c` second dark | rejected | no second dark exists — maps to `--ink` |
| `#6f7f45` / `#4f5c2f` / `#8a9a55` olives | rejected | `--field-olive` `#4f5a3c`, one olive only |
| `#f4f1e6` paper-white | rejected | `--paper-white` `#f6f6f4` |
| Archivo Black | rejected | `--font-serif-edit` (Record) / `--font-mono` (Instrument) |
| Space Grotesk | rejected | `--font-mono` |
| Permanent Marker | **rejected, register violation** | see below |
| `repeating-linear-gradient` newsprint grain on the page | rejected | `--paper` is the ground; Record already has its blueprint grid |
| Halftone dot-screen circles (`showTone`) | rejected | see below |

**Permanent Marker is an Expressive-register vocabulary item.** Per
`01_ART_DIRECTION.MD`'s register table, `--font-hand` belongs to `/profile`
alone. Contact is **Instrument** — *"JetBrains Mono only — no serif
display."* Distinctions is **Record** — *"LT Remark titles + Mono meta."*
Every hand-lettered scrap in the three mockups is therefore rejected on
register grounds, not taste: Contact's `hover to lift` tag, Distinctions'
`honors` / `academic` / `language` kickers, its `view scan →` scrawls and
`certificate archive` marginalia, and Projects' `flagship` / `mobile` /
`module` badges. The kickers keep their *content* (they are
`certificate.category`, real data) and lose only the typeface — they set in
Mono, which is what `.cert-mat__kicker` already does.

**The halftone dot circles are rejected on register grounds too.** Instrument's
decorative vocabulary is *"Ink connector wires tucked behind plates, the
mechanical proximity dock, an illustrated figure bleeding off the bottom
edge."* Record's is *"faint blueprint-grid paper, hairline corner
registration marks, the vertical ghost title."* A floating halftone tone
circle is in neither list, and Record's blueprint grid already does the
"quiet texture behind the cards" job. `01_ART_DIRECTION.MD` requires *"a
case made for it"* for any element outside its surface's register; no case
is made here, so it does not ship.

## ADR-5 — Rotation, across all three mockups

D1 locks zero rotation for Distinctions. It is worth stating what governs
the other two, because D1 does **not** cover them and the Projects mockup
exceeds the general cap.

| Surface | Governing rule | Mockup's rotations | Verdict |
|---|---|---|---|
| `/certifications` | **Zero.** Record register trait (`01_ART_DIRECTION.MD`, `12_COLLAGE_SYSTEM.md`) | 30+ instances, `-8°` to `+1.6°` | all → `0` (checklist in §2.4) |
| `/contact` | Instrument. The 2026-08-20 spec: *"No rotation is used anywhere in this composition"* | one, `-2.4°`, on a rejected scrap | none ship |
| `/projects` | Sheet baseline, `±2°` cap (`12_COLLAGE_SYSTEM.md`) | `-3°`, `-2.6°`, `+2.6°` on badges; `-1.2°`, `+1.4°` on chips | badges rejected (register + over cap); chips stay unrotated |

The Projects badges fail twice over — hand font *and* over the ±2° cap — so
no cap-exception argument is available even if the typeface were changed.

---

# §1 — CONTACT

Module: `src/routes/ContactPage.tsx` → `src/components/channel-field/`.
Register: **Instrument**. Governing prior spec:
`docs/design-exploration/contact-channel-field-2026-08-20.md` — that
document is not superseded, it is amended, and every constraint it asserts
still holds unless contradicted below.

## 1.1 — Five slots to four (C1)

Instagram goes. Four channels: Email, GitHub, WhatsApp, LinkedIn.

**Which slot is deleted: `rail-b`.** Instagram holds it today
(`SOCIAL_LINKS`, `channelSlot: "rail-b"`), and the resulting 1-banner /
3-block shape is exactly what the mockup composes: Email block (dark),
GitHub banner (mid), WhatsApp block (mid), LinkedIn block (light). No other
slot mapping reproduces the mockup, so this is determined, not chosen.

### `channelLayout.ts` — exact changes

```ts
export const CHANNEL_SLOTS: readonly ChannelSlot[] = [
  "primary", "rail-a", "feature", "aside",     // "rail-b" removed
];

export const SLOT_VARIANT: Record<ChannelSlot, "block" | "banner"> = {
  primary: "block", "rail-a": "banner", feature: "block", aside: "block",
};

export const SLOT_TONE: Record<ChannelSlot, "light" | "mid" | "dark"> = {
  primary: "dark", "rail-a": "mid", feature: "light", aside: "mid",
};
```

`ChannelSlot` in `src/content/types.ts` drops the `"rail-b"` member — which
makes the deletion type-checked rather than merely tidy: any leftover
reference fails `pnpm typecheck`.

**`SLOT_TONE`'s doc comment must be rewritten, not just its values.** It
currently justifies itself as *"Dark-mid-light-mid-dark: … the two banners
bracket it in Ink so the sheet doesn't read as five identical blocks."*
With one banner left that sentence is false. Replacement rationale: *the
entry plate (`primary`, Email — the one channel with no external hop) is
Ink; the single banner is Field Olive; the widest plate (`feature`,
LinkedIn) is the sheet's one open Paper-White tile; `aside` returns to olive
so the two mid plates bracket the light one.* Same three fills, same
`cert-wall` `TileTone` reuse, new reason.

`assignChannelSlots`'s two-pass algorithm is **unchanged** — it is
count-agnostic, and the two-pass property (explicit claims resolved before
fallbacks) matters more at four slots than five, not less.

### `channel-field.css` — the grid

**Decision: keep all six track ratios exactly as they are. Leave c6 empty.**

```css
/* unchanged */
grid-template-columns: 0.95fr 0.55fr 0.85fr 0.55fr 1.5fr 0.75fr;
```

Delete `.a-rail-b`. Retuck the second connector so it still passes *behind*
a plate rather than floating in open paper:

```css
/* was 9 / 4 / 10 / 7 — tucked behind .a-rail-b (Instagram), which is gone.
   Now tucks under .a-feature (c5, rows 7-12). A bar with both ends in open
   paper reads as debris; that tuck is the entire effect. */
.a-conn-b { grid-area: 9 / 4 / 10 / 6; }
```

Also drop `.a-rail-b` from the `max-width: 900px` `grid-area: auto` release
list. That list is deliberately enumerated rather than wildcarded, so a
stale entry is harmless but a *missing* entry breaks visibly — keep it
enumerated.

**Why not rebalance to five tracks.** The tempting move is to delete c6 and
retune the remaining five so the open c4 track sits at the stage midpoint
again. It was rejected:

1. **It re-opens the marker derivation.** `.cf__mark`'s position is not a
   style value — it is a *verified clearance*. The CSS comment records it as
   *"> 10 points of stage height clear of the nearest plate (`.a-aside`) …
   that margin is geometric, not a stacking trick"*, and design #135 makes
   `--cf-ar: 1.5` load-bearing for the derivation. Changing five track
   widths changes `.a-aside`'s box and invalidates the clearance. Leaving c6
   empty changes exactly one input, and `--cf-ar` and the figure's
   `left: 50%` are untouched.
2. **It moves away from the reference.** The mockup's cards occupy x
   96–1124 of 1440 with the figure and status tag filling the right third —
   a left-weighted card field with the figure right of centre. An empty c6
   produces that. A rebalanced five-track grid re-centres everything and
   produces a composition the mockup does not show.

**Be honest about the cost.** c4's midpoint moves from ~51% of the stage to
~60%. That number was tuned on 2026-08-23 for the five-card composition and
is a *composition* target, not the marker constraint. **Fallback if the
empty right edge reads as broken:** narrow c6 (`0.75fr` → `0.35fr`) and stop
there. Do not rebalance all five — that is the move that costs the marker
derivation.

**One number to re-verify:** minimum Oxblood → Field Olive gap. `.a-aside`
(mid, olive) is unmoved and `.cf__mark` is unmoved, so this should be
unchanged, but it is the constraint the 2026-08-20 spec says *"a future
layout tweak could break silently, and no contrast tool will catch it"* —
so it is re-measured, not assumed.

### `dockHover.ts` / `useDockHover` — no logic change

`dockScale` and `dockTargets` are count-agnostic pure functions; nearest-wins
selection has no five-ness in it. `useDockHover` queries
`stage.querySelectorAll("a.cf-card")` at retarget time and adapts on its own.

**`DOCK_RADIUS_PX = 240` and `DOCK_MAX_SCALE = 1.07` stay.** The 240 was
tuned against a *measured* 175–194px centre spacing at five plates. Four
plates in the same-width stage spread further apart, so fewer plates fall
inside one radius at once — which nearest-wins already handles, and which if
anything makes the effect *cleaner*. The only risk is the opposite one: the
effect could feel dead in the gaps. That is a one-constant tune
(240 → ~280), not an architecture change, and it is a visual judgement call
exactly like the `DOCK_TAU_MS` comment describes. Do not pre-emptively
change it.

**Test and comment updates (mechanical, but they are real work):**

- `channelLayout.test.ts` — any assertion counting five slots, and the
  `overflow` assertion (which now trips at a *fifth* channel, not a sixth).
- `dockHover.test.ts` — fixtures built from five cards.
- `ChannelField.tsx`'s file header and `useDockHover`'s doc comment both say
  "five plates" / "all five plates". `channelLayout.ts`'s header says *"The
  composition has five slots"*. `channel-field.css`'s shed-order banner says
  *"the five plates … are always present."* `ChannelPlate`'s `unresolved`
  comment says *"five slots is the layout, and dropping to three leaves two
  holes."* All four → four.

### Two deletions that fall out of C1

**`InstagramIcon` is deleted from `SocialIcon.tsx`.** This closes a standing
open decision rather than dodging one. Open decision #3 of the 2026-08-20
spec was: *"Instagram's rounded-square mark — square it (breaks the brand
shape) or keep the radius (breaks the system's one absolute rule)."* The
mark shipped as a squared redraw under protest. With the channel gone the
dilemma is gone; carrying a dead icon that only exists to keep an unresolved
brand-fidelity argument alive is worse than deleting it. Drop the
`instagram` entry from `CHANNEL_GLYPHS` in the same commit.

**The `unresolved` / `.cf-card--pending` code path is KEPT, unused.** C2
resolves WhatsApp, so after this change no channel carries the flag and no
plate renders as pending. Keeping it matches the precedent
`FieldRecord.tsx`'s `Shape` sets for the no-image branch: *"No record
exercises that branch today; it is a real code path rather than a promise,
so the day one does, nothing here has to change."* Its tests stay, driven by
a fixture rather than by real data.

## 1.2 — WhatsApp resolves (C2)

```ts
{
  label: "WhatsApp",
  href: "https://wa.me/529212652693",
  handle: "+52 921 265 2693",
  meta: "Direct chat",
  channelSlot: "aside",
  // `unresolved` removed
},
```

`SOCIAL_LINKS`'s block comment currently ends with a paragraph explaining
that a `wa.me` link publishes a personal phone number *"permanently and
scrapeably"* and *"wants a deliberate yes."* **That paragraph is not
deleted — it is converted into the record of the yes,** dated 2026-09-04,
citing the proposal's C2. The reasoning is why the number is on the page;
erasing it would leave the next reader thinking nobody considered it.

`handle` prints the formatted number. It is the address, so
`.cf-card__meta`'s existing "wraps, never ellipses — a truncated address is
a wrong address" rule covers it with no change.

**The mockup's `scan qr / direct chat` copy and its QR `image-slot` are
deferred**, per the proposal's Out of Scope. The card ships its real link
and its existing anatomy. The `handle` line must therefore read as the
number itself, not as "scan qr" — that copy only makes sense beside an
image that is not shipping.

## 1.3 — Per-card clip-path shapes (C3)

Mechanism: ADR-1 + ADR-2 + ADR-3. Shapes are keyed **per slot** on the
existing `.a-*` placement classes, not per channel — the slot is what has a
size and a variant, and `channelLayout.ts` may hand any channel any slot.

```css
.cf-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  clip-path: var(--cf-cut);
  /* background comes from the tone rules, moved here off .cf-card */
}

/* Traced off the mockup's four polygons, converted to px per ADR-2 and
   tuned by eye. Four distinct cuts; adjacent plates never share one. */
.a-primary { --cf-cut: polygon(0 3px, calc(100% - 1px) 0, 100% calc(100% - 3px), 1px 100%); }
.a-rail-a  { --cf-cut: polygon(0 0, calc(100% - 1px) 3px, 100% 100%, 1px calc(100% - 2px)); }
.a-aside   { --cf-cut: polygon(0 4px, calc(100% - 2px) 0, 100% calc(100% - 2px), 1px 100%); }
.a-feature { --cf-cut: polygon(0 0, calc(100% - 1px) 3px, 100% calc(100% - 3px), 2px 100%); }
```

**Interaction with `--block` / `--banner`: none, and that is deliberate.**
The variants control `flex-direction` and `writing-mode` — type flow. The
cut controls the outline. Keeping them orthogonal is what lets the shed
order re-flow a banner into a block at 900px (`.cf-card--banner` flips to
`horizontal-tb`) without touching the shape. Under ADR-2 the cut is the same
px depth at every tier, so it survives that reflow untouched. **There is no
`@media` rule for any `--cf-cut`.**

**Interaction with the tone rules.** `background` moves from
`.cf-card--{tone}` to `.cf-card--{tone}::before`; `color` stays on
`.cf-card` (the type is not clipped). `.cf-card--light`'s
`border: var(--rule-thick) solid var(--ink)` is **deleted** — a border is
drawn on the rectangle and clipped away (ADR-3, Constraint B). Its job (Paper
White on Paper is ~1.09:1 and needs a boundary) is taken over by the
`--cut-edge` filter, which follows the cut. Per the mockup, *every* card
gets the ink edge, not just `light` — the mockup gives all four an
`inset:-4px` ink backing. That is a visual change to `mid` and `dark` and it
is intended.

**Interaction with `--dock-scale`.** None. `scale` on `.cf-card` scales the
pseudo-element with it; the cut scales too, which is correct — a magnified
plate should look magnified, not re-cut.

**Focus ring: unchanged and unclipped.** `a.cf-card:focus-visible`'s
`outline` is on the host, which carries no `clip-path`. This is the point of
ADR-3.

**Hit area.** `clip-path` clips pointer events as well as paint, so the
extreme corners of each card stop being clickable. Magnitude: ≤4px on one
corner. `scripts/audit.mjs` hit-tests the **centre point**, which is
interior to every polygon here, and its ≥24×24 check reads the unrotated
box, which is unchanged. No audit impact expected — but the audit is run to
confirm it, not to assume it.

## 1.4 — "Open to work" (C4): keep `.cf__mark`, reject the standalone tag

**Decision: keep the existing illustration-coupled `.cf__mark`. Do not add
the mockup's standalone `open to work` tag. This is settled, not open.**

Three reasons, in order of weight:

1. **A second badge duplicates it in the accessibility tree.** `.cf__mark-label`
   is the page's only statement of availability and is deliberately *not*
   `aria-hidden` — the 2026-08-20 spec devotes a whole subsection ("The
   accessibility trap in this structure") to keeping it there, and
   `ChannelField.tsx`'s header lists it as point 3 of "three things easy to
   undo by accident." Add a second visible copy and a screen reader
   announces "OPEN TO WORK" twice. Marking the new one `aria-hidden` to
   avoid that would ship a visible element carrying unique-looking
   information that is deliberately hidden — the exact anti-pattern doc 12's
   shed-order rule exists to prevent.
2. **The mockup's tag is Ink-on-Paper-White; the marker is Oxblood.** Oxblood
   is *"the composition's single accent"* and the marker is the only element
   that carries it (`channel-field.css`: *"the marker, and nothing else"*).
   Adopting the mockup's tag and dropping the marker would remove the
   composition's only accent colour. Adopting both would put two status
   badges of different colours on one sheet.
3. **The marker's position is a verified derivation, the tag's is not.** The
   marker is anchored in percentages of the *figure's* box, re-derived per
   pose, with a documented per-tier override at 900px and a note that it was
   *"verified visually … not just by silhouette-band math."* The mockup's tag
   is `left: 1180px; top: 186px` on a fixed canvas. There is nothing to port.

**Recorded in the handoff as the mockup's intent, and rejected:** the
mockup's tag sits *outside* the figure, top-right, which reads as a page-level
status stamp rather than a label on the character. That is a legitimate
alternative composition. It is not adopted because the cost above is real and
the benefit is aesthetic. If it is ever revisited, the correct move is to
*move* `.cf__mark` out of `.cf__figure`, not to add a second element — and
that re-opens the whole clear-zone derivation.

## 1.5 — Contact: everything else in the mockup, and why it does not ship

| Mockup element | Verdict |
|---|---|
| Per-card `image-slot` (inbox screenshot, GitHub profile, LinkedIn card) | **Rejected.** These are canvas-runtime placeholders (out of scope). No assets exist. Putting a screenshot in every channel plate is a composition change nobody signed off; the proposal's 10 decisions do not mention it. |
| Per-card `01`/`02`/`03`/`04` index numbers | **Rejected.** The 2026-08-20 v2 revision removed the `(0n)` markers deliberately and its Data section says outright: *"v1 also asked for an `index` field to print `(01)`…`(05)`. **Do not add it.**"* The mockup re-proposes a decision already made against. |
| `↗` arrow glyph per card | **Rejected.** Every external plate already carries `— opens in a new tab` in a `.visually-hidden` span. A decorative arrow duplicates it visually and adds nothing. |
| `[04] — contact / "Four ways in…"` lede block | **Rejected.** The module wheel already prints the lede on the way in (`ROUTES[].lede`), which is why v2 removed the status line for the same reason. |
| `panel 5a · channels` / `replies within 24h · mty, mx` footer | **Rejected.** Invented copy, and "replies within 24h" is a commitment the site does not make elsewhere. |
| `REACH OUT` 96px display heading | **Rejected.** `PageLayer` owns the page `<h1>`; `.cf__title` ("CHANNELS") is the `<h2>` and the Instrument register's masthead slot. A second display heading duplicates the page title. |
| `hover to lift` marker scrap | **Rejected.** ADR-4 (Permanent Marker) + ADR-5 (`-2.4°`). |
| Two ink bars at `top:604px` / `top:678px` | **Adopted in spirit — already shipped.** These are the mockup's version of `.cf__conn` a/b, which already exist and already tuck behind plates. No change beyond the `.a-conn-b` retuck in §1.1. |
| Dock falloff `exp(-(dx² + dy²))`, `spread: 240`, `strength: 26%`, `translateY(-46px * f)` | **Rejected in favour of the shipped implementation (C4 locks this).** Worth noting the shipped version is strictly better on two counts: the mockup scores *every* card independently, which is the exact multi-bulge bug `dockHover.ts`'s header documents fixing on 2026-08-26; and it snaps to the computed value each frame rather than easing, which is the other half of what read as rough. The mockup's 240px spread independently landing on the shipped `DOCK_RADIUS_PX = 240` is a useful confirmation of that constant. |

---

# §2 — DISTINCTIONS (`/certifications`)

Module: `src/components/cert-wall/`. Register: **Record**.

## 2.1 — Layout engine (D2): keep the 12×12 ladder, unchanged

**Decision: `certLayouts.ts` is not modified. Not the areas, not the tones,
not the pagination. Only tile *shape* changes.**

This is not a preference call. The mockup's composition **is already what
ships** — geometry and tone both. Measured off the two files:

**Page 1 (6 cards) vs. `WALL_LANDSCAPE[6]`:**

| Mockup card | Mockup rect (x, y, w, h) | Reads as | `WALL_LANDSCAPE[6]` slot | Mockup fill | Slot `tone` |
|---|---|---|---|---|---|
| anfeca | 40, 44, 856, 452 | large, top-left, ~⅔ width | `1 / 1 / 9 / 8` `lead` | `#f4f1e6` | `light` ✓ |
| nota | 924, 44, 448, 212 | upper right | `1 / 8 / 5 / 13` | `#6f7f45` | `mid` ✓ |
| exaver | 924, 284, 448, 212 | lower right, stacked under nota | `5 / 8 / 9 / 13` | `#20241c` | `dark` ✓ |
| english | 40, 524, 426, 332 | bottom band, left third | `9 / 1 / 13 / 5` | `#20241c` | `dark` ✓ |
| toefl | 493, 524, 426, 332 | bottom band, middle third | `9 / 5 / 13 / 9` | `#f4f1e6` | `light` ✓ |
| ai | 946, 524, 426, 332 | bottom band, right third | `9 / 9 / 13 / 13` | `#6f7f45` | `mid` ✓ |

**Six for six, geometry and tone.**

**Page 2 (3 cards) vs. `WALL_LANDSCAPE[3]`:**

| Mockup card | Rect | Reads as | `WALL_LANDSCAPE[3]` slot | Fill | `tone` |
|---|---|---|---|---|---|
| powerbi | 40, 44, 620, 812 | full-height left column | `1 / 1 / 13 / 6` `lead` | `#f4f1e6` | `light` ✓ |
| aiinit | 684, 44, 688, 532 | tall right, upper | `1 / 6 / 9 / 13` `lead` | `#20241c` | `dark` ✓ |
| propadeutic | 684, 600, 688, 256 | short right, lower | `9 / 6 / 13 / 13` `baseline` | `#6f7f45` | `mid` ✓ |

**Three for three.** And 6 + 3 is exactly `PER_SHEET_LANDSCAPE = 6` against
nine certificates — the shipped pagination, unchanged.

This is not a coincidence. `certLayouts.ts`'s own header records that
`WALL_LANDSCAPE[6]` and `[3]` were authored from an earlier bento mockup's
pages 1 and 2 (*"Shape of the mockup's page 1 — tone balance 2 light / 2 mid
/ 2 dark"*). The new import is a **restyle of the same composition**, not a
new one. Everything genuinely new in it is surface: the cut edges, the
number tabs, and decoration.

**What replacing the ladder with absolute rects would have cost** (recorded
so the option is closed, not merely unchosen):

1. **The portrait ladder would have no replacement.** `WALL_PORTRAIT` serves
   tablet-portrait, is `visual`/`micro` orientation-matched, and the mockup
   is desktop-landscape only. Absolute rects delete it with nothing to put
   back.
2. **`assertCertLayouts` would have nothing to assert.** It is this module's
   *data-layer* occlusion guarantee — *"Every mat carries a hit target, so an
   overlap here is an occlusion bug, not a style choice."* Its
   `parseArea`/`overlaps` machinery is grid-area-shaped. Pixel rects would
   need an entirely new invariant checker, and `scripts/audit.mjs` is
   explicitly described as the *second* layer, not a substitute.
3. **It would hardcode 1440 × 900 into a module whose defining constraint is
   never scrolling at any viewport.** The sheet is a `--cw-ar`-bounded stage
   sized by container queries precisely so it fits. Absolute px rects do not
   fit anything but 1440.
4. **It would break record-to-slot matching.** `assignSlots` +
   `wantsHero`/`wants` exist because the certificates are not
   interchangeable. Absolute rects assume a hand-curated fixed order — the
   mockup literally hardcodes `data-card="anfeca"`.

### How per-card shapes work against a grid layout

The mockup gives each of its nine cards a distinct polygon. Those polygons
cannot be per-*certificate* here, because `assignSlots` decides at render
time which record lands in which slot — a shape attached to a certificate
would move around the page as the record set changes, and would be undefined
for a certificate that is added later.

**Decision: cuts are keyed by slot index, `slotIndex % 4`, from a fixed set
of four.**

```tsx
// CertWall.tsx — alongside the existing `--cw-i` style thread
<figure className={...} style={style} data-cut={slotIndex % 4}>
```

```css
.cert-mat::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  clip-path: var(--cw-cut);
}

/* Four hand-cut variants, traced off the mockup's nine polygons and
   reduced to their distinct families, in px per ADR-2. */
.cert-mat[data-cut="0"] { --cw-cut: polygon(2px 0, 100% 4px, calc(100% - 1px) calc(100% - 5px), 0 100%); }
.cert-mat[data-cut="1"] { --cw-cut: polygon(0 5px, calc(100% - 2px) 0, 100% calc(100% - min(22px, 9%)), 2px 100%); }
.cert-mat[data-cut="2"] { --cw-cut: polygon(0 12px, 100% 0, calc(100% - 2px) calc(100% - 10px), 2px 100%); }
.cert-mat[data-cut="3"] { --cw-cut: polygon(0 0, calc(100% - 4px) 5px, 100% 100%, 2px calc(100% - 5px)); }
```

Why this is the right key:

- **Deterministic.** Same page, same shapes, every visit — the rule
  `certLayouts.ts` states about never using `useCollageSeed`'s randomness
  (*"randomising placement at runtime makes the page different every visit,
  which reads as broken rather than as handmade"*) applies to shape for the
  same reason.
- **Adjacent tiles always differ.** Modulo 4 over slot order guarantees no
  two consecutive slots share a cut. Six slots on page 1 give the sequence
  0,1,2,3,0,1 — the only repeats are four apart, diagonally across the sheet.
- **It composes with what is already threaded.** `slotIndex` is already
  passed to every tile as `--cw-i`; `data-cut` rides the same value.
- **Cut 1's `min(22px, 9%)`** preserves the mockup's one pronounced feature
  (nota's slanted bottom edge, `100% 88%` on a 212px-tall card ≈ 25px)
  without letting it eat a short `baseline` tile. This is the single
  documented exception to ADR-2's px rule, and it is a clamp, not a
  percentage.

### The structural changes on `.cert-mat`

Per ADR-3, and note that **the focus ring here needs no special handling**:
the ring is on `.cert-mat__trigger` *inside* `.cert-mat`, and `.cert-mat`
itself carries no `clip-path`. Only `::before` is clipped.

- `.cert-wall[data-sheet="landscape"] .cert-mat` — `background` moves to
  `::before`; `border: var(--rule-thick) solid var(--ink)` is **deleted**
  (clipped away, ADR-3) and replaced by the `--cut-edge` filter chain.
- `overflow: hidden` **stays** on `.cert-mat`. It is the title safety net
  (`.cert-mat__title`'s comment explains the `-webkit-line-clamp` collapse it
  works around), and `::before` at `inset: 0` is inside the box, so nothing
  clips.
- The hover lift's `box-shadow` moves into the same `filter` chain. A
  `box-shadow` on a now-transparent, unclipped `.cert-mat` would paint a
  rectangle with no fill behind it.
- `::after` on `.cert-mat` is confirmed **free** — the only `::before`/`::after`
  in the module are on `.cert-mat__scan--empty`, a different element. If the
  ADR-3 filter fallback is needed, `::after` is available for a second
  clipped layer.
- **Portrait ladder and ledger are untouched.** They keep their existing
  rectangular mats. `data-cut` and `--cw-cut` are scoped under
  `[data-sheet="landscape"]`, matching how exception 3's radius reversal is
  already scoped.

## 2.2 — The pager: dots → "01" / "02" number tabs (D3)

**What is kept, non-negotiably: `LinkComponent` + `pagerHref`.** The mockup
pages with `this.setState({ page })` and no URL. This codebase routes
`/certifications/2` (`defaultPagerHref`, `CertificationsPage`'s `useParams`),
because CLAUDE.md's page-turn model requires *"browser back/forward and
deep-links work."* Swapping real links for local state is a routing
regression wearing a restyle. The tabs are `<Link>`s.

**Structure** — `.cert-pager__dots` becomes `.cert-pager__tabs`; each dot
becomes a numbered tab, with the current-page tab keeping its existing
inert-`<span>` treatment verbatim:

```tsx
<div className="cert-pager__tabs">
  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
    const label = String(n).padStart(2, "0");
    return n === current ? (
      <span key={n} className="cert-pager__tab" data-inert="true" aria-current="page">
        <span aria-hidden="true">{label}</span>
        <span className="visually-hidden">{`Sheet ${n}, current`}</span>
      </span>
    ) : (
      <Link key={n} className="cert-pager__tab" href={pagerHref(n)}>
        <span aria-hidden="true">{label}</span>
        <span className="visually-hidden">{`Sheet ${n}`}</span>
      </Link>
    );
  })}
</div>
```

The inert-`<span>`-not-`aria-disabled`-link choice is preserved with its
existing reason: *"a disabled link still takes focus and still fires on
Enter."*

**It generalises past two pages.** `Array.from({ length: pageCount })` is
unchanged, so a tenth certificate produces `01 / 02 / 03` with no code
change. Do not hardcode two tabs to match the mockup.

**Next / Previous buttons are removed** — with every page one tab away they
are redundant, and the mockup has none. **But that creates a debt that must
be paid in the same change:**

> `.cert-pager`'s Next/Previous pair is the only place this module expresses
> doc 03's *"NEXT sits LEFT of PREVIOUS — directional chrome reads with the
> right-to-left turn."* Deleting them deletes that statement. The tabs must
> carry it instead. **Decision: stack the tabs vertically** (as the mockup
> does), which is direction-neutral and needs no mirroring claim at all. If
> they are ever laid out horizontally, `02` must sit left of `01`.

**Styling** (Record register, ADR-5): 40 × 40 square, `--rule-thick` ink
border, `--font-serif-edit`, active = `--ink` fill with `--ink-inverse`
type, inactive = `--paper-white` with `--ink`. **Zero rotation** — the
mockup's `TAB_BASE` bakes `rotate(-1.5deg)` / `rotate(1.5deg)` into the base
style and `rotate(±2deg)` into hover. All four go to `0`; the hover keeps
`translateY(-2px)` only. `border-radius: 0` — and note the current
`.cert-pager__dot-glyph` is in the `--cw-radius` allowlist, so **removing
the dot glyph removes one allowlist entry** (see §4).

**Position stays where it is: a sibling in normal flow, outside
`.cert-wall`.** The mockup floats the tab column at `right: 10px; top: 44px`,
in the 40px page margin beside the card field. That margin exists at 1440
and does not exist at 1100 — where the tabs would land on top of a mat and
violate doc 12's guardrail 1 (never occlude a control). Keeping the pager in
flow also keeps it out of `.cert-wall__sheet`'s no-scroll height budget.

## 2.3 — Arrow-key paging is NEW WORK, not reuse

**D3 says "reuse existing arrow-key/Escape page logic; do not rebuild."
That was written on a wrong premise. `/certifications` has no arrow-key
paging today.** Verified: `CertificationsPage.tsx` imports no keyboard hook,
and `useFieldKeyboard` is imported only by `ProjectsPage.tsx`.

The mockup does bind arrows, so the intent is real — it is just new work.
This must reach tasks and apply with a budget, not be assumed free.

**Decision.** `useFieldKeyboard` is already module-agnostic — its only inputs
are `onForward` / `onBack`, and it imports nothing from `project-field`.
Move it from `src/components/project-field/useFieldKeyboard.ts` to
`src/turn/useFieldKeyboard.ts`, beside `useInert` and `useTurnKeyboard`
where the rest of the shell's keyboard layer lives, and update both
importers. Do not copy it, and do not write a second handler — its
capture-phase / `stopPropagation`-only-when-handled mechanism is the thing
that makes fall-through to `useTurnKeyboard` automatic, and there must stay
exactly one implementation of it.

Wiring in `CertificationsPage`:

```ts
useFieldKeyboard({
  onForward: current < pageCount ? () => navigate(pagerHref(current + 1)) : undefined,
  onBack:    current > 1         ? () => navigate(pagerHref(current - 1)) : undefined,
});
```

**⚠ The mockup's mapping is inverted relative to house convention.** It binds
`ArrowRight → goPage2`, `ArrowLeft → goPage1`. This system binds
**Left = forward, Right = back** (manga turn order; `05_ACCESSIBILITY.MD`,
CLAUDE.md). Left goes to the *next* sheet. Do not copy the mockup's
direction.

Escape is **not** handled — `useFieldKeyboard`'s header states the
asymmetry deliberately: *"Right unwinds one sheet at a time, Escape exits the
module outright."* The mockup's `Escape → close lightbox` is already covered
by `CertScanModal`.

`pageCount` currently lives inside `CertWall`; the page needs it to wire the
guards. Compute it in `CertificationsPage` from
`Math.ceil(CERTIFICATES.length / perSheet(sheet))` using the exported
`perSheet` — do not duplicate the constant.

## 2.4 — Rotation-stripping checklist (D1)

Every rotated value in `Distinction Section.dc.html`. **All of these render
at `0deg`.** This table is the acceptance criterion; `rg 'rotate\(' src/components/cert-wall/`
must return nothing.

| # | Element | Mockup value | Ships as |
|---|---|---|---|
| 1 | anfeca card hover | `translate(-2px,-7px) rotate(-.3deg)` | translate only |
| 2 | nota card hover | `translate(3px,-7px) rotate(.35deg)` | translate only |
| 3 | exaver card hover | `translate(4px,-7px) rotate(-.35deg)` | translate only |
| 4 | english card hover | `translate(-2px,-8px) rotate(-.4deg)` | translate only |
| 5 | toefl card hover | `translate(1px,-8px) rotate(.45deg)` | translate only |
| 6 | ai card hover | `translate(3px,-8px) rotate(-.35deg)` | translate only |
| 7 | powerbi card hover | `translate(-2px,-8px) rotate(-.3deg)` | translate only |
| 8 | aiinit card hover | `translate(3px,-8px) rotate(.3deg)` | translate only |
| 9 | propadeutic card hover | `translate(4px,-8px) rotate(-.35deg)` | translate only |
| 10 | anfeca kicker underline | `rotate(-1.6deg)` | `0` |
| 11 | powerbi kicker underline | `rotate(-1.8deg)` | `0` |
| 12 | aiinit kicker underline | `rotate(1.4deg)` | `0` |
| 13 | anfeca 3-bar rule group (×3) | `rotate(-.8deg)` | `0` |
| 14 | powerbi 3-bar rule group (×3) | `rotate(-1deg)` | `0` |
| 15 | "View scan ↗" badge, anfeca | `rotate(-1.2deg)` | `0` |
| 16 | "View ↗" badge, nota | `rotate(1.4deg)` | `0` |
| 17 | "View ↗" badge, exaver | `rotate(-1.6deg)` | `0` |
| 18 | "View ↗" badge, english | `rotate(1.6deg)` | `0` |
| 19 | "View ↗" badge, toefl | `rotate(-1.4deg)` | `0` |
| 20 | "View ↗" badge, ai | `rotate(1.5deg)` | `0` |
| 21 | "View ↗" badge, powerbi | `rotate(-1.4deg)` | `0` |
| 22 | "View ↗" badge, aiinit | `rotate(1.5deg)` | `0` |
| 23 | "View ↗" badge, propadeutic | `rotate(-1.4deg)` | `0` |
| 24 | "view scan →" scrawl, powerbi | `rotate(-2deg)` | **element rejected** (ADR-4) |
| 25 | "view scan →" scrawl, aiinit | `rotate(1.6deg)` | **element rejected** (ADR-4) |
| 26 | toefl decorative 3-bar stack | `rotate(-8deg)` | `0` if adopted; stretch |
| 27 | "Certified!!" comic burst | `rotate(-7deg)` | `0` if adopted; stretch |
| 28 | "Level up!!" comic burst | `rotate(-8deg)` | `0` if adopted; stretch |
| 29 | ★ / ! star badge group | `rotate(-4deg)` | `0` if adopted; stretch |
| 30 | tab `01` base | `rotate(-1.5deg)` | `0` |
| 31 | tab `02` base | `rotate(1.5deg)` | `0` |
| 32 | tab `01` hover | `translateY(-2px) rotate(-2deg)` | translate only |
| 33 | tab `02` hover | `translateY(-2px) rotate(2deg)` | translate only |
| 34 | lightbox panel | `rotate(-.6deg)` | **element rejected** (see below) |

**Two non-rotation items that belong on this checklist:**

- **#35 — the ★ badge's `border-radius: 52% 48% 46% 54%/50% 54% 46% 50%`
  and the `!` badge's `border-radius: 50%`.** These violate the global
  `border-radius: 0`, and §4 *withdraws* the module's existing radius
  allowlist rather than extending it. If the badge ships at all it is a
  `clip-path` polygon (ADR-1), never a radius.
- **#36 — the ghost title's `transform: rotate(180deg)` +
  `writing-mode: vertical-rl`.** This is a writing-direction flip, not a
  tilt, so D1 does not strictly reach it — but this system's rule is
  independent and stricter: *"`writing-mode` on real text — never a transform
  on a text node"* (`channel-field.css`, `CertParts.tsx`'s `GhostTitleMark`).
  `GhostTitleMark` already ships the correct construction. **No change; do
  not port the mockup's version.**

## 2.5 — Distinctions: rejected and deferred

| Mockup element | Verdict |
|---|---|
| Lightbox overlay (`isOpen` scrim + 640px panel) | **Rejected wholesale.** `CertScanModal` already exists and is strictly better: real focus management, `useInert` on the sheet, focus return to the trigger. The mockup's has none of it, plus a rotation and a hardcoded 640px. |
| `honors` / `academic` / `language` kickers in Permanent Marker | **Content kept, typeface rejected** (ADR-4). These are `certificate.category` — real data, already rendered by `.cert-mat__kicker` in Mono. |
| Comic bursts "Certified!!" / "Level up!!" | **Stretch**, per proposal Out of Scope. If adopted: zero rotation (#27, #28), and the 8-layer `text-shadow` outline must be checked against `05_ACCESSIBILITY.MD` — it is decorative, so it is `aria-hidden`, and it must not occlude a hit target. |
| ★ / ! star badge | **Stretch.** Plus #35 above. |
| toefl's decorative 3-bar stack | **Stretch.** |
| `certificate archive` marginalia | **Already shipped** as `GhostTitleMark`. See #36. |
| Card hover `.32s cubic-bezier(.2,.85,.2,1)` | **Rejected — see §4.2.** The mockup asks for exactly the 320ms soft easing that is currently shipped and that doc 07 withdrew on 2026-09-02. The later-dated doc correction wins. |
| `#20241c` as a second dark | **Rejected** (ADR-4). `dark` is `--ink`. |
| `View ↗` badge inside every card | **Already shipped** — `.cert-mat__affordance` on `lead` tiles, plus the `visually-hidden " — view scan"` on every trigger. The mockup puts a visible one on all nine; adopting that is a small, safe fidelity win and is optional. |

## 2.6 — Addendum, 2026-09-08 (`sdd/distinction-section` follow-up)

A fidelity pass after visual review of the running build against this same
artboard. Four decisions in this section are revised:

1. **D5 / the "View scan" pill (`.cert-mat__affordance`) is withdrawn.** It
   was rendered on every landscape tile, pinned top-right, and hidden on
   `baseline`. In the running build it rendered as an *empty* ink/paper
   rectangle on every `--mid` and `--dark` tone, sat in corners the artboard
   does not use, and collided with the real `CertLink`. Root cause: the
   artboard's "View ↗" is decorative *because that mockup has no separate
   link* — the whole card opens the lightbox. This build is richer (the tile
   IS the `<button>` opening `CertScanModal`, and `CertLink` is a real `<a>`
   to the credential URL), so a third decorative element that duplicates the
   trigger earns removal. **One visible "view" mark per tile now: `CertLink`,
   top-right on every landscape tile** (the `data-cut` polygons slope the
   *bottom* edge in by up to ~22px, so a bottom-right link fell off the
   plate; top-edge cuts are 0–5px). The trigger keeps its
   `visually-hidden " — view scan"` accessible name.

2. **The `.cert-wall__sheet` blueprint hairline grid (added 2026-08-19) is
   removed.** Not in the artboard, reverted-and-re-added once already, and
   the tiles carry their own ink trim + hard shadow. `--paper` is the ground
   (ADR-4).

3. **The soft `drop-shadow(0 14px 32px …)` hover shadow is removed.** §4.2 /
   the 2026-09-04 note already stripped the *soft easing*; this strips the
   soft *shadow layer* too. The artboard's hover is `translate` only; a large
   blurred shadow stacked on the zero-blur rest shadow read as a doubled,
   janky drop. The `filter` chain is now constant rest↔hover — hover is
   `translateY(-3px)` and nothing else. (`trim-edge.test.ts` T2 still holds;
   `cert-wall.spec.ts` CW-focus updated 6→5 drop-shadows.)

4. **The `baseline` tile is relaid on a 3-row grid** (kicker top, title +
   meta bottom row) — it was pooling all content at the bottom edge and
   clipping the issuer mid-word.

---

# §3 — PROJECTS

Module: `src/components/project-field/`. Register: Sheet baseline.

## 3.1 — Flagship shape: fused lobe → circle (P1). Dependency audit first.

**Audited. Nothing depends on the lobe's geometry. Safe to delete.**

| Suspect | Finding |
|---|---|
| `fieldLayout.ts` positioning math | `FieldShape` is `{cx, cy, d}` — a centre and a **diameter**. `shapeTop`/`shapeBottom` compute `cy ± (d/2) * STAGE_AR`, i.e. they already model the primary as a circle of diameter `d`. |
| The lobe's actual bounding box | The path is `M1,0 H0.5 A0.5,0.5 0 0 0 0.5,1 H1 Z` on a unit square with `aspect-ratio: 1` — a semicircle of radius 0.5 spanning the full height, plus a flat half. **Bounding box is exactly `d` × `d`, identical to the circle's.** Every `assertFieldLayouts` invariant (descending scale, on-stage, clears `INDEX_TOP`, primary bleeds past both band edges) computes on that box and is unaffected. |
| Hit-testing | There is none on the shape. `FieldRecord.tsx`: *"Nothing on the field is clickable except that chip."* The article is `pointer-events: none`. |
| `aspect-ratio` assumptions | `.pf-shape { aspect-ratio: 1 }` is required by `circle(closest-side)` just as it was by the lobe. Unchanged. |
| `useReform` | `data-reform-id="figure-N"` scales the figure box; the header note *"it is a square, so the circle stays a circle under a uniform scale"* holds for a circle a fortiori. |
| `.pf-record__figure`'s drop-shadow edge | Traces the child's clipped alpha — follows whatever shape the child is. Unchanged. |

**Deletions:**

- `.pf-shape--fused` and `.pf-shape--fused::after` (the seam) in
  `project-field.css`.
- `FieldShapeDefs.tsx` **entirely**, and its `<FieldShapeDefs />` render in
  `ProjectField.tsx`. `#pf-fused` was its only export and the lobe its only
  consumer.
- The `FieldShapeVariant` type and `Shape`'s `variant` prop. A union with one
  member is noise; `Shape` renders `.pf-shape--circle` unconditionally.
  `FieldRecord`'s `primary` prop **stays** — it drives `data-primary` and the
  caption hierarchy, not the shape.

`FieldShapeDefs.tsx`'s header explains *why* an SVG path was needed. That
reasoning is not lost — it is promoted into ADR-1 above as the standing rule
for when an SVG `<clipPath>` is warranted.

Check `fieldLayout.test.ts` and any `ProjectField`/`FieldRecord` test for
`fused`, `pf-fused`, or `pf-shape--fused` assertions before deleting.

## 3.2 — Click-to-expand on all three nodes (P2)

**A bug surfaces while specifying this.** `ProjectField.tsx` renders
`<FieldRecord project={primary} slot={layout.primary} position={1} primary />`
with **no `onExpand`**. The primary record cannot expand today at all — the
affordance was only ever wired to `secondary`. P2's real change is passing it
to every record, primary included.

### `RecordAction` — both, not either/or

Current behaviour, from its own header: *"Repo link when there is a real one,
an expand trigger when there isn't but there is an image worth inspecting
closer, nothing when there is neither. **Never both.**"* That sentence is
what P2 overturns.

```tsx
function RecordAction({ project, onExpand }: { project: Project; onExpand?: ... }) {
  const repo = getProjectStatus(project) === "Live" && project.repo;
  if (!repo && !(onExpand && project.image)) return null;

  return (
    <p className="pf-record__action">
      {repo && (
        <a className="pf-chip" href={project.repo} target="_blank" rel="noopener noreferrer">
          <SiGithub size={11} aria-hidden="true" />
          Repository
          <span className="visually-hidden"> — {project.title}, opens in a new tab</span>
        </a>
      )}
      {onExpand && project.image && (
        <button type="button" className="pf-chip pf-chip--expand" onClick={onExpand}>
          Expand
          <span className="visually-hidden"> — {project.title} screenshot, view larger</span>
        </button>
      )}
    </p>
  );
}
```

Resulting affordances: Barbershop → Repository + Expand. AcopiaTech →
Repository + Expand. Odoo → Expand only.

**Odoo is the risk case and it is the one to build against first.** It is the
only record whose *sole* affordance is the overlay today; if the expand path
regresses, Odoo becomes a record with no interaction at all and nothing else
would surface it.

`.pf-record__action` becomes a two-chip row — needs `display: flex; gap;
flex-wrap: wrap`, and `min-height: var(--hit-min)` per chip is already on
`.pf-chip`. Two chips in the narrowest caption column (rung 5's `w: 14`) will
wrap; verify at 1100px and in the poster tier.

**The mockup's rotated `Repository ↗` chip is not adopted** — `-1.2°` /
`1.4°`, ADR-5. The existing `.pf-chip` is unrotated and stays so.

## 3.3 — In-place zoom-to-centre replaces `ImageExpandOverlay` (P3)

### The transform, computed from layout data — no DOM measurement

The mockup measures the DOM: `RECTS[k] = [x, y, w, h]` hardcoded against a
1440 × 900 canvas, then
`translate(720 - (x + w/2), 450 - (y + h/2)) scale(min(820/w, 780/h, 3))`.
That is un-portable — this stage is fluid and container-query-sized.

**But this codebase already has the same information in a better form.**
`fieldLayout.ts` stores every shape as `{cx, cy, d}` in percentages of the
stage, and the stage's aspect is the constant `STAGE_AR`. The whole
transform is therefore pure arithmetic on data we already hold — no
`getBoundingClientRect`, no `useLayoutEffect`, no rAF, no ref reads, and it
is unit-testable without a DOM.

Add to `fieldLayout.ts`:

```ts
/** How much of the stage a zoomed record fills, in percent. */
export const ZOOM_W = 74;
export const ZOOM_H = 82;
/** Guard for the small rungs — rung 5's smallest shape would otherwise
 *  scale 5.6x and resample the halftone plate to mush. */
export const ZOOM_MAX_SCALE = 3;

export interface ZoomTransform {
  /** translateX, in percent of the FIGURE's own width. */
  dx: number;
  /** translateY, in percent of the FIGURE's own height. */
  dy: number;
  scale: number;
}

/**
 * Move a shape's centre to the stage's centre and scale it to fill the
 * zoom box, in the figure element's OWN units.
 *
 * The unit conversion is the only subtle part. `translate()` percentages
 * resolve against the element's own border box, not its containing block.
 * The figure's width is `d`% of stage width and it is square, so its
 * height in percent of stage HEIGHT is `d * STAGE_AR` — the same
 * conversion `shapeBottom` already writes down.
 */
export function zoomToCenter(shape: FieldShape): ZoomTransform {
  const hPct = shape.d * STAGE_AR;      // figure height, % of stage height
  return {
    dx: ((50 - shape.cx) / shape.d) * 100,
    dy: ((50 - shape.cy) / hPct) * 100,
    scale: Math.min(ZOOM_W / shape.d, ZOOM_H / hPct, ZOOM_MAX_SCALE),
  };
}
```

Values for the live 3-record rung:

| Record | `d` | height %stage | `dx` | `dy` | `scale` | on-screen height |
|---|---|---|---|---|---|---|
| Barbershop (primary) | 43 | 69.7 | +47.2% | +12.2% | **1.177** | 82% of stage |
| AcopiaTech | 24.8 | 40.2 | −58.9% | +25.4% | **2.041** | 82% of stage |
| Odoo | 18 | 29.2 | −177.8% | +1.7% | **2.812** | 82% of stage |

**A property worth keeping:** `ZOOM_H / hPct` is the binding term for every
shape here (it beats `ZOOM_W / d` whenever `d < ZOOM_W · … `, true at every
rung), so **all three land at exactly the same on-screen size** — 82% of
stage height. Scale descends with the record's rank in the composition, but
the zoomed view does not, which is correct: the zoom is for reading a
screenshot, not for restating hierarchy. Assert it in
`fieldLayout.test.ts`.

### Where the transform is applied — cascade and `useReform`, both checked

**Applied to `.pf-record__figure`, composed with its existing transform.**
This element already carries `transform: translateY(-50%)` — verified in
`project-field.css`. **`cy` is a centre, not a top edge**, and that
`translateY(-50%)` is what makes it one. Overwriting the transform would
jump the figure down by half its height on open, and every `zoomToCenter`
value above assumes it is still there.

```css
.pf-record[data-zoom="self"] .pf-record__figure {
  transform:
    translate(var(--pf-zoom-dx), calc(-50% + var(--pf-zoom-dy)))
    scale(var(--pf-zoom-s));
  filter: none;
  z-index: var(--z-plate-interactive);
  transition: transform var(--dur-micro) var(--ease-hard);
}
```

**No `!important`. Verified, having first assumed otherwise.** The concern
was `cert-wall.css`'s documented `cert-rise` trap — a `@keyframes` animation
with `fill: both` holds its value at the **Animations cascade tier**, which
outranks a normal author declaration and an inline `style` attribute
regardless of specificity. It does not apply here: `.pf-record__figure`'s
entrance animation is `pf-wipe`, and **`pf-wipe` animates `clip-path` only**
(`inset(0 0 0 100%)` → `inset(0)`). It never touches `transform` or
`filter`, so both are plain author declarations and
`.pf-record[data-zoom="self"] .pf-record__figure` (0,2,1) simply outranks
`.pf-record__figure` (0,1,0) on specificity.

Two consequences worth stating, because the first draft of this section got
them wrong:

- **No `clip-path: none` reset is needed.** `pf-wipe` does hold
  `clip-path: inset(0)` permanently (`fill: both`), but `inset(0)` clips to
  the border box, i.e. clips nothing — and `clip-path` resolves in the
  element's local space *before* its `transform` applies, so scaling the
  figure scales the already-clipped result rather than pushing content out
  through a fixed clip. Harmless. Do not add a defensive reset.
- **`filter: none` IS needed**, and needs no `!important`. The four-layer
  1.5px drop-shadow edge scales with the transform; at 2.81× that hairline
  becomes a ~4px outline. The edge exists to separate near-white discs that
  overlap, and a zoomed disc sits alone over a scrim.

Because `!important` is unnecessary, the values may be set as **inline
custom properties** for convenience (`--pf-zoom-dx` etc. on the article)
*or* inline directly. Custom properties are still preferred — they keep the
transform's composition order written down once, in the stylesheet, next to
the `translateY(-50%)` it has to compose with.

**`useReform` was audited and is safe — by design, not by luck.**
`.pf-record__figure` carries `data-reform-id={figure-N}` and no
`data-reform-scale="none"`, so it *is* a FLIP target that writes `transform`
during a tier crossing. But `useReform.ts`'s header calls out this exact
situation and handles it:

> *"several of the parts it animates ALREADY use `transform` for their own
> layout — `.pf-record__figure` centres itself with `translateY(-50%)`. A
> naive FLIP writes over that and the element snaps to its untransformed
> position before it animates. So the inverse is composed ON TOP of whatever
> transform the part computes to in its new layout."*

It reads `getComputedStyle(el).transform` as `base` and animates
`translate(dx,dy) scale(sx,sy) ${base}` → `${base}`. While zoomed, `base`
*is* the zoom matrix, so a reform composes on top of it and releases back to
it. Nothing fights. `fill: "backwards"` means it holds nothing afterwards.

**Not applied to `.pf-shape`** — the inner element is transform-free and
tempting, but it sits inside the figure's `filter`, so scaling it magnifies
the edge from the wrong side and gains nothing.

`--dur-micro` / `--ease-hard` per doc 07's hard-cut default. If 90ms reads
as a jump-cut on a 2.8× move, the correct escalation is a **longer hard
duration**, never a soft curve — see §4.2, where the same argument is being
settled against this module's sibling.

### The zoom is a ≥900px feature. Below that, no expand chip is rendered.

`zoomToCenter` is arithmetic on stage-relative layout data, and **below
900px there is no stage composition to be relative to.** `project-field.css`'s
poster tier overrides `.pf-record__figure`'s `left` / `top` / `width` with
`!important` from `--pp-photo-*` custom properties — its own comment says the
inline geometry *"has to be beaten explicitly or the plate keeps its desktop
position and lands nowhere near the disc."* Every `cx` / `cy` / `d` the zoom
math depends on is void there.

**Decision: the expand affordance does not render in the poster tier.** Not
hidden by CSS — *not rendered*, because a `display: none` button is still in
the DOM and a `visibility`-hidden one can still be reached in some
configurations, and an affordance that computes a wrong transform is worse
than an absent one.

This costs nothing: in the poster tier each record already *is* a poster
with a full-width plate, which is what expanding was for.

`ProjectField` already computes `tier` via `useViewportTier` for
`useReform`. Thread it down as a `canZoom` boolean and gate both the chip in
`RecordAction` and the zoom state itself. **Confirm the exact tier value
name against `src/motion/viewportTier.ts` at implementation time** — this
document does not assume it.

### The caption while zoomed — and why `queueMicrotask` is load-bearing again

The zoomed figure fills 82% of stage height centred at 50%, i.e. y ≈ 9%–91%.
`.pf-record__cap` starts at `INDEX_TOP: 78%`. **They overlap.** The record's
own caption sits under its own zoomed disc.

```css
.pf-record[data-zoom="self"] .pf-record__cap { visibility: hidden; }
```

`visibility: hidden`, not `display: none`, deliberately: it preserves layout,
so the foot index does not reflow under the scrim while the zoom is open —
a reflow that would be visible at the edges of the scrim and would also
disturb the neighbouring records' columns.

Two things this must not break, both checked:

1. **`aria-labelledby` still resolves.** The dialog is labelled by
   `.pf-record__title`, which is inside the hidden caption. Accessible-name
   computation follows an explicit `aria-labelledby` reference even to an
   element that is not rendered — this is the one case where hidden text is
   still used for the name. Stated here explicitly because a reviewer will
   flag it otherwise.
2. **`.pf-zoom__close` must NOT live inside `.pf-record__cap`.** It is a
   direct child of the `<article>`, positioned in a stage corner. A close
   button inside a `visibility: hidden` subtree is not focusable, so focus
   on open would land on `<body>`.

**And this restores the original reason for the focus-return deferral.**
§3.3 above says the `queueMicrotask` wrap's original justification (the
trigger sat inside an `inert` `.pf__records`) is gone under per-record
inert. It comes back in a new form: `.pf-chip--expand`, the focus-return
target, lives inside `.pf-record__cap` and is therefore
`visibility: hidden` — and unfocusable — for exactly as long as the zoom is
open. React runs effect cleanups *before* the commit's effects, so at
cleanup time the caption is still hidden and `returnFocusTo.focus()` would
be a silent no-op landing focus on `<body>`. The microtask runs after the
whole commit, by which point `expanded` is `null`, the caption is visible
again, and the chip is focusable.

**So: keep `queueMicrotask`, and rewrite its comment rather than deleting
it.** Same failure mode as the original (silent, browser-only, invisible to
jsdom), different mechanism.

### Siblings: inert, dimmed, dropped back

The mockup does `n.style.zIndex = open ? '5' : BASE_Z[k]`. Ours:

```tsx
// ProjectField.tsx
const zoomState = (p: Project) =>
  expanded === null ? "none" : expanded.project === p ? "self" : "other";
```

`.pf-record[data-zoom="other"]` → `inert` attribute, reduced z-index, and a
`pointer-events: none` that is already there.

**`useInert(recordsRef, …)` must go.** It marks `.pf__records` — the
container of *every* record, including the one being shown. You cannot inert
the container of the thing you are displaying. Replace with **per-record
inert**: the `inert` prop on each non-expanded `<article>`. React 19 supports
`inert` natively. This is a real semantic change, not a refactor, and it is
the piece most likely to regress silently — jsdom does not implement `inert`
at all, so component tests cannot catch it. It is verified in a real browser
by reading `document.activeElement` and by Tab-walking, exactly as the
`ImageExpandOverlay` focus-return bug originally was.

### Accessibility — every contract from `ImageExpandOverlay`, preserved

**`role="dialog"` goes on the expanded `<article className="pf-record">`.**

The discriminating question is: *which element's subtree contains both the
image and its accessible name?* Answer: the record's article. It already
holds `<img alt={project.imageAlt}>`, `<h3 className="pf-record__title">`,
the caption, and the status line. Putting `role="dialog"`
`aria-labelledby={titleId}` on it produces a dialog whose subtree actually
contains its subject, labelled by real existing markup.

An `aria-expanded` disclosure model was considered and **rejected**:
`aria-expanded="true"` promises new content, and nothing new enters the
accessibility tree here except a Close button — the image and its `alt` were
already present. The announcement would have no payload.

`aria-modal` is **still omitted**, for the reason `ImageExpandOverlay`'s
header already gives: `PageLayer` wraps the routed page in
`aria-modal="true"` and nesting a second one is ambiguous. Modal-ness comes
from inert siblings, as it always has.

| Contract | Old (`ImageExpandOverlay`) | New (in-place zoom) |
|---|---|---|
| Dialog role | on the overlay div | on the expanded `<article>` |
| Accessible name | `useId` heading in the overlay | `aria-labelledby` → the existing `.pf-record__title` |
| Modal-ness | `useInert` on `.pf__records` | `inert` on every non-expanded article |
| Focus on open | `closeRef.current?.focus()` | identical — a `.pf-zoom__close` button rendered inside the expanded article |
| Focus return | `queueMicrotask(() => returnFocusTo?.focus())` in cleanup | **ported verbatim** |
| Dismiss | capture-phase `keydown`, Escape + ArrowRight, `preventDefault` + `stopPropagation` | **ported verbatim** |
| Scrim | `.pf-overlay__scrim`, click closes, `aria-hidden` | `.pf-zoom__scrim`, same |
| Image | a **second** `<img>` with duplicate `alt` | the record's own `<img>` — no duplicate |

**Keep the `queueMicrotask` deferral — its reason changes but does not
weaken.** Its original justification was that the trigger sat inside the
`inert` `.pf__records`; under per-record inert the trigger lives in the
*expanded* record, which was never inert, so that specific failure is gone.
It is replaced by an exactly equivalent one: the trigger lives inside
`.pf-record__cap`, which is `visibility: hidden` while zoomed. See "The
caption while zoomed" below for the full mechanism. Rewrite the comment;
do not delete the wrap.

**Port the dismiss handler verbatim, not from memory.** Its capture-phase
listener with `stopPropagation()` is what wins against `useTurnKeyboard`'s
bubble-phase Escape/ArrowRight — without it, Escape closes the whole page out
from under the zoom. Lift it into a `useZoomDismiss` hook or keep it inline;
do not re-derive it.

### Sequencing — `ImageExpandOverlay` is deleted last, in its own commit

The proposal's own mitigation says *"test parity before deleting it."*
Concretely:

1. Build the zoom. Wire Odoo first — the node whose only affordance the
   overlay is.
2. Verify a11y parity in a real browser: focus lands on Close, Tab is trapped
   to the expanded record, Escape and ArrowRight both close, focus returns to
   the trigger (read `document.activeElement`), sibling records are
   unreachable by Tab.
3. **Then** delete `ImageExpandOverlay.tsx`, `.pf-overlay*` CSS, and the
   `useInert` import — separate commit, independently revertable.

`ImageExpandOverlay.tsx` stays in git history and is restorable if step 2
fails.

## 3.4 — Projects: rejected and deferred

| Mockup element | Verdict |
|---|---|
| `flagship` / `mobile` / `module` Permanent-Marker badges | **Rejected**, twice over: `--font-hand` is Expressive vocabulary (ADR-4), and `-3°` / `-2.6°` / `+2.6°` exceed the ±2° Sheet cap (ADR-5). No cap exception is available. |
| Halftone dot circles | **Rejected** (ADR-4). |
| Rotated `Repository ↗` chip | **Rejected** (ADR-5). |
| Newsprint texture + `#efece1` ground | **Rejected** (ADR-4). |
| Two olive backdrop panels behind the nodes | **Already shipped** as `.pf__band`, and better — one continuous band, which is the traced `image_01` composition. The mockup splits it in two; adopting that would undo the 2026-08-13 redesign. |
| `records / field / span` meta stack | **Already shipped** as `.pf__meta`. |
| `Projects` 96px display heading | **Already shipped** as `.pf__title`. |
| `esc / click anywhere to close` scrim caption | **Optional.** The existing overlay says the same in a `visually-hidden` span on the Close button. A visible hint is a small fidelity win; if adopted it is `aria-hidden` (it duplicates the button's own text). |
| `panel 4b · click ⤢ to expand · esc to close` footer | **Rejected.** Invented chrome. |
| `image-slot shape="circle"` per node | Not portable (canvas runtime). The real `<img>` + `clip-path: circle(closest-side)` already does this. |

---

# §4 — DOCS RECONCILIATION

Actual replacement text, not intentions.

## 4.1 — `docs/01_ART_DIRECTION.MD`

**(a) The register table, Record row.** Amend the *Decorative vocabulary*
cell:

> | **Record** | `/certifications` | LT Remark titles + Mono meta | Faint blueprint-grid paper, hairline corner registration marks, the vertical "Certificate archive" ghost title, **hand-cut `clip-path` tile edges (a 2–12px irregular cut, constant at every tile size)**, strictly grid-aligned mats (no rotation — see below) |

**(b) A new subsection, immediately after "The Record register does not
rotate":**

> ## Hand-cut edges are how Record expresses the hand
>
> *Added 2026-09-04, `sdd/design-import-sections`.*
>
> The section above bans rotation on this register and gives the reason: an
> archivist's wall reads as authoritative because it is square to the page.
> That leaves Record with no way to say *handmade* at all — every other
> surface says it with a tilt.
>
> It says it with the **cut** instead. Each tile's outline is a
> `clip-path: polygon()` whose four corners sit a few pixels off true, as
> though the mat were trimmed by hand rather than die-cut. The tile stays
> axis-aligned — its bounding box is still square to the grid, still
> occlusion-safe, still hit-testable at its centre — and the irregularity
> lives entirely in the outline.
>
> Two rules make this a register trait rather than a one-off effect:
>
> 1. **The cut depth is an absolute length, never a percentage.** A hand
>    wanders by millimetres, not by a fraction of the sheet. A fixed `4px`
>    nick reads as the same tool on a large tile and a small one; `1%` reads
>    as two different tools. It also means the shape is identical at every
>    breakpoint, so no `@media` rule ever overrides a `clip-path`.
> 2. **The cut is on a fill layer, never on the interactive element.**
>    `clip-path` clips the focus ring along with everything else. The host
>    element keeps its rectangle — and its `outline` — while a
>    `position: absolute; inset: 0; z-index: -1` pseudo-element carries the
>    background and the clip. The ink edge and the plate shadow are a
>    `filter: drop-shadow()` chain on the *unclipped* host, which traces the
>    clipped child's silhouette; a `border` or `box-shadow` on the clipped
>    layer is drawn on its rectangle and clipped away.
>    `project-field.css`'s `.pf-record__figure` is the reference
>    implementation.
>
> **Contact (Instrument) uses the same mechanism**, on its channel plates,
> for the same reason — it does not rotate either. The vocabulary is shared;
> what stays register-specific is everything else on the tile.

**(c) The Instrument row** gains the mechanism too:

> | **Instrument** | `/contact` | JetBrains Mono only — no serif display | Ink connector "wires" tucked behind plates, the mechanical proximity dock (≤1.1 scale), an illustrated figure bleeding off the bottom edge, **hand-cut `clip-path` plate edges (see "Hand-cut edges", below)** |

## 4.2 — `docs/09_IMPLEMENTATION_ROADMAP.md`, Phase 3.5

Replace the 2026-09-02 parenthetical's three bullets (currently lines 74–79)
and the closing note (lines 81–83) with:

> _(Updated 2026-09-04, `sdd/design-import-sections`. The three deviations
> below are now **resolved by reconciliation rather than by blind revert** —
> the Claude Design import of 2026-09-04 rebuilds the Record register's tile
> surface, which changes what two of the three deviations even mean.)_
>
> - _**`border-radius: 8px` — partly moot, partly still a revert.** The
>   landscape wall's mats no longer have corners to round: under the hand-cut
>   `clip-path` tiles (`01_ART_DIRECTION.MD`, "Hand-cut edges") the polygon
>   **is** the corner treatment, and `border-radius` on the host has nothing
>   to act on. The `--cw-radius` allowlist loses two of its three entries in
>   the same change — `.cert-mat` (superseded by the clip) and
>   `.cert-pager__dot-glyph` (the dot pager is replaced by square "01"/"02"
>   number tabs). **Still open, unchanged, and still a straight revert to
>   `0`:** `[data-sheet="portrait"] .cert-mat__scan` and `CertLedger`'s
>   `.cert-row__scan`. The portrait ladder and the ledger are out of scope
>   for the import (the mockup is landscape-only), so they keep their 8px
>   until someone reverts it deliberately._
> - _**`320ms` `ease-soft` tile hover → `--dur-micro` / `--ease-hard`.
>   Unchanged; execute as written.** Worth recording that the 2026-09-04
>   mockup asks for the opposite — its card transition is
>   `.32s cubic-bezier(.2,.85,.2,1)`, i.e. exactly the soft cut currently
>   shipped. **It was overruled.** Doc 07's 2026-09-02 withdrawal
>   ("Mechanical hard-cut motion is spine, not a per-surface choice … that
>   exception is withdrawn") is a later-dated correction to a project
>   specification; a design mockup is not one, and the conflict order puts
>   Project Vision above Implementation. The hover keeps its lift and its
>   shadow deepen — only the duration and curve change._
> - _**zero rotation → kept**, now a defined Record-register trait, no
>   change. The import rotates all thirty-plus of its elements; every one of
>   them ships at `0deg`. The checklist is in
>   `docs/design-exploration/design-import-2026-09-04/HANDOFF.md` §2.4._
>
> _No longer CSS-only: the import also replaces the dot pager with numbered
> tabs, adds arrow-key sheet paging (which `/certifications` does not have
> today), and rebuilds `/contact` and `/projects`. Verify with
> `pnpm run audit:collage`, `pnpm e2e`, and a browser pass at desktop /
> tablet-portrait / 390px._

## 4.3 — `docs/07_ANIMATION_GUIDELINES.md`

The 2026-09-02 note ends *"until it lands, `cert-wall.css` is the one known
deviation."* When the change lands, replace that clause with:

> *Landed 2026-09-04 in `sdd/design-import-sections`. `cert-wall.css` no
> longer deviates. Recorded because the design import of the same date asked
> for the soft cut again and was overruled — see
> `09_IMPLEMENTATION_ROADMAP.md` Phase 3.5.*

This edit is made **when apply lands the CSS**, not before — the sentence
would otherwise be false in the interim.

## 4.4 — Uncommitted 2026-09-02 edits

`01_ART_DIRECTION.MD`, `09_IMPLEMENTATION_ROADMAP.md`, `07_ANIMATION_GUIDELINES.md`
and `12_COLLAGE_SYSTEM.md` all carry uncommitted working-tree changes.
**Amend in place; review the diff before committing.** All four edits above
are insertions and targeted replacements, not rewrites.

`12_COLLAGE_SYSTEM.md` needs **no change** — its 2026-09-02 zero-rotation
note is already correct and this change reaffirms it.

---

# §5 — VERIFICATION

Beyond `pnpm typecheck && pnpm lint && pnpm test && pnpm build`:

| Check | Why it is on this list |
|---|---|
| `pnpm run audit:collage` at 1440/1280/1100/390 | `clip-path` clips pointer events. Confirms centre-point hit-tests and ≥24×24 targets survive on both modules. |
| `rg 'rotate\(' src/components/cert-wall/` returns nothing | D1's acceptance criterion, §2.4. |
| Focus ring visible and **unclipped** on `a.cf-card:focus-visible` and `.cert-mat__trigger:focus-visible`, in a real browser | The single highest-risk item in the change (ADR-3, Constraint A). Not catchable by jsdom. |
| `filter: drop-shadow()` on the host traces the `::before` alpha, in a real browser | ADR-3's flagged unknown. Fallback is a real child span. |
| Minimum Oxblood → Field Olive gap, re-measured at all seven widths | The 2026-08-20 spec: *"the single constraint in this module that a future layout tweak could break silently, and no contrast tool will catch it."* |
| `OPEN TO WORK` present in the a11y tree at 1440 and 390, exactly **once** | §1.4. The "once" is new — it is the assertion that guards against a second badge being added later. |
| Every channel plate's accessible name starts with the channel name | *"this one has already regressed once."* |
| Zoom: focus → Close, Tab confined to the expanded record, Escape **and** ArrowRight close, focus returns to the trigger — read `document.activeElement` in Chromium | jsdom does not implement `inert`. This class of bug has already shipped once here. |
| **Odoo expands** after `ImageExpandOverlay` is deleted | The proposal's explicit success criterion. |
| All three zoomed records land at the same on-screen height | Unit test on `zoomToCenter` in `fieldLayout.test.ts`. |
| No expand chip in the DOM below 900px | §3.3. The zoom math is void in the poster tier; a chip that computes a wrong transform is worse than an absent one. |
| Dialog's accessible name resolves through the hidden caption | §3.3. `aria-labelledby` → `.pf-record__title` inside a `visibility: hidden` subtree. Read the real accessibility tree, not the DOM. |
| `pnpm e2e`, especially `e2e/viewport-overflow.spec.ts` | Three routes change; that spec already contrasts `/projects` against `/certifications`. |

---

# §6 — OPEN RISKS

1. **`filter` on the host tracing a pseudo-element's alpha (ADR-3).** The
   pattern is proven with a real child (`.pf-shape`); the pseudo-element form
   is not yet exercised in this repo. Fallback is one extra span per card and
   changes nothing else here.
2. ~~`!important` on the zoom transform vs. `useReform`.~~ **Closed during
   design.** `useReform.ts` and `pf-wipe` were both read: `pf-wipe` animates
   `clip-path` only, so no Animations-tier hold exists on `transform` and no
   `!important` is needed; `useReform` composes onto the computed transform
   by explicit design (its own header documents this exact case) and cannot
   fight the zoom. See §3.3.
3. **Per-record `inert` replacing `useInert` (§3.3).** The most likely silent
   regression in the change, and untestable in jsdom.
   **Sibling risk, same class:** `.pf-record__cap` going `visibility: hidden`
   while zoomed makes the focus-return target unfocusable until the closing
   commit lands. Both failures are silent, browser-only, and land focus on
   `<body>`.
4. **Contact's c4 midpoint drifts ~51% → ~60% (§1.1).** Accepted with a named
   fallback (narrow c6). Needs a human look, not a measurement.
5. **Cert arrow-key paging is new work** (§2.3), against D3's stated premise
   that it already exists. Must be budgeted in tasks.
6. **Two chips per caption column (§3.2)** may wrap badly in rung 5's 14%
   column and in the poster tier.
7. **This is one handoff doc where the proposal says three.** Noted at the
   top; flagged so verify does not read it as a missing artifact.
