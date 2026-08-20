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
>
> Updated 2026-08-05 — THE RED FAMILY IS RETIRED. Confirmed with Keff while
> designing the profile sheet's plate composition. Signal Red (#C63C32) and
> its small-text sibling (#8F2C24) are gone, and the vermilion (#E8452F)
> explored in the 2026-08-01 profile sheet v2 never landed here — it was set
> aside in the same conversation. Their single replacement is OXBLOOD
> (#4A1F1A). Two consequences worth reading before you touch anything red:
>
> 1. Oxblood is dark enough to behave like Ink — it CARRIES Paper White type
>    rather than being type on paper. The old large-text/small-text red split
>    therefore collapses into one token. There is no "oxblood-text".
> 2. Oxblood on Field Olive is 1.90:1. The accent and the plate colour must
>    never touch. Field Olive was promoted in the same pass from a chrome
>    accent to a full plate surface, so this pairing is now easy to reach for
>    by accident.
>
> Updated 2026-08-19 (reverted same day) — a Marker Orange accent was added
> and then cut, both scoped to the certifications page's doodle mark. The
> mark itself (a hand-drawn ring/loop stamp) was replaced with a Field Olive
> corner registration mark — reusing this doc's existing structural-chrome
> accent instead of adding a fourth one-off decorative color. `cert-wall.css`'s
> own header note has the full account.


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


OXBLOOD (added 2026-08-05 — replaces the entire red family)

HEX:
#4A1F1A

Usage:

- warnings, active states, highlights — the same job Signal Red held
- focus rings, live dots, `:active` fills, callout bars, detail-crop borders
- one instance per screen. Oxblood is a STATE colour, not a material one:
  it means "pay attention here," so a second instance halves the first.

Contrast on paper (#E4E4E2): 10.98:1 — passes AA at any text size, which
is why there is no separate small-text variant the way Signal Red needed
one. On Paper White (#F6F6F4): 12.92:1.

Paper White ON Oxblood: 12.92:1 — this is the default pairing. Oxblood is
close enough to Ink in value that it behaves like an inverted surface:
prefer putting light type on it over using it as type.

NEVER on Field Olive: 1.90:1 — effectively invisible. If a component needs
a red mark inside an olive plate, it does not get one; move the mark to the
paper margin, or use Paper White at reduced opacity.


OXBLOOD — RAISED

HEX:
#5C2A22

Usage:

- hover / raised state of an Oxblood surface only. Never a resting colour.

Contrast on paper (#E4E4E2): 9.12:1. Paper White on it: 10.73:1.


~~SIGNAL RED #C63C32~~ / ~~SIGNAL RED — TEXT #8F2C24~~ — RETIRED 2026-08-05.
Do not reintroduce either value. `src/styles/tokens.test.ts` fails the build
if the token names reappear anywhere under `src/`.


WARNING YELLOW

HEX:
#D6C76A

Usage:

- tape / annotation fills, label backdrops — decorative fills only

Never use as a text color on the paper background (~1.35:1 — fails
badly). It's fine as a fill with black ink text/labels printed on top
of it (11:1) — that's how it reads in the reference photo (tape behind
a label, not tape-colored text).


FIELD OLIVE (added 2026-07-27 — promoted to a plate surface 2026-08-05)

HEX:
#4F5A3C

Usage:

- PLATE SURFACE. As of the profile sheet's plate composition this is a
  full-size printed fill carrying Paper White type, not only a chrome
  accent. Paper White on Field Olive is 6.79:1 — AA at any size.
- neutral technical / structural accent — reticle corner marks,
  barcode + serial-number labels, spec/status icon rows, field-tag
  borders (see the TS-26 manifest reference), including the certifications
  wall's own top-left corner registration mark
  (`.cert-wall__sheet::before` in `src/components/cert-wall/cert-wall.css`)
- does NOT communicate warning or urgency the way the accent does —
  it reads as "this is equipment," not "pay attention now"
- keep it off Oxblood-carrying elements; the two should never both apply
  to the same component, and Oxblood on Field Olive is unreadable anyway

Contrast on paper (#E4E4E2): 5.77:1 — passes AA for any text size.
Contrast on Ink (#111111): 2.56:1 — do not place Field Olive text or
icons directly on an Ink fill; keep it on Paper or Paper White.
Ink on Field Olive: 2.57:1 — fails. Plates carry Paper White type, never
Ink. This inverts the pairing the 2026-08-01 vermilion sheet used; do not
carry that habit across.


FIELD OLIVE — DEEP (added 2026-08-05)

HEX:
#47513A

Usage:

- the second print pass where two olive plates overlap. Its whole job is to
  be *barely* distinguishable from Field Olive, so the overlap reads as
  registration drift rather than as a third colour. Do not use it as a
  standalone surface, and do not widen the gap between the two.

Contrast on paper (#E4E4E2): 6.58:1. Paper White on it: 7.74:1 — clears
this doc's 7:1 preferred bar, not just the 4.5:1 minimum.


---

# Typography

> Updated 2026-08-11 (font-unification pass) — this section previously
> listed candidate fonts under evaluation. The type system is now LOCKED to
> three roles, decided with the Home redesign (2026-08-06, self-hosted in
> `src/styles/fonts.css`) and enforced by `src/styles/tokens.css` +
> `src/styles/tokens.test.ts`'s retired-token guard. Do not reintroduce
> Bebas Neue, Oswald, Space Grotesk, Google Sans Code, IBM Plex Mono, or
> Archivo Narrow as a fourth display face — Archivo Narrow was the previous
> primary font and is now retired outright, not deprecated-but-present.

## Superior Serif (LT Superior Serif)

Purpose:

The masthead, and only that. One instance per screen.

## Remark (LT Remark)

Purpose:

The editorial voice — headings and prose emphasis outside the masthead.

## Mono (JetBrains Mono)

Purpose:

Everything else: wordmark, nav labels, identity, role, page titles,
metadata, system information, code labels, body, status. Dense tracked
uppercase always belongs here, never in either serif — see
`src/styles/fonts.css`'s header comment for the full rationale.

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
