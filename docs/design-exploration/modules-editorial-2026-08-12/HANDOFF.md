# HANDOFF — modules editorial redesign (2026-08-12)

Status: exploration, awaiting a decision. Nothing here is wired into the
app. `certifications.html`, `projects.html`, `contact.html` are standalone
static pages — open any of them directly off disk, no server needed.

**Status update, same day.** The `/projects` header item (port checklist
item 2) has been ported, with one deviation from the plan below: `.m-title`
was dropped (see `Panel.tsx`'s own doc comment on the duplicate-heading
regression this would repeat), only `.m-meta`'s reasoning survives as
`.projects-page__lede`. More significantly, this HANDOFF's own premise that
"the wall/sheet compositions themselves... do NOT change" is **no longer
true for `/projects` specifically** — Keff separately sanctioned overturning
`project-sheet.css`'s tiled-only rule for that module, and its composition
was rebuilt as a scattered layout (`projectLayouts.ts`). See
`project-sheet.css`'s header comment for the full record.
`/certifications` and `/contact` (checklist items 1 and 3) are unaffected
and still pending, under this file's original scope.

## Overview

Three routed pages (`/certifications`, `/projects`, `/contact`) get the same
treatment: a new 3-tier "module readout" header — mono meta line → serif-
display title → serif-edit lede — the same pattern already shipping in
`src/shell/wheel/wheel.css`'s `.wheel-readout`, recolored here for ink-on-
paper instead of Paper-White-on-olive (this content sits in the routed
page's own paper field, not over the wheel's dark backdrop).

**What does NOT change:** the wall/sheet compositions themselves
(`src/components/cert-wall/`, `src/components/project-sheet/`). Both are a
deliberate mono-type "document-plate" idiom — confirmed by direct
inspection, every `font-family` in `cert-wall.css`/`project-sheet.css` is
`var(--font-mono)` (plus one `--font-jp` texture, one `--font-hand`
annotation scrap) — and `project-sheet.css`'s own header comment says so
explicitly: *"Do not fix this file by making it look more like Home — the
distinction is the point."* The redesign target is the page frame around
those compositions, not their internals. `certifications.html`/
`projects.html` therefore show a simplified stand-in (real data, same
visual DNA — paper-white mats/panels, olive captions, plate shadows — but
no port of `certLayouts.ts`'s rotation/slot math or the sheet's
template-ladder grid-area system). The open design question is the header/
composition pairing, not a pixel-accurate wall/sheet port, which already
exists and works.

`contact.html` is different: `ContactPage.tsx` today is a 15-line
placeholder with zero channel content, so this is the first real design for
that page, not a re-skin.

**Deviation from the plan's `modules-data.js` item:** the original plan
called for a `sections.js`-equivalent data file, matching that file's
pattern of feeding a live, JS-driven interactive wheel. These three mockups
don't have one — see "No interactive wheel chrome" below — so a separate JS
file that nothing reads would be dead weight. Data (route `sub`/`title`/
`lede`, certificate/project/channel fields) is inlined directly as literal
markup in each HTML file instead, with a header comment in each file citing
its source (`routes.ts` entry / `data.ts` array). Keep these in sync by hand
against those two files until the port.

## No interactive wheel chrome

The three prior `direction-0{1,2,3}` proofs each embed a working
`OptionWheel` because they were 3 *alternative designs of the same page*
(Home), meant to be compared by paging through them. This phase mocks 3
*different, already-real routed pages* — there's nothing to page between,
so none of these files load `option-wheel.js`/`.css`. Each is a plain
static page.

## Design tokens used

Everything here is `src/styles/tokens.css` values, copied as a `:root`
block per file (same self-contained-file convention as the existing
`direction-0{1,2,3}` proofs) — no new tokens, no new colors:

| Token | Value | Usage here |
|---|---|---|
| `--paper` / `--paper-white` | `#e4e4e2` / `#f6f6f4` | page field / card & panel surfaces |
| `--ink` | `#111111` | body text on paper |
| `--gray` | `#635d54` | meta/secondary text |
| `--field-olive` / `--field-olive-deep` | `#4f5a3c` / `#47513a` | caption strips, alternating record panels |
| `--oxblood` | `#4a1f1a` | the "MOCKUP" banner only, and the contact focus ring (on paper — never touches olive) |
| `--font-mono` | JetBrains Mono | meta lines, chrome, body labels |
| `--font-serif-display` | LT Superior Serif | module title (`.m-title`) |
| `--font-serif-edit` | LT Remark | lede, channel labels |

Contrast: every olive surface carries Paper White type only (never Ink —
2.57:1, banned); `--oxblood` never touches an olive surface anywhere in
these three files.

## Components (reused, not reinvented)

- **`.m-header` / `.m-meta` / `.m-title` / `.m-lede`** — the new piece,
  ink-on-paper variant of `.wheel-readout`/`.wheel-readout__meta`/
  `.wheel-readout__title`/`.wheel-lede` (`src/shell/wheel/wheel.css`).
- **Contact icons** — exact SVG path data copied from
  `src/components/social-icon/SocialIcon.tsx` (`GithubIcon`/`LinkedinIcon`/
  `MailIcon`), currently orphaned (confirmed: no import of that file
  anywhere in `src/` today).
- **`fake-page-head`** — reproduces `src/turn/turn.css`'s real
  `.page-head`/`.page-title`/`.page-tag`/`.page-close` rules, for context
  only. Not the subject of this mockup; unchanged in the real app.

## Port checklist (once a direction is chosen)

1. `src/routes/certifications-page.css` / new markup in
   `CertificationsPage.tsx`: add the module-readout header
   (`.m-header`/`.m-meta`/`.m-title`/`.m-lede` → real classnames) above the
   existing `<CertWall>`/`<CertLedger>`, fed by the certifications entry in
   `ROUTES` instead of hardcoded strings.
2. `ProjectsPage.tsx` / `projects-page.css`: same header above the existing
   `<ProjectSheet>`, fed by the projects entry in `ROUTES`.
3. `ContactPage.tsx` (real build, replacing the placeholder): module-readout
   header + a channel list mapped from `SOCIAL_LINKS`
   (`src/content/data.ts`), pairing each entry with the matching icon from
   `SocialIcon.tsx` by label (`GitHub`→`GithubIcon`, `LinkedIn`→
   `LinkedinIcon`, `Email`→`MailIcon`). New `contact-page.css`.
2b. Certifications/projects wall/sheet stand-ins in these mockups are
   simplified — do NOT port `.wall-standin`/`.sheet-standin` markup
   verbatim; the real `CertWall`/`ProjectSheet` components already handle
   rotation, pagination, and responsive collapse correctly and stay as-is.
4. Home text (`home-profile-text.md`): once Option A or B is picked, add
   the `.hm-identity` wrapper + `.hm-summary`(/`.hm-bio`) rule to
   `Canvas.tsx`/`home.css` per that file's exact snippet.
5. Delete this folder (`docs/design-exploration/modules-editorial-2026-08-12/`)
   once ported — same convention as every prior exploration here.

## Accessibility notes

- Contact icons are `aria-hidden="true"`; each channel's accessible name
  comes from its visible label + href text, per `SocialIcon.tsx`'s own doc
  comment — never from the icon alone.
- `.channel`/`.mat`/`.rec` links and cards all clear the 24px `--hit-min`
  floor (WCAG 2.2 SC 2.5.8).
- Focus rings: Ink surfaces (contact list, on paper) use `--oxblood`
  (10.98:1); nothing here puts a ring on an olive surface, which would
  require Paper White instead (same rule the real `CertWall`/`ProjectSheet`
  CSS already follows).
- No `<h1>` in any mockup — the real `<h1>` is `PageLayer`'s own
  `.page-title` (reproduced here only as `.fake-title`, `aria-hidden`); the
  module-readout title here is an `<h2>`, matching the real heading
  hierarchy a ported version would need to preserve.
