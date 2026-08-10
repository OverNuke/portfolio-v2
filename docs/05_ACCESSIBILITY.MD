# ACCESSIBILITY


Target:

WCAG 2.2 AA


---

# Contrast Rules


Minimum:

4.5:1


Preferred:

7:1+


---

# Colors

Base reading pair (primary — page text on the paper background):

Black ink #111111 on Off-white paper #E4E4E2 → 14.83:1

(Updated 2026-07-27 — paper shifted from #E8E6DF to a cooler, less-beige
#E4E4E2. See 02_DESIGN_SYSTEM.MD; every ratio on this page is
recalculated against the new value.)


Allowed (for inverted UI components — black tags/panels sitting on the
paper background, e.g. the label-tag component in 04_COMPONENT_RULES.MD):

White text:

#F2F2F2

on

#111111

→ 16.87:1


Secondary/meta text on paper:

Gray #635D54 on #E4E4E2 → 5.12:1

(Updated 2026-07-24 — the original #777777 measured 3.59:1 on the paper
background and 4.22:1 on black, both below the 4.5:1 minimum. See
02_DESIGN_SYSTEM.MD for the corrected value; do not use #777777 for
body-size text.)


New accent — Field Olive on paper:

Field Olive #4F5A3C on #E4E4E2 → 5.77:1 (passes AA for any text size)

Field Olive #4F5A3C on #111111 → 2.56:1 — fails. Do not use Field
Olive text or icons on an Ink fill; keep it on Paper or Paper White.


State accent — Oxblood (added 2026-08-05, replaces the red family):

Oxblood #4A1F1A on paper #E4E4E2 → 10.98:1 (AA at any text size)
Paper White #F6F6F4 on Oxblood #4A1F1A → 12.92:1 (the default pairing)
Oxblood — Raised #5C2A22 on paper → 9.12:1 (hover state only)

Oxblood #4A1F1A on Field Olive #4F5A3C → 1.90:1 — FAILS, and fails
invisibly rather than merely marginally. This is the pair most likely to
be reached for by accident now that Field Olive is a plate surface: an
accent mark placed "inside" a plate. It doesn't go inside; it goes on the
paper margin.


Plate surfaces — Field Olive as a printed fill (added 2026-08-05):

Paper White #F6F6F4 on Field Olive #4F5A3C → 6.79:1 (AA any size)
Paper White #F6F6F4 on Field Olive Deep #47513A → 7.74:1 (AA any size)

Ink #111111 on Field Olive #4F5A3C → 2.57:1 — fails
Ink #111111 on Field Olive Deep #47513A → 2.25:1 — fails

Olive plates carry Paper White type, never Ink. Note this is the OPPOSITE
of the pairing the retired vermilion explored on 2026-08-01 (Ink on red);
that habit does not transfer.


---

Avoid:

- #777777 as a text color at any body/caption size, on either background
- Signal Red #C63C32 and Signal Red — Text #8F2C24 anywhere at all —
  both retired 2026-08-05, replaced by Oxblood #4A1F1A. The token names
  are guarded by src/styles/tokens.test.ts
- Oxblood #4A1F1A on a Field Olive fill (1.90:1)
- Ink #111111 on a Field Olive or Field Olive Deep fill (2.57 / 2.25:1)
- Warning Yellow #D6C76A as a text color (~1.35:1 on paper) — fill/backdrop
  only, with black ink text on top
- Field Olive #4F5A3C as text or icons directly on an Ink (#111111)
  fill (2.56:1 — fails); Paper or Paper White backgrounds only


---

# Interaction


Every interactive element requires:

- keyboard navigation
- visible focus state
- semantic HTML
- minimum 24x24px target size (WCAG 2.2 SC 2.5.8) — worth flagging early
  since the dense technical-label / small-metadata-tag look in
  01_ART_DIRECTION.MD and 04_COMPONENT_RULES.MD can easily produce
  clickable tags smaller than this. Per MASTER_AGENT.md's own conflict
  order (Accessibility beats Project Vision), give small tags real
  padding/hit-area even if the visible glyph stays small, rather than
  shrinking the target to match the label.


---

# Motion


Animations must:

- respect prefers-reduced-motion
- not create flashing effects


---

# Page-Turn Navigation (added 2026-07-27)

See 03_UX_ARCHITECTURE.MD and 07_ANIMATION_GUIDELINES.MD for the
Home ⇄ Section page-turn model, decided right-to-left (manga order).
This is a navigational metaphor, not a document-direction change —
keep these separate or the implementation will mirror things that
should never mirror:

- Do NOT set `dir="rtl"` on `<html>` or any content wrapper. The
  site's language is English; body copy stays normal left-to-right
  reading order, normal text-align, normal form-field behavior.
  `dir="rtl"` would also flip scrollbars and browser chrome in ways
  that have nothing to do with the page-turn.
- What IS mirrored: the spatial direction of the transition itself
  (wipes right→left going forward, left→right going back), and any
  chrome that visually represents that direction — back/close icons,
  "next/previous" arrows, corner-mark ordering. Keep this mirroring
  scoped to navigation chrome, not to document structure.
- Tab order inside a page follows normal reading order (top-to-bottom,
  left-to-right through that page's own content) regardless of which
  direction the page turned in from. Don't let visual traversal
  direction leak into DOM/tab order — a screen reader user should
  never feel the RTL convention; it's a sighted, spatial device.
- Keyboard mapping — RESOLVED 2026-07-27 (Keff): the keyboard follows
  the *visuals*, not Western convention. Because the forward turn wipes
  leftward, Left Arrow is "forward" and Right Arrow is "back":

    Left Arrow    — focus on a nav item / record chip, on Home → opens
                    that module (forward)
    Right Arrow   — a page is open → closes it, back to Home
    Escape        — a page is open → closes it, back to Home
    Tab/Shift+Tab — normal DOM-order traversal, NEVER remapped
    Enter/Space   — native activation (every control is a real <button>)

  The arrow keys are a shortcut layer only. Every action they perform is
  also reachable via Tab + Enter, so a user who never discovers the
  mapping loses no functionality — which is what makes an unfamiliar
  directional convention acceptable here at all.

  See 11_HANDOFF_HOME.md for the implemented behavior, including the
  `busy` guard (a fast double-activation must not leave the shell inert
  with no page on top) and the focus-return contract (closing returns
  focus to the control that opened the page, never to body).
- The page-turn transition itself must respect `prefers-reduced-motion`
  — see 07_ANIMATION_GUIDELINES.MD (instant swap, no wipe).


---

# Decorative / Auto-Playing Animations (added 2026-07-27)

`NameRevealIntro` was audited and fixed as the first case of this — treat
its fix as the pattern for anything similar built later (a section-intro
sting, a loading sequence, etc.):

- If an animation auto-cycles text or state on a timer that the user
  doesn't control, don't partially expose it to assistive tech (e.g.
  hiding the chrome but not the headline text). Partial exposure is
  worse than full exposure or full hiding — it reads as broken rather
  than as a deliberate choice.
- Prefer marking the whole thing `aria-hidden` and treating it as
  decorative, UNLESS the animation is the only place the information
  exists — in that case it needs a real static equivalent (e.g. a
  visually-hidden heading with the same content), not a partially
  narrated animation.
- A fully `aria-hidden` element must never hold focus. If it's
  dismissible, make every plausible keypress (not just the "intended"
  skip keys) dismiss it while it's showing, so a keyboard user can't
  get stranded interacting with — or tabbing behind — something they
  can't perceive.
- Whenever a component goes the `aria-hidden` route, document explicitly
  (in its own README/comments) that the host page's real content must
  carry the same information on its own. This is easy to silently
  violate later by assuming "it's shown in the intro" counts.
