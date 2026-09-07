# CONTACT — THE CHANNEL FIELD (2026-08-20)

Developer handoff for the `/contact` module. **Wired 2026-08-20**, replacing
the Phase 2 placeholder (`src/routes/ContactPage.tsx` had been rendering a
`Panel` reading *"Contact terminal placeholder — content ships in Phase 3."*).
See §Implementation at the foot of this document for what actually shipped
and the three things the build surfaced that the proof could not.

Reference: Keff's poster study — a red field carrying a sliced monochrome
head under a rhythm of unequal vertical strips. Colour palette and
typeface of the reference are explicitly **not** adopted; the structure is.

Proof: `docs/contact.design-proof-v2.html`. Every number in this document
is measured off that file, not estimated.

> **v2 (same day, Keff's review).** v1 read as too crowded and sat at a
> heavier visual weight than every other section, because it flooded a
> full-bleed Field Olive field behind the whole module. Five changes, all
> Keff's calls:
>
> 1. **The olive field is gone.** Paper is the ground again — doc 02's base
>    direction — and the olive moved **onto the plates**. The module now
>    carries the same weight as the rest of the site instead of announcing
>    itself with a background.
> 2. **Block count roughly halved**, 16 placed elements → 8. Every stub,
>    the dot-grid texture block, the scan strips and the chrome spine are
>    gone. One connector became two hairlines.
> 3. **The `(0n)` index markers are gone** from the plates. This drops the
>    brief's "corner indices" requirement; it is a deliberate trade for
>    quiet, not an oversight.
> 4. **The status line** (*"Five open · no form, no funnel"*) is gone. The
>    module wheel already prints the lede on the way in.
> 5. **The figure is a high-contrast editorial monochrome**, per Keff's
>    second reference (a fashion-cover study: cream stock, big B&W
>    portrait, one small tinted tag over the eyes). That treatment is what
>    lets Oxblood into the composition as a single marker.
>
> Sections below describe v2. Where a v1 decision was reversed it is
> marked, because the reasoning still explains why the constraint exists.

---

## What was rejected first

Two AI-generated files (`gemini-code-*.html` / `.css`) were reviewed and
dropped rather than adapted. Recorded here so the decision is on the file
rather than repeated later:

| Brief requirement | Draft's state |
|---|---|
| Columns of **unequal** width | `repeat(5, minmax(70px, 1fr))` — all equal |
| Cross-column connectors | absent entirely |
| Sliced background masking | absent entirely |
| Texture alternation | absent entirely |
| Floating accents outside the column bounds | absent entirely |
| Aspect ratios 1:1 / 1:3–1:4 / 2:1 | fixed `min-height` in px, no ratios |

It also had no `background` or `border` on any card (so nothing rendered),
`.card-fill` as an empty unstyled div, hardcoded `12px`/`0.75rem` literals
against `tokens.css`'s standing "never hardcode these values anywhere
else", `transform: rotate(180deg)` on text nodes where this system uses
`writing-mode` on real text, no `:focus-visible` styling at all, and a
2-column mobile fallback whose children were column *wrappers* — which
makes reading order run down-then-across, inverting DOM order.

That last one is the instructive failure. **In the spec below the grid's
children are individual cards, never column wrappers**, so auto-flow fills
across-then-down and visual order equals DOM order for free.

---

## Overview

Five channels, presented as a printed sheet rather than a list. The user
arrives from the module wheel having read *"GitHub, LinkedIn, email. No
form, no funnel."* (`ROUTES[].lede`) and the page must deliver exactly
that: addresses, no form.

Composition roles in play (doc 12 §Composition roles): **Channel row**
(promoted here from a joined icon strip to the whole composition),
**Plate**, **Chrome**, **Type field**. No Hero, no Annotation, and after
v2 no **Bar** either — the status moved onto the marker.

---

## Layout

### The field

`.cf` has **no background**. Paper is the page and the plates are the only
colour in the composition. The padding is the margin the two floating
accents occupy, outside the column bounds.

| Property | Value |
|---|---|
| max-width | `1240px` |
| padding | `var(--space-md) var(--space-lg) var(--space-lg)` |
| background | *(none — the page's `--paper` shows through)* |
| `isolation` | `isolate` — keeps stacking inside the module |
| `overflow` | `hidden` — the figure bleeds off the bottom |

*(v1 filled this element with `--field-olive`. That is the change this
revision is mostly about.)*

### The stage

`.cf__stage` is a 6 × 12 grid at `aspect-ratio: 1.5`. **Six unequal
tracks.** The ratios are the composition, not a container choice.

| Track | `fr` | % of stage | Channel | Block aspect at 1440 |
|---|---|---|---|---|
| c1 | `1.20` | 20.94% | **Email** | block 1:1.37 |
| c2 | `0.62` | 10.87% | **GitHub** | banner **1:4.28** |
| c3 | `1.45` | 25.35% | **LinkedIn** | block 1:1.13 |
| c4 | `0.50` | 8.75% | — *(open; the figure breathes here)* | — |
| c5 | `1.10` | 19.26% | **WhatsApp** | block 1:1.49 |
| c6 | `0.85` | 14.84% | **Instagram** | banner **1:3.13** |

Gap `var(--space-sm)`. At 1440 the stage is 1192 × 795, each row 55px.

c4 carries nothing at all in v2 — in v1 it held a chrome spine. Leaving a
narrow track empty next to the figure is the density relaxation doc 12
already granted Home on 2026-08-03: *generous negative space next to a bold
image is closer to the poster reference than a fully packed grid.*

**Vertical rhythm comes from grid rows, not `translateY`.** The draft
staggered whole columns with transforms; that creates a stacking context
per column and makes a cross-column connector impossible to layer. Here
each block simply starts on a different row, which is doc 12's rule ("if a
plate needs to move, it moves by a grid cell") and leaves z-index free to
mean what it means.

### Placement — one block, in composition order

```css
.a-gh-card  {grid-area:1 / 2 / 9 / 3;}   /* GitHub banner                 */
.a-ig-card  {grid-area:2 / 6 / 10 / 7;}  /* Instagram banner              */
.a-email-cd {grid-area:3 / 1 / 8 / 2;}
.a-wa-card  {grid-area:4 / 5 / 9 / 6;}
.a-li-card  {grid-area:7 / 3 / 12 / 4;}
.a-conn-a   {grid-area:8 / 1 / 9 / 3;}   /* hairline, c1 → behind c2      */
.a-conn-b   {grid-area:9 / 4 / 10 / 7;}  /* bar, c4–c5 → behind c6        */
```

Keep this list in one block, in composition order, so the layout reads as
a whole (doc 12 §Implementation notes).

### Cross-column connectors

Two bars at `--z-plate-decor + 4` — **below** the plates. Each is placed so
one end sits in an open track and the other runs under a plate, so it
appears to pass *behind* one strip and emerge in the next. That tuck is the
whole effect; a bar floating in open paper reads as debris, which is
exactly what both did before they were repositioned.

| | Span | Tucks behind | Fill | Height |
|---|---|---|---|---|
| `conn-a` | c1 → c2 | GitHub | `--ink` | `--rule-thick` |
| `conn-b` | c4 → c6 | Instagram | `--ink` | `--space-xs` |

Because they sit under opaque plates they obscure nothing, satisfying doc
12's guardrail 1 without needing an exception.

*(v1 made `conn-b` Scan Stock. On the olive ground that read; on Paper it
is **1.11:1** — invisible except where it happened to cross the
photograph, which was accident rather than design. Both are Ink now,
14.83:1.)*

---

## The Oxblood marker

The composition's single accent, and the whole reason the figure changed:
against a high-contrast monochrome portrait, one small Oxblood tag over the
eyes is legible and deliberate. Against v1's screenprint on olive there was
nowhere to put it.

| Property | Value |
|---|---|
| position | `left: 49%; top: 12%; width: 10.5%` **of the figure's box** |
| box | `aspect-ratio: 1.25`, `--oxblood`, `1px --paper-white` outline |
| label | `--oxblood` fill, `--paper-white` text, `--text-micro`, `--track-label` |

**The label carries its own Oxblood ground rather than printing onto the
photograph.** The tone directly under it is the jaw and collar — mid-grey
in one crop, near-white in another — and no single text colour is safe on
both. On its own fill it is a fixed 12.92:1.

**Solid, not `mix-blend-mode: multiply`.** The reference's tag is a light
red tint that lets the eyes read through. Oxblood is dark enough
(`#4a1f1a`) that multiplying it over a mid-tone crushes box and label
together. Solid is the honest translation of the *idea* at this palette.

### The one adjacency that must never happen

`tokens.css` states it outright: **`--oxblood` on `--field-olive` is
1.90:1 — accent and plate must never touch.** This composition puts an
Oxblood element and five Field Olive plates on the same stage, so the rule
is asserted geometrically rather than by eye:

| Width | Minimum Oxblood → Olive gap |
|---|---|
| 1440 / 1280 / 1100 | 109.6 / 108.2 / 84.5 px |
| 900 / 640 / 390 / 320 | 20 px |

Ship this check as a test. It is the single constraint in this module that
a future layout tweak could break silently, and no contrast tool will catch
it — both colours pass against everything they are *supposed* to touch.

---

## The figure

A wrapper positioned once, with the image as a child.

| | Value |
|---|---|
| box | `aspect-ratio: 1; height: 104%; left: 50%; bottom: -6%` |
| z-index | `--z-plate-decor` |
| image | `background-size: contain; background-position: center bottom` |

**The box is square because the source is square.** At `aspect-ratio: 1`
the `contain` paint fills the element exactly, so the marker can be placed
in percentages of this box and land on the glasses at every width. Give the
box any other ratio and the letterboxing shifts the image inside it and the
marker drifts off the face — with no pixel coordinate anywhere to blame.

Measured off the source, the glasses sit at x 45.3–60.5%, y 14.4–18.6%.

### The accessibility trap in this structure

`aria-hidden` cannot be un-set by a descendant. Putting it on the wrapper —
the obvious thing, since the figure is decoration — silently deleted the
marker's `OPEN TO WORK` label from the accessibility tree at **every**
width, and it is the only place this page states the status.

So the wrapper stays in the tree and `aria-hidden` goes on
`.cf__figure-img`, the child that is actually decorative. Verified in the
real accessibility tree at 1440 and 390: `StaticText "OPEN TO WORK"` is
present at both.

### The asset

`src/assets/plates/portrait/hero.png`, 1024 × 1024, transparent
background, converted to high-contrast monochrome: desaturate on luminance,
lift the toe ~6% so the denim does not crush to one black mass, then a
1.62× contrast expansion about the mid and a smoothstep S-curve.

**This is a documented deviation from doc 13.** Every preset in that file
dithers, and `image-rendering: pixelated` protects the dot grid. Neither
applies here: the reference is a photographic cover, not a screenprint, and
dithering fights the quiet this revision is for. `image-rendering` stays
`auto` at every tier.

*(v1 used a two-value Paper-White/Ink screenprint of `seated-cut.png`. That
existed to solve a problem v2 does not have — an Ink halftone on the olive
ground was 2.57:1 and vanished. On Paper the ordinary monochrome is
14.83:1 at its darkest and needs no trick.)*

## Design tokens used

Every value below is `src/styles/tokens.css`. Nothing new is introduced.

| Token | Value | Usage here |
|---|---|---|
| `--paper` | `#e4e4e2` | the ground (inherited from the page, not set here) |
| `--field-olive` | `#4f5a3c` | **every channel plate** |
| `--paper-white` | `#f6f6f4` | all type and glyphs on the plates; the marker's outline and label |
| `--ink` | `#111111` | the title, both connectors, the focus ring |
| `--gray` | `#635d54` | the two floating accents — **on Paper only** |
| `--oxblood` | `#4a1f1a` | the marker, and nothing else |
| `--font-mono` | JetBrains Mono | everything — no serif on this module |
| `--text-body` / `--text-micro` | `.875rem` / `.5625rem` | plate name / meta, label, accents |
| `--text-display-md` | `clamp(1.125rem,1.5vw,1.4rem)` | the `CHANNELS` heading |
| `--track-label` / `--track-micro` | `.22em` / `.42em` | labels / accents |
| `--space-2xs … --space-2xl` | 4 → 48px | every gap, pad and offset |
| `--on-olive-dim` | `.78` | plate meta text |
| `--rule-hair` / `--rule-thick` | `1px` / `2px` | marker outline / hairline connector |
| `--plate-shadow` | — | the plates |
| `--dur-micro` `90ms`, `--ease-hard` | — | hover lift |
| `--z-plate-decor / -content / -interactive` | 1 / 10 / 20 | the three bands |

Dropped in v2 and no longer used by this module: `--scan-stock`,
`--warning-yellow`, `--ink-inverse`, `--olive-edge`, `--on-olive-chrome`,
`--plate-shadow-sm`.

### Contrast — computed, not assumed

All pairs used, measured:

| Pair | Ratio | Verdict |
|---|---|---|
| Field Olive plate on Paper | **5.77:1** | the plate edge is its own boundary — no border needed |
| Paper White on Field Olive | **6.79:1** | AA any size — plate names, glyphs |
| Paper White @ `--on-olive-dim` (.78) | **4.89:1** | AA any size — plate meta |
| Ink on Paper | **14.83:1** | AA — title, connectors, focus ring |
| Gray on Paper | **5.12:1** | AA — floating accents |
| Oxblood on Paper | **10.98:1** | the marker's own boundary |
| Paper White on Oxblood | **12.92:1** | AA any size — the marker label |

**Three bans, and they shape the design.** All three are pairs *against the
plate fill*, which is the surface that changed in v2:

- **Oxblood on Field Olive is 1.90:1** — the geometric check above exists
  for this one.
- **Ink on Field Olive is 2.57:1.** No Ink type or glyph may sit on a
  plate. Both connectors are Ink and both pass *behind* the plates rather
  than onto them.
- **Gray on Field Olive is 1.13:1.** All `--gray` is on Paper. Plate meta
  is dimmed Paper White instead, never Gray.

### One contrast bug worth keeping on file

v1's LinkedIn plate carried a dot texture as a `background-image` across
the whole card. Gray meta text then sat on paper-white-plus-ink-dots and
was unreadable — while `getComputedStyle` still reported `#635d54` on
`#f6f6f4`, i.e. **6.02:1, passing**. A computed-style audit cannot see
this.

The texture is gone in v2, so the bug is gone with it, but the rule it
produced stands for the whole system: **texture is a block, not a
background.** Give it its own element and overlap with type becomes
structurally impossible rather than merely avoided.

---

## Components

| Component | Variant | Props / data | Notes |
|---|---|---|---|
| `ChannelField` | — | `channels`, `plate`, `availability`, `coordinates?` | owns the stage; no layout logic |
| `ChannelPlate` | `--block` | `PlacedChannel` | horizontal type. `primary`, `feature`, `aside` |
| `ChannelPlate` | `--banner` | `PlacedChannel` | `writing-mode: vertical-rl` on real text. `rail-a`, `rail-b` |
| `ChannelPlate` | `--pending` | `PlacedChannel` | a `div`, not an `a` — see §Implementation |
| `ChannelGlyph` | — | `label` | falls back to a two-letter monogram |

Slot assignment is `channelLayout.ts` — pure and separately tested, the
sibling of `project-field/fieldLayout.ts`. Grid coordinates are
`channel-field.css`. Neither lives in the component.

The five slots are named, not numbered: `primary`, `rail-a`, `feature`,
`aside`, `rail-b`. A number would imply they are a sequence; they are five
different shapes, and handing a channel the wrong one does not misalign the
sheet, it makes the label unreadable.

### Data

Drive from `SOCIAL_LINKS` in `src/content/data.ts` — the same reason
`Skill.core` and `RouteConfig.lede` live in data: a hand-written array in
the component drifts the first time a channel changes, and nothing catches
it. `SocialLink` needs three fields added:

```ts
export interface SocialLink {
  label: string;
  href: string;
  /** The short line under the name. "Network · profile", "Direct chat". */
  meta: string;
  /** The visible handle/address. Distinct from href: "@OverNuke" is not
      "https://github.com/OverNuke". */
  handle: string;
}
```

v1 also asked for an `index` field to print `(01)`…`(05)`. **Do not add
it** — those markers were removed in v2.

**Plate DOM order is name → handle → meta → glyph, and that order is the
contract.** The banner variant originally put the handle first, because
`justify-content: space-between` centres the middle child and the name
looked better centred. The accessible name then read *"@OVERNUKE
GITHUB"*. The channel name must lead; the name sits at the top of the
banner instead, which is the fix at the source rather than an `aria-label`
papering over it.

### ⚠ Ship blockers

`SOCIAL_LINKS` currently holds **three** channels. Two are unresolved:

| | Status |
|---|---|
| Email `ksfgarcia24@gmail.com` | real |
| GitHub `github.com/OverNuke` | real |
| LinkedIn `/in/keffwontwakeup` | real |
| **Instagram** | `https://instagram.com/PLACEHOLDER` — **handle needed** |
| **WhatsApp** | `https://wa.me/PLACEHOLDER` — **number needed** |

A `wa.me` link publishes a personal phone number on a public page, in the
markup, permanently and scrapeably. That is a different disclosure from an
email address and worth a deliberate yes rather than an assumed one. If the
answer is no, the composition works at four channels by giving c5 to a
second data column; it does not need five.

### ⚠ Two icon findings

`SocialIcon.tsx` inlines Feather glyphs at 2px stroke with `square` caps
and `miter` joins, and its own header explains why the envelope was
redrawn: Feather's has corner arcs baked into the path data, `border-radius: 0`
is a CSS rule that cannot reach inside an SVG path, and neither can this
project's radius audit.

**Instagram hits exactly that problem, and worse.** Feather's `instagram`
is `<rect rx="5" ry="5">` — the same baked radius. But unlike the envelope,
*the rounded square is the brand mark*. Squaring it damages brand identity;
leaving it round puts the most visible corner radius on the site inside the
one component that exists to demonstrate there are none. The proof squares
it, on the grounds that the glyph is `aria-hidden` decoration beside a
visible "Instagram" label doing the identifying work — but this is Keff's
call to make, not a detail to settle silently.

**WhatsApp has no Feather glyph at all.** The proof uses the simple-icons
path (`@icons-pack/react-simple-icons` is already a dependency for
`Skill.icon`). It is a **filled** mark, not a 2px stroke, so it reads
heavier than its four neighbours. Options: accept the weight difference,
redraw as a stroke, or drop WhatsApp.

---

## States and interactions

| Element | State | Behaviour |
|---|---|---|
| `.cf-card` | default | Field Olive fill, no border, `--plate-shadow`, `z: 20` |
| | hover | `translateY(-3px)`, shadow → `5px 7px 18px rgba(17,17,17,.30)`, `z: 30` |
| | focus-visible | `2px solid var(--ink)` outline, `3px` offset, plus the hover lift |
| | active | `translateY(0)` — the plate presses back onto the sheet |
| `.cf-card` external | — | `target="_blank"` + `rel="noopener noreferrer"` |
| `.cf__conn`, `.cf__accent`, `.cf__figure` | all | inert; `pointer-events: none` |

The focus ring is `--cf-focus`, declared on `.cf` and set **per surface**,
never hardcoded on the plate — the `CertParts.tsx` convention. In v1 it was
Paper White because the ring was drawn on an olive ground; **in v2 it is
Ink**, because the ground is Paper (14.83:1). This is exactly the class of
value that goes stale when a surface changes, which is why it is a variable
on the container and not a literal on the component.

Raising `z-index` on hover is the affordance, not decoration: on an
overlapping composition the plate coming to the top of the stack *is* the
feedback, which is why the shadow deepens with it (doc 12 guardrail 2).

---

## Responsive behaviour

Doc 12 §Shed order: as the field narrows, overlap becomes occlusion, so the
composition **sheds in a fixed priority** rather than compressing. Nothing
carrying unique content is ever shed.

| Tier | Width | Layout | Shed |
|---|---|---|---|
| 1 · the field | ≥1181px | 6 × 12 grid, `--cf-ar: 1.5` | — |
| 2 · compressed | 901–1180px | same grid, `--cf-ar: 1.34` | the coordinate accent |
| 3 · the pair | 641–900px | 2 unequal tracks, `aspect-ratio: auto` | both connectors, the serial accent; figure → 230px banner, marker → caption beneath it; all vertical type → horizontal |
| 4 · the column | ≤640px | 1 track | figure → 190px banner |

**Never shed:** the five channel plates, and the marker's `OPEN TO WORK`
label. That label is the only place on this page the status appears, so by
doc 12's rule it is real content — normal DOM order, never `aria-hidden`,
never shed.

At tier 3 the marker cannot stay on the face: the figure's box is no longer
square, so the percentage that put the box on the glasses no longer maps
there. It becomes a caption directly under the banner — a small Oxblood
square beside its label. **It is not `display: none`.** Hiding it was the
first thing tried and it is wrong for the same reason: unique content.

### Two release rules that will bite whoever skips them

**Release `grid-template-rows`, not just the columns.** The base rule sets
`repeat(12, 1fr)`. Overriding only `grid-template-columns` at tier 3 leaves
the twelve explicit rows in place, they survive `grid-area: auto`
placement, and twelve empty tracks trail below the last card. Set
`grid-template-rows: none`.

**Put the height floor on the plates, not the tracks.** `grid-auto-rows:
minmax(128px, auto)` inflates any short item — a label strip, the marker
caption — into a full 128px block with a hole under it. Use
`grid-auto-rows: auto` with `min-height` on `.cf-card`.

**List the placement classes explicitly** when releasing them at tier 3,
rather than using a wildcard. A block added upstairs without a shed rule
then breaks visibly and immediately instead of silently inheriting one.

**`grid-auto-flow: row`, never `dense`.** Dense fills holes out of order,
which decouples visual order from DOM order.

---

## Edge cases

- **Long handle.** `handle` is free-form. The plate's foot row is `flex`
  with `gap`; a handle longer than its track wraps rather than clipping. Do
  **not** add `text-overflow: ellipsis` here — unlike
  `.nav-label`/`.cert-plate__title`, the handle is the address, and a
  truncated address is a wrong address.
- **Four channels or six.** The track ratios are authored for five plus one
  open track. At four, drop c5's plate and widen c4. At six, c4 takes the
  sixth plate and the figure loses its breathing room — check the marker
  adjacency gap if you do this, it is the constraint that gets tight first.
  Beyond six, add a second field; do not densify.
- **Missing icon.** Degrade to a two-letter monogram in `--text-micro`,
  same as the projects poster's `TechBadges`.
- **Image fails to load.** `.cf__figure-img` is an `aria-hidden`
  background; a 404 leaves the marker floating with no face under it, which
  looks broken. Give the wrapper a `--scan-stock` fallback fill so the
  marker still has a plate to sit on. *(This is the one edge case v2
  introduces that v1 did not have — v1's figure could vanish harmlessly.)*
- **Empty state.** Not reachable — `SOCIAL_LINKS` is authored, not fetched.
  If it were ever empty the module should not render at all rather than
  showing an empty field.
- **`prefers-reduced-motion`.** Hover transition and lift both removed
  entirely; the shadow change stays (it is not motion).

---

## Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| `.cf-card` | hover / focus | `translateY(0 → -3px)` + shadow deepen | `--dur-micro` `90ms` | `--ease-hard` |
| `.cf-card` | active | `translateY(-3px → 0)` | `--dur-micro` | `--ease-hard` |
| `.cf-card` (nearest to pointer) | pointer proximity | `scale` toward `dockScale(distance)`, up to `1.07` | JS-eased, `tau = 52ms` | exponential (`damping.ts`) |

**The proximity scale is JS-driven, not a CSS transition** (2026-08-26 fix,
`ChannelField.tsx`'s `useDockHover`). Scoring every plate independently
against the pointer let more than one bulge at once — several plates sit
within the shared 240px radius of each other — so only the single nearest
in-radius plate ever gets a real target now (`dockHover.ts`'s
`dockTargets`), and every plate's current scale eases toward its target with
frame-rate-independent exponential smoothing (`src/motion/damping.ts`, the
same pattern `OptionWheel.tsx` runs) rather than snapping every frame. `tau`
is deliberately well under `--dur-micro`'s 90ms — `tau`-based settling takes
~3×tau, so matching 90ms would settle around 270ms and read soft against the
hard-cut default below. Do not read this as a `--dur-soft` exception; it is
a *spatial* falloff being eased in time, not a new easing curve.

Nothing else moves. No entrance animation, no stagger-in, no parallax on
the figure. Doc 07's hard-cut default holds — the `--dur-soft`/`--ease-soft`
exception is scoped to the certificates bento and does not extend here.

The glitch decay layer is **not** used on this module: doc 12 scopes it to
module labels and system readouts, and these are channel names.

---

## Accessibility

**Focus order** is DOM order at every width — verified identical at 1440,
1280, 1100, 900, 640, 390 and 320. Nothing uses `order`.

**Accessible names**, read off the real accessibility tree at 1440 and 390:

```
heading     "CHANNELS"
link        "EMAIL KSFGARCIA24@GMAIL.COM SEND MESSAGE"
link        "GITHUB @OVERNUKE — opens in a new tab"
link        "LINKEDIN /KEFFWONTWAKEUP NETWORK · PROFILE — opens in a new tab"
link        "WHATSAPP PLACEHOLDER DIRECT CHAT — opens in a new tab"
link        "INSTAGRAM PLACEHOLDER — opens in a new tab"
StaticText  "OPEN TO WORK"
```

- Every accessible name **starts with the channel name**. See the Data
  section — this regressed once already and is worth a test.
- Every external link carries `— opens in a new tab` in a
  `.visually-hidden` span, matching `CertLink`.
- Every glyph is `aria-hidden` + `focusable="false"` beside visible label
  text, matching `SocialIcon.tsx`.
- Chrome that is `aria-hidden`: both connectors, both floating accents, the
  figure image, the marker's box. All of it is also `pointer-events: none`.
- Chrome that is **not** `aria-hidden`: the marker's label. It is the only
  statement of status on the page.

**Heading level:** `<h2>`. `PageLayer` already renders the page `<h1>` and
owns the dialog's `aria-labelledby` target; a second `<h1>` here would
duplicate it, which is the same reason `Panel`'s `title` is optional.

**Keyboard:** five tab stops, no traps, no custom key handling. The module
adds nothing to the global keyboard map.

**Touch targets:** every plate clears 24×24 (SC 2.5.8) by a wide margin at
all seven widths; the smallest measured is the GitHub banner at 123×526.
No rotation is used anywhere in this composition, so there is no
rotated-vs-unrotated hit-box question to answer.

---

## Verification

`docs/contact.design-proof-v2.html`, headless Chromium, at 1440 / 1280 /
1100 / 900 / 640 / 390 / 320:

| Check | Result |
|---|---|
| Interactive centre point hit-tests to itself | **0 occlusions** |
| Unrotated box ≥ 24 × 24 | **0 undersized** |
| Text clipped by its own box / plate overflowing | **0 clipped** |
| Focus order identical across all widths | **yes** |
| `OPEN TO WORK` present in the accessibility tree | **yes, at 1440 and 390** |
| Minimum Oxblood → Field Olive gap | **20px** (worst case, tiers 3–4) |
| Colour pairs vs. the computed table | **all match** |

> **Updated 2026-09-05 (channel-field name-overflow fix).** The
> `scripts/audit.mjs` wiring below is now **done**: the audit visits
> `/contact` at `1440 / 1280 / 1100 / 960 / 390`, with a page-scoped
> `checkChannelFieldOverflow` battery. It exists because a real defect got
> past every check here — the block-plate name line (`.cf-card__name` at a
> fixed `1.0625rem`, added later by `sdd/contact-section-editorial-dock` D5)
> overflowed its plate by 13–73px across 1440→901px, worst on `WHATSAPP` on
> the narrowest block slot (`.a-aside`). The plates are a `%` of a fitted
> stage while the name size, its `0.22em` tracking, the padding, the corner
> glyph and the index are all fixed px, so the name got crushed as the stage
> shrank. Fix: the block name is now container-fluid against the plate's own
> box (`clamp(0.8125rem, 13.5cqi, 1.0625rem)`, tracking eases with it), and
> `.cf-card__head` may wrap the glyph + index under the name at the narrow
> end. This closes the `D8` / `G3` manual sign-off item that
> `sdd/contact-section-editorial-dock` carried from its Phase 2. Details in
> `channel-field.css`.

Not yet done, and needed before merge: wiring this into
`scripts/audit.mjs` so `pnpm run audit:collage` covers `/contact` too, and
a `ContactPage.test.tsx` asserting

- every decorative mark stays out of the accessibility tree,
- `OPEN TO WORK` stays *in* it at every width,
- plate order matches `SOCIAL_LINKS` order,
- **the accessible name of each plate starts with the channel name** —
  this one has already regressed once,
- **no Oxblood element's box intersects a Field Olive plate's box.**

---

## Open decisions for Keff

1. **Instagram and WhatsApp handles** — ship blocker, above.
2. **The WhatsApp phone-number disclosure** — deliberate yes or no.
3. **Instagram's rounded-square mark** — square it (breaks the brand
   shape) or keep the radius (breaks the system's one absolute rule).
4. **`hero.png` is a 1024 × 1024 square with the figure occupying x
   23.5–82%** of it, so roughly a fifth of the figure box is empty
   transparent padding on each side. It works, and the square is what makes
   the marker positioning exact — but a crop tightened to the alpha bounding
   box, re-canvased square, would let the figure sit larger at the same box
   size. Worth doing if the figure ever feels small.
5. **Doc 13 needs a line** recording that this module ships an undithered
   photographic plate, so the next person does not "fix" it by running it
   through `halftone.py`.

---

## Implementation (2026-08-20)

| File | |
|---|---|
| `src/components/channel-field/ChannelField.tsx` | the composition |
| `src/components/channel-field/channel-field.css` | grid placement, four tiers, marker geometry |
| `src/components/channel-field/channelLayout.ts` | slot assignment, pure |
| `src/components/channel-field/channelLayout.test.ts` | 8 tests |
| `src/components/channel-field/index.ts` | barrel |
| `src/routes/ContactPage.tsx` | replaces the Phase 2 placeholder |
| `src/routes/contact-page.css` | the paper margin + height chain |
| `src/routes/ContactPage.test.tsx` | 8 tests |
| `src/content/types.ts` | `ChannelSlot`; `SocialLink` gains `handle`, `meta`, `channelSlot`, `unresolved`; `AboutProfile` gains `availability` |
| `src/content/data.ts` | `SOCIAL_LINKS` 3 → 5 channels |
| `src/components/social-icon/SocialIcon.tsx` | `InstagramIcon`, `WhatsappIcon` |
| `src/assets/plates/portrait/contact-plate.png` | 900 × 900, 354 KB |
| `tools/editorial_mono.py` | regenerates that plate from `hero.png` |

### Placeholder channels ship as plates, not as links

Instagram and WhatsApp have no address yet. The obvious handling — ship the
`PLACEHOLDER` href and let a test fail until someone fixes it — makes a red
build the only thing standing between a dead link and production, and red
builds get skipped.

Instead a channel flagged `unresolved` renders as a **plate with no link**: a
`div`, no `href`, not focusable, `.cf-card--pending`. It holds its slot, so
the composition stays whole rather than opening two holes, and it cannot be
clicked into a 404. Clearing the flag and filling in `href`/`handle` turns it
back into a link with no other change.

It is deliberately **not dimmed**. Lowering opacity would take Paper White on
Field Olive below its 6.79:1 — the plate would fail contrast in order to
signal something the word "pending" already says. It reads as flatter because
it does not lift on hover, which is the honest cue.

### Three things the build surfaced that the proof could not

**1. `assignChannelSlots` needs two passes.** With one, a channel that names
no slot takes the next free one in declaration order — including a slot a
*later* channel explicitly asked for. The later channel is then displaced by
something that expressed no preference at all, and the layout starts
depending on array order, which is the exact thing `channelSlot` exists to
prevent. Explicit claims are resolved first. There is a test.

**2. `1fr` carries an automatic min-content floor.** On the stacked tiers one
unbreakable string — a long Instagram handle — silently widens the track past
its container instead of wrapping. `minmax(0, 1fr)`. The desktop tier is left
as bare `fr` deliberately: its type is vertical, so a long handle costs height
there, not width.

**3. `box-sizing` comes from Tailwind's preflight**, via `@tailwind base` in
`styles/index.css`. No component stylesheet in this repo sets it, and this one
follows that. Worth knowing because a component rendered outside the app's CSS
entry gets `content-box`, and `width: 100%` plus padding then overflows its
grid track by exactly the padding — which looks like a layout bug and is not
one.

### Validation

Run in an isolated harness built from the module and its real dependencies —
`hero.png`, `tokens.css`, `data.ts`, `SocialIcon.tsx` — not against the full
app, which is not reachable from where this was written.

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `vitest run` (this module) | **16 passed** (2 files) |
| `eslint` | 0 problems |
| `prettier --check` | clean on every changed file |
| `vite build` | clean |
| Chromium at 1440 / 1280 / 1100 / 900 / 640 / 390 / 320 | 0 occlusions, 0 targets under 24 × 24, 0 clipped text |
| Focus order identical at every width | yes |
| Minimum Oxblood → Field Olive gap | 148 / 140 / 110 / 20 / 20 / 20 / 20 px |
| Rendering vs. `contact.design-proof-v2.html` | matches at every tier |

**Still to run on a full checkout**, because they need the whole app:
`pnpm typecheck` and `pnpm test` across every suite, `pnpm build`,
`pnpm run audit:collage` (which should be extended to cover `/contact`), and
the Playwright e2e — in particular `e2e/viewport-overflow.spec.ts`, which
contrasts `/projects` against `/certifications` and now has a third case.

### Open

1. **Instagram handle and WhatsApp number.** Until then both ship as pending
   plates.
2. **The WhatsApp phone-number disclosure** — a `wa.me` link publishes it in
   the page source, permanently and scrapeably.
3. **Instagram's mark is a squared redraw.** Feather's is `rect rx="5"`, the
   same baked radius as the envelope, but here the rounded square *is* the
   brand. Reversible in one line in `SocialIcon.tsx`.
4. **WhatsApp's mark is a stroke redraw**, not the trademark artwork —
   simple-icons has the authentic one but it is a filled path and reads
   heavier than the four 2px strokes beside it.
5. **Doc 13 needs a line** recording that this module ships an undithered
   photographic plate, so nobody "fixes" it by running it through
   `halftone.py`.
6. **`.git/config`'s `origin` points at `OverNuke/famket-api.git`** — noticed
   while looking for the remote, unrelated to this work, but probably not what
   you want this repo pushing to.
