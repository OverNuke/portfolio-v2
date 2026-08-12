# Home profile text — two options

The deferred question from the Profile → Home merge: `/profile` is gone, and
Home already carries the identity content it would have shown (masthead =
name, `.hm-role` = role, the photograph) — this is the remaining piece,
whether any of `ABOUT_PROFILE`'s longer text (`summary`/`bio`, both in
`src/content/data.ts`, both currently unused anywhere in `Canvas.tsx`, which
today reads only `.role`) should land on Home too.

Both options slot into the same place: the `"role ."` grid row in
`src/shell/collage/home.css`'s `.canvas` grid (`src/shell/collage/Canvas.tsx`
lines 140-144, right after `.hm-role`). Neither option changes the grid
template — both live in the existing `role` grid-area, stacked under the
role line by normal block flow, on the paper side of the seam (ink text, no
contrast question — this column never crosses onto the olive field).

**On the 390px question:** Home's own no-scroll rule is *released* below
768px (`CLAUDE.md`: "Below 768px the no-scroll rule is released per WCAG
1.4.10 reflow — accessibility beats vision"). So the real question below
768px isn't "does it force scroll" — scrolling is already legal there — it's
whether either option still reads well stacked against the figure and the
stack block, not whether it fits in one screen.

---

## Option A — `summary` only

One sentence, ~11 words. Keeps the identity block terse, matching the
existing meta line's register — this is the safer default if the goal is
"don't lose the one-line pitch," nothing more.

```html
<div class="hm-identity">
  <p class="hm-role">Jr. Software Developer</p>
  <p class="hm-summary">Builds interface systems through engineering, design, and archival practice.</p>
</div>
```

```css
.hm-identity { grid-area: role; align-self: start; }

.hm-summary {
  margin: var(--space-xs) 0 0;
  max-width: 30ch;
  font-family: var(--font-serif-edit);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ink);
}
```

Wraps to roughly 3 lines at a 30ch measure. Adds one short serif-edit
paragraph under the mono role line — same "mono label → serif-edit voice"
pairing the wheel readout already uses, just without a serif-display title
between them (Home's masthead already fills that role).

## Option B — `summary` + `bio`

Adds the "want to know more about me" paragraph (`ABOUT_PROFILE.bio`, 2
sentences, ~32 words) directly under Option A's summary line, same column,
same styling — a short second paragraph, not a merged one, so the two
sentences that answer different questions ("what do you build" vs. "what are
you like to work with") stay visually distinct.

```html
<div class="hm-identity">
  <p class="hm-role">Jr. Software Developer</p>
  <p class="hm-summary">Builds interface systems through engineering, design, and archival practice.</p>
  <p class="hm-bio">Want to know more about me? I might not be the most experienced nor the flashiest player, but I always give my best and I'm eager to learn new skills and take on challenges.</p>
</div>
```

```css
.hm-identity { grid-area: role; align-self: start; }

.hm-summary {
  margin: var(--space-xs) 0 0;
  max-width: 30ch;
  font-family: var(--font-serif-edit);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ink);
}

.hm-bio {
  margin: var(--space-sm) 0 0;
  max-width: 30ch;
  font-family: var(--font-serif-edit);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--gray);
}
```

Roughly 6 more lines on top of Option A's 3 (~9 total) at the same 30ch
measure. At desktop this grows into the `minmax(0, 1fr)` row the identity
column already has spare height in, next to the stack block — worth a real
visual check that it doesn't crowd the figure's left edge before picking
this over A. At 390px (single-column stacked layout, no-scroll already
released) it just adds height above the figure — legal, but longer than
anything else in that column today.

## Recommendation

Lean **Option A** by default — it keeps the identity block a pitch, not a
bio, and stays proportionate to the mono meta line and role line already
there. Option B is the "more warmth" alternative if the review decides Home
should read less like a terminal and more like an introduction. Pick one
before Phase 4 (the React port) — see `HANDOFF.md`.
