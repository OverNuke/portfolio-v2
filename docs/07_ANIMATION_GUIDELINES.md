# ANIMATION SYSTEM


Animation style:

Technical.
Controlled.
Mechanical.


---

Allowed effects:


- fade
- slide
- scan
- glitch
- loading sequences


---

Examples:


SYSTEM INITIALIZING

[██████████]


PROJECT DATABASE LOADING


---

Avoid:

- bouncing animations
- playful motion
- excessive effects

---

# Page Turn (Home ⇄ Section)

Decided with Keff, 2026-07-27. See 03_UX_ARCHITECTURE.MD for the
navigation model this animates.

The reference is a manga page turn, but the execution is NOT a
skeuomorphic paper curl — no curling edge, no drop shadow, no soft
"paper" easing. That reads as playful/decorative and breaks the
"technical, controlled, mechanical" rule above. Instead:

- A hard-edged `clipPath: inset()` wipe, same primitive already built
  in `NameRevealIntro.tsx`'s `TrackedBeat` — just horizontal instead
  of vertical, and reversed for direction (see below).
- A visible crease line at the wipe boundary (1–2px, Ink or Field
  Olive) — the one concession to "this is a page," rendered as a
  technical seam, not a fold.
- Hard-cut easing, matching the existing `HARD_CUT` curve
  (`duration: 0.2, ease: [0.7, 0, 0.3, 1]`) — no elastic/spring
  easing, no overshoot. (Superseded 2026-07-29 — duration changed from
  140ms to 200ms per design decision D10, `sdd/phase2-app-shell/design`;
  easing unchanged. `HARD_CUT`'s original 140ms was tuned for a
  text-height wipe inside `NameRevealIntro`; across a full 1440px
  viewport it read as a dropped frame and the crease direction never
  registered. See `src/styles/tokens.css`'s `--dur-turn`.)

Direction: right-to-left (manga order). Home → a page wipes in from
the right edge, moving left. Page → Home (close/back) reverses:
wipes in from the left edge, moving right. This is a navigational
convention only — see 05_ACCESSIBILITY.MD before implementing; it
does not mean `dir="rtl"` on the document.

Reduced motion: no wipe at all. Instant swap (opacity cross-fade at
most, same as `NameRevealIntro`'s own reduced-motion behavior) —
consistent with "respect prefers-reduced-motion" below.

