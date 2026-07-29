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

## SKILLS MODULE


Display:

- technologies
- tools
- experience level


---

## CONTACT TERMINAL


Contains:

- email
- social links
- availability

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

Concretely: `/`, `/profile`, `/projects`, `/skills`, `/contact`. Nav
items render as real links styled as buttons, and the page layer is
driven by the route rather than by local state — that's what makes
browser back and the close control the same code path, and what keeps
the archive reachable with JavaScript disabled.

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

- Home also serves as the accessible equivalent of `NameRevealIntro`.
  Since that component is fully `aria-hidden`, Home's `#main-content`
  must carry the name and role in real markup — it now does. This
  closes the open item flagged in the 2026-07-27 style audit.
- The no-scroll rule is released below 768px, where WCAG 1.4.10 reflow
  takes priority per MASTER_AGENT.md's conflict order. Between 769 and
  1100px the shell still doesn't scroll but the readout region does —
  which is this page's existing rule ("the shell never scrolls, content
  is always free to"), not an exception to it.

