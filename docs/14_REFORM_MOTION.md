# 14 — REFORM MOTION

> A recipe, not a component. Two effects that share one vocabulary:
>
> - **ENTER** — what a section does when it opens.
> - **REFORM** — what a section's parts do when the layout changes
>   underneath them (a breakpoint, a view mode, a filter, a page of records).
>
> Written 2026-08-24 from the `/projects` study
> (`claude/projects-field-reform-2026-08-24.md`). Applying this to another
> module should be an afternoon, not a redesign — everything module-specific
> is in one table you fill in, and everything shared is in `src/motion/`.
>
> Live study: https://claude.ai/code/artifact/6ca7918b-ae73-4518-88f8-f75c4593e4d7

---

## 0. The one idea

Both effects treat a section as **a fixed cast of parts**, not as a
picture. A part has an identity that outlives any particular layout. ENTER
introduces the cast in a reading order; REFORM moves the cast to new marks.

Everything below is bookkeeping on top of that. If you cannot name the
cast of the section you are animating, stop — the effect will not read,
because there is nothing for the eye to follow.

---

## 1. Tokens

Two new, in `src/styles/tokens.css`. Everything else is already there.

```css
/* Reform: the geometry curve. Deliberately NOT a third easing —
   --ease-soft already exists (certificates bento, 2026-08-17) and this
   is the same job: a long move that has to stay readable end to end.
   Doc 07's hard cut stays the default for anything that CUTS. */
--dur-reform: 560ms;
--stagger-rank: 55ms;
```

| Token            | Value                            | Used by          |
| ---------------- | -------------------------------- | ---------------- |
| `--ease-hard`    | `cubic-bezier(0.7, 0, 0.3, 1)`   | every ENTER beat |
| `--dur-turn`     | `200ms`                          | every ENTER beat |
| `--ease-soft`    | `cubic-bezier(0.22, 1, 0.36, 1)` | REFORM           |
| `--dur-reform`   | `560ms`                          | REFORM           |
| `--stagger-rank` | `55ms`                           | both             |

**On 560ms.** Measured, it is not slow: `--ease-soft` puts most of the
travel in the first third, so a part has visually arrived by ~250ms and
spends the rest settling. That is deliberately close to `--dur-turn`, so a
reform and a page turn feel like the same machine at two speeds.

**On rank.** Every part carries `style={{ "--rank": n }}` where `n` is its
position in the section's own hierarchy — largest/first is 0. Rank drives
both the ENTER delay and the REFORM `transition-delay`. It is authored,
never computed at runtime, per doc 12's rotation rule.

---

## 2. ENTER — four beats

Four beats, each using an effect doc 07 already permits (scan, slide,
fade). The order is a reading order: **what the section is, then what is
in it, then what you can do about it.** Chrome arrives last because it is
the only part that is not information.

| At    | Part                           | Effect                      |
| ----- | ------------------------------ | --------------------------- |
| 0ms   | the title                      | `scan-x`, left → right      |
| 80ms  | surfaces (band, cards, panels) | `scan-x`, staggered by rank |
| 200ms | images / plates                | `ink` — see the trap below  |
| 240ms | accent chrome (bars, rules)    | `scan-y`, bottom → top      |
| 320ms | type blocks                    | `lift` — 7px + ink          |
| 420ms | system chrome (marks, meta)    | `ink`, unstaggered          |

Total ≈ 620ms. Copy `src/motion/reform.css` and change only the selectors
in the six blocks; the delays are the recipe.

### Two traps, both paid for once already

**A part that owns its own `clip-path` cannot also be scanned.** The
`/projects` plates are `clip-path: circle()`. A scan wipe is also a
`clip-path`, so it replaces the circle and the disc renders as a
rectangle for the length of the animation. Anything with its own clip
gets `ink` instead. This is the same family of bug as
`project-field.css`'s "a clipped element cannot paint its own boundary".

**`animation-fill-mode: both` latches the end state.** A part whose
opacity is controlled by the _layout_ (visible in one tier, hidden in
another) must never be given an opacity animation on enter — it will be
pinned at 1 forever, in every tier. Give it a `clip-path` beat or no beat
at all.

---

## 3. REFORM — the shared-element move

### 3a. The cheap version, for a bounded stage

If the section already lives in a bounded box whose children are
positioned as percentages of it — `/projects` does, via `--pf-ar` — you do
not need FLIP. Put every part on one transition contract and change the
layout attribute:

```css
.xx-part {
  position: absolute;
  transition:
    left var(--dur-reform) var(--ease-soft),
    top var(--dur-reform) var(--ease-soft),
    width var(--dur-reform) var(--ease-soft),
    height var(--dur-reform) var(--ease-soft),
    opacity calc(var(--dur-reform) * 0.55) linear;
  transition-delay: calc(var(--rank, 0) * var(--stagger-rank));
}
```

Keep squares square across changing aspect ratios with `cqw` plus
`aspect-ratio: 1`, not with percentage width and height — percentages
resolve against different axes and turn every disc into an ellipse the
moment the box's aspect changes.

### 3b. The real version, for anything laid out by grid or flow

Use FLIP: `src/motion/useReform.ts`. It is shipped, tested and wired into
`/projects` — read the file, do not re-derive it. The contract:

```tsx
const stageRef = useRef<HTMLDivElement>(null);
const tier = useViewportTier();
useReform(stageRef, tier, { readKey: readViewportTier });
```

and every part that should be followed across the change carries:

| Attribute                  | Meaning                                      |
| -------------------------- | -------------------------------------------- |
| `data-reform-id="band"`    | this part's identity; required to be tracked |
| `data-reform-rank="2"`     | delay this part by 2 × `--stagger-rank`      |
| `data-reform-scale="none"` | move it, do not resize it                    |

Four things in there were not obvious, and each cost a fix:

**Compose, do not overwrite, the transform.** Several parts already use
`transform` for their own layout — `.pf-record__figure` centres itself
with `translateY(-50%)`. A textbook FLIP writes over that and the element
snaps to its untransformed position before it animates. The inverse is
applied _on top of_ whatever the part computes to in its new layout, and
released back to exactly that.

**Take the delta between centres, not corners.** The scale runs about the
default `transform-origin`, so a corner delta double-counts the size
change.

**Scale smears type.** A shape scales — a square plate stays a circle
under a uniform scale — but a caption gets `data-reform-scale="none"` and
moves without resizing.

**`fill: "backwards"`, never `"forwards"`.** A forwards fill latches the
final transform onto the element and wins over every later CSS layout —
the same trap as the opacity one in §2.

### 3c. The bug the tests exist for

The first working version played nothing at all on an instant resize, and
review would not have caught it — it took driving a real browser across
900px and counting `document.getAnimations()`.

The cause: the snapshot of "where the parts were" was refreshed on every
`resize`. But by the time any listener runs, the media query has already
applied and the DOM is in the _new_ layout, so the refresh destroyed the
only record of the old one and every delta came out zero.

The fix is the `readKey` option — a function that reads the key
synchronously, without waiting for React. On resize the hook compares it
to the key it last animated at; if they differ, a reform is already in
flight and the refresh stands down. Omit `readKey` and the refresh is
skipped entirely, which is safe but leaves the snapshot as old as the last
render — fine for a mode toggle, wrong for a breakpoint.

## 4. Applying it to another section

Fill this in before writing any CSS. If a row is hard to answer, the
answer is usually that the section should not reform.

| Question                       | `/projects` answer                   | Yours |
| ------------------------------ | ------------------------------------ | ----- |
| What is the cast?              | title, band, 3 plates, 3 captions    |       |
| What is rank 0?                | the primary record — largest         |       |
| What is the bounded stage?     | `.pf__stage`, aspect `--pf-ar`       |       |
| What triggers the reform?      | the 900px breakpoint                 |       |
| What is born?                  | poster card, accent disc, accent bar |       |
| What dies?                     | the foot-index column structure      |       |
| Which parts own a `clip-path`? | the plates — they get `ink`          |       |

### On born and died parts

A part that appears from nothing breaks the illusion, and the reflex fix —
flying it in from a corner — makes it worse, because the eye tries to
follow something that has no history. **Park it on top of the record it
belongs to** at the layouts where it is hidden, so it grows out of its
own record rather than arriving from off-canvas.

That is a mitigation, not a solution. The solution is a composition where
the born part _is_ an existing part wearing a different treatment. Reach
for that first; it is a design decision, not a motion one.

---

## 5. Reduced motion

**Do not play it faster. Do not play it at all.**

```css
@media (prefers-reduced-motion: reduce) {
  .xx[data-enter="run"] * {
    animation: none !important;
  }
  .xx-part {
    transition: none;
  }
}
```

The section is simply already there, and the layout change is instant.
This matches `project-field.css`'s existing block and doc 07's page-turn
rule. Both effects were designed so that their reduced-motion state is the
finished composition — not a frozen mid-frame, and not a thing with a
piece missing.

One rule from `project-field.css` carries over verbatim and is worth
repeating because it is easy to reintroduce: **the reduced-motion reset
may never name a shape selector.** `clip-path: none !important` on a part
whose shape _is_ a clip-path turns every disc into a rectangle for exactly
the audience least likely to report it.

---

## 6. Where the radius question landed

The `/projects` study proposed interpolating `border-radius` as a state
signal — 0 when surfaces are fused, rounded when they separate. It is a
good signal and it is **not** being taken, because `tokens.css` ends with

```css
*,
*::before,
*::after {
  border-radius: 0 !important;
}
```

and `project-field.css` already routes around that guard with `clip-path`
rather than overriding it, on the stated grounds that _"that law is worth
more than an override."_ One study is not a reason to reopen it. The gap
between surfaces carries the same information at no cost.

The toggle is still in the study page if you want to look at both.
