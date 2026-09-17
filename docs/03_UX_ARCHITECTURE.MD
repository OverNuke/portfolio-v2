# UX ARCHITECTURE


## Application Structure


The portfolio behaves like a dashboard.


Layout:


+--------------------------------+
| SYSTEM HEADER                  |
+---------------+----------------+
| NAV MODULE    | CONTENT PANEL |
|               |               |
+---------------+----------------+
| STATUS BAR                    |
+--------------------------------+


---

# Main Modules


## PROFILE

Contains:

- identity
- short biography
- role
- experience

_Implemented 2026-08-28 as `/profile` (PAGE 01) — `src/components/profile-hero/`.
A manga-panel portrait collage (four click-to-enlarge panels) beside an
identity type stack (name, availability, bio, a "you fail? congrats" scrap,
colophon) and the one Oxblood "open to work" chip that routes to `/contact`.
Built from the `Profile Page UI Mockups` handoff, translated into the locked
design system._

_Two items from the list above are deferred: **experience** is served by the
dedicated `/projects` route (PAGE 03) — a junior portfolio's record of work is
its projects, and forcing an empty "EXPERIENCE: [ ROLE ]" block onto the hero
read as unfinished — reintroduce a block here if real roles land; and there is
no **CV** asset yet, so that slot renders a non-link placeholder chip until
`AboutProfile.cv` is filled in._

Register: **Expressive** — `01_ART_DIRECTION.MD`, "Surface Registers".


---

## PROJECT DATABASE

Contains:

Each project is represented as a technical record.


Example:


PROJECT_001

TITLE:

TECH:

STATUS:

YEAR:

DESCRIPTION:


---

## SKILLS MODULE — REMOVED 2026-07-31

This is no longer a standalone routed page. Technologies/tools now render
directly on Home, as the collage's Skills badge field (one of its 5 seeded
layouts — see `12_COLLAGE_SYSTEM.md`'s "Rotation and stagger" section).
~~Certificates/awards moved to Home the same way, as their own fixed
"Certificate/Award" collage role (same doc, Composition roles table).~~
Original spec for reference: technologies, tools, experience level.

> **Updated 2026-08-01:** superseded. Certificates/awards no longer live on
> Home — they ship as their own routed module, `/certifications`
> ("CERTIFICATE ARCHIVE"), the 2nd nav item after Profile. Skills is
> unaffected by this change and still renders inline on Home as described
> above. See `12_COLLAGE_SYSTEM.md`'s Composition roles table and its
> shed-order note, both updated with the same date.

> **Updated 2026-09-02:** `/certifications` is the **Record** register —
> `01_ART_DIRECTION.MD`, "Surface Registers". Axis-aligned bento mats, LT
> Remark titles, blueprint-grid paper, a ledger fallback on phone.

> **Updated 2026-09-16 (`sdd/rebuild-src-from-claude-design`, spec/design
> decision, obs #385):** on-page/nav label changed to **"Distinctions"**,
> superseding "CERTIFICATE ARCHIVE" above — matching the Claude Design
> mockup this change ports from. The route path is unchanged (`/certifications`
> — docs win on path per this doc's own routing section, below). Rebuilt as
> a live power-diagram colony (12 sites, weighted-Voronoi cells) rather than
> the bento-mat wall described above; the Record register's non-rotation
> rule still holds (`01_ART_DIRECTION.MD`, "The Record register does not
> rotate").

---

## CONTACT TERMINAL


Contains:

- email
- social links
- availability

Register: **Instrument** — `01_ART_DIRECTION.MD`, "Surface Registers". Mono only,
ink connectors behind the plates, the mechanical proximity dock, a figure
bleeding off the bottom edge. Implemented as "the channel field"
(`src/components/channel-field/`).

---

# Navigation Model — Page Turn

Decided with Keff, 2026-07-27.

Home is the fixed dashboard above — one viewport, no scroll, ever.
Nothing on Home moves it off that rule.

Opening a module (a project, About, Skills, Contact) is not scrolling.
It's a real state change: a full "page" turns in over Home and takes
the viewport. That page may have its own internal scroll if its content
is long — Home staying fixed and a page being free to be long are two
different rules, and conflating them is what created the WCAG 1.4.10
tension in 05_ACCESSIBILITY.MD in the first place. This model resolves
it structurally rather than patching around it: the shell never
scrolls, content is always free to.

Closing a page (explicit close control, Escape, or browser back)
returns to Home the same way it left — a reverse page turn. Home is
the resting state the whole app returns to; there is no separate
"return to intro" screen distinct from Home.

## Turn direction

Reads right-to-left — manga order, not Western comic order — per
Keff's call. This is a *navigational* convention, not a document
direction change: body copy stays normal English reading order
(top-to-bottom, left-to-right within a page). See 05_ACCESSIBILITY.MD
for what that distinction means for `dir`, tab order, and keyboard
mapping — getting this conflated would mirror things that shouldn't
mirror (scrollbars, text alignment, form fields).

Concretely: "forward" (Home → a page, or page → next page) turns
toward the left. "Back" (page → Home) turns toward the right. Any
directional chrome — back controls, arrow icons, corner-mark
ordering — should read consistently with this, not with the Western
left-to-right default.

## Routing

Each page should be addressable (its own route/URL), so browser
back/forward and refresh/deep-link land correctly, and so "browser
back" and "the in-app close control" trigger the same reverse
transition rather than two different behaviors.

Concretely: `/` (Home), `/profile` (PAGE 01), `/certifications` (PAGE 02),
`/projects` (PAGE 03), `/contact` (PAGE 04) — the canonical list is
`src/routes/registry.ts`. Nav
items render as real links styled as buttons, and the page layer is
driven by the route rather than by local state — that's what makes
browser back and the close control the same code path, and what keeps
the archive reachable with JavaScript disabled.

> **Corrected 2026-09-16 (`sdd/rebuild-src-from-claude-design`, task 1.12/
> design D7):** the canonical file was `src/routes/registry.ts` above, not
> `routes.ts` as this line previously said — `routes.ts` never existed.
> `registry.ts` is also the single source for nav labels and turn order
> (`RouteEntry.labelEn/labelEs/order`), not just the path list.

## Keyboard mapping — RESOLVED 2026-07-27

Left Arrow = forward (opens), Right Arrow / Escape = back. The keyboard
follows the visual direction of the turn rather than Western convention.
Full table and rationale in 05_ACCESSIBILITY.MD.

---

# Home — specified

Home's layout, tokens, component set, states, breakpoints, edge cases,
and motion are specified in **11_HANDOFF_HOME.md**, with a runnable
mockup at **home.design-proof.html**. Two decisions made there that
change rules on this page:

- Home's `#main-content` carries the name and role in real markup,
  because everything painted on the collage canvas is `aria-hidden`. This
  closes the open item flagged in the 2026-07-27 style audit. (Re-grounded
  2026-08-24, `sdd/drop-intro-hero-placeholder`: previously framed as the
  accessible equivalent of `NameRevealIntro`, a cinematic name/role reveal
  removed in that change.)
- The no-scroll rule is released below 768px, where WCAG 1.4.10 reflow
  takes priority per MASTER_AGENT.md's conflict order. Between 769 and
  1100px the shell still doesn't scroll but the readout region does —
  which is this page's existing rule ("the shell never scrolls, content
  is always free to"), not an exception to it.

