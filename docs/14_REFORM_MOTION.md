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

Use FLIP. `src/motion/useReform.ts`:

```ts
import { useLayoutEffect, useRef } from "react";

/**
 * FLIP for a set of parts that keep their identity across a layout change.
 * Measure before, let the browser lay out, measure after, invert with a
 * transform, then release. Nothing here is module-specific — that is the
 * point.
 *
 * `key` is whatever changed the layout: a breakpoint tier, a view mode, a
 * page index. `parts` is a ref to the container; every descendant with
 * `[data-reform-id]` is tracked, and the id is the part's identity.
 */
export function useReform(container: React.RefObject<HTMLElement>, key: string) {
  const previous = useRef<Map<string, DOMRect>>(new Map());
  const reduced = useRef(false);

  useLayoutEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;

    const parts = Array.from(root.querySelectorAll<HTMLElement>("[data-reform-id]"));
    const next = new Map<string, DOMRect>();
    for (const el of parts) next.set(el.dataset.reformId!, el.getBoundingClientRect());

    const before = previous.current;
    previous.current = next;

    // First paint, or reduced motion: record positions, animate nothing.
    if (before.size === 0 || reduced.current) return;

    for (const el of parts) {
      const id = el.dataset.reformId!;
      const from = before.get(id);
      const to = next.get(id);
      if (!from || !to || from.width === 0 || to.width === 0) continue;

      const dx = from.left - to.left;
      const dy = from.top - to.top;
      const sx = from.width / to.width;
      const sy = from.height / to.height;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01) continue;

      const rank = Number(getComputedStyle(el).getPropertyValue("--rank")) || 0;
      const stagger = parseFloat(getComputedStyle(el).getPropertyValue("--stagger-rank")) || 55;

      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: "none" }],
        {
          duration: 560,
          delay: rank * stagger,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        },
      );
    }
  }, [key, container]);
}
```

**`scale` distorts type and borders.** It is fine for a plate, a photo or
a flat surface; it is wrong for a text block. Give text parts a
`data-reform-id` but no size change — move them, do not resize them —
or animate their container and let the text sit still inside it.

**Do not read the durations from JS if you can avoid it.** The values
above are duplicated from the tokens on purpose: `getComputedStyle` per
part per reform is a measurable cost, and these two numbers change about
once a year. If they drift, `tokens.test.ts` is the place to catch it.

---

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
