# DESIGN SYSTEM

> Base direction: LIGHT PAPER, not dark OS. This was a deliberate call —
> confirmed with Keff on 2026-07-24 — to stay true to the source reference
> (akatachi wldd product sheet), which is a light "newsprint" surface with
> black ink on top, not a black-background terminal. If a future revision
> wants to explore a dark mode, treat it as a distinct theme, not the default.
>
> Updated 2026-07-27 — this doc is now the single source of truth for the
> palette (a parallel `styleguide.html` reference sheet had drifted to
> slightly different hex values; it's been reconciled to match this file).
> Two changes: the paper tone shifted cooler/grayer — Keff wasn't a fan of
> the original warmer #E8E6DF — and a new accent, FIELD OLIVE, was added
> after a third reference image (a TS-26 field-tested equipment manifest)
> introduced reticle marks, barcode/serial labels, and technical icon rows
> that needed a color of their own, distinct from Signal Red's
> warning/hot meaning. Per this doc's own accent rule ("nothing else
> unless justified") — Field Olive is justified as a neutral, structural
> accent, not a state color.


## Color Palette

## Primary

OFF WHITE (PAPER)

HEX:
#E4E4E2

Usage:

- background (the base surface — the "newsprint" page, never pure white)
- default panel fill

Note: shifted 2026-07-27 from the original #E8E6DF toward a cooler,
less-beige off-white per Keff's preference. Every contrast ratio below
is recalculated against this value; none crossed an AA threshold in the
move (all shifted by well under 0.3:1).


---

PAPER WHITE

HEX:
#F6F6F4

Usage:

- card / tag surfaces sitting slightly "above" the base paper
- inverse text surface on Ink


---

BLACK (INK)

HEX:
#111111

Usage:

- text
- panel borders / frames
- label tags (used as a small filled component — see below)
- large graphic marks / silhouettes


---

GRAY

HEX:
#635D54

Usage:

- secondary information, captions, meta text

Note: the original #777777 only reached 3.59:1 against the old
off-white (and 4.22:1 against black) — both fail WCAG AA for
normal-size text (4.5:1 required). #635D54 reaches 5.12:1 on the
updated paper background (#E4E4E2). Do not revert to #777777 for
body-size text.


---

## Accent Colors


SIGNAL RED

HEX:
#C63C32

Usage:

- warnings, active states, highlights
- large text (24px+ / 19px+ bold), icons, borders, filled UI elements only

Contrast on paper (#E4E4E2): 4.03:1 — passes AA for large text/UI
components (3:1) but NOT for normal body-size text. For small red text
(links, inline flags, small badges) use SIGNAL RED — TEXT below instead.


SIGNAL RED — TEXT

HEX:
#8F2C24

Usage:

- small-size red text: links, inline status flags, small badges

Contrast on paper (#E4E4E2): 6.46:1 — passes AA for any text size.


WARNING YELLOW

HEX:
#D6C76A

Usage:

- tape / annotation fills, label backdrops — decorative fills only

Never use as a text color on the paper background (~1.35:1 — fails
badly). It's fine as a fill with black ink text/labels printed on top
of it (11:1) — that's how it reads in the reference photo (tape behind
a label, not tape-colored text).


FIELD OLIVE (added 2026-07-27)

HEX:
#4F5A3C

Usage:

- neutral technical / structural accent — reticle corner marks,
  barcode + serial-number labels, spec/status icon rows, field-tag
  borders (see the TS-26 manifest reference)
- does NOT communicate warning or urgency the way Signal Red does —
  it reads as "this is equipment," not "pay attention now"
- keep it off Signal Red-carrying elements; the two accents should
  never both apply to the same component

Contrast on paper (#E4E4E2): 5.77:1 — passes AA for any text size.
Contrast on Ink (#111111): 2.56:1 — do not place Field Olive text or
icons directly on an Ink fill; keep it on Paper or Paper White.


---

# Typography


## Primary Font

Purpose:

Titles
Headings
Large labels


Recommended:

- Bebas Neue
- Archivo Narrow
- Oswald
- Space Grotesk


---

## Technical Font

Purpose:

Metadata
System information
Code labels


Recommended:

- Google Sans Code 
- JetBrains Mono
- IBM Plex Mono


---

# Border Rules


Use:

border-radius:0


Preferred:

- thin borders
- sharp corners
- rectangular modules


Avoid:

- rounded cards
- floating glass panels
