import type { SVGProps } from "react";

/**
 * Channel glyphs for Home's contact strip.
 *
 * Updated 2026-08-06 (Keff, Home redesign): GitHub and LinkedIn are now
 * Feather's artwork (feathericons.com, MIT — path data reproduced below,
 * not drawn from memory), inlined rather than pulled from `react-icons`.
 * Inlining three paths avoids a dependency the app would otherwise carry
 * for three glyphs, and — the practical reason — it means the repo builds
 * on pull without an install step.
 *
 * Why Feather at all: brand marks are being removed from icon packages on
 * trademark requests. `simple-icons` (which this repo already depends on
 * for SkillBadge) has GitHub but NOT LinkedIn; `lucide` 1.29 ships 2,010
 * icons and zero brands. Feather and Tabler still carry both. Feather is
 * the sharper of the two — Tabler's LinkedIn is a rounded-square container,
 * which is the single most visible corner radius either set would put on
 * the page.
 *
 * MAIL IS DELIBERATELY NOT FEATHER'S. Feather's envelope is
 * `M4 4h16c1.1 0 2 .9 2 2v12…` — the corner arcs are bezier curves baked
 * into the path data. `border-radius: 0` is a CSS rule; it cannot reach
 * inside an SVG path, and neither can this project's radius audit, which
 * reads `getComputedStyle`. So a Feather envelope would sit inside a
 * zero-radius chip quietly contradicting the rule that chip exists to
 * demonstrate. The square envelope below is the same drawing without the
 * radii. GitHub's and LinkedIn's shapes carry brand identity that a
 * redraw would damage; an envelope carries none.
 *
 * All three take square caps and mitre joins (Feather's own default is
 * `round`, overridden here) and are always rendered `aria-hidden` beside
 * visible label text — they carry no accessible name of their own.
 */
function baseProps(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "square",
    strokeLinejoin: "miter",
    focusable: "false",
    ...props,
  };
}

/** Square-cornered envelope. See the note above on why this one is redrawn. */
export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="2" y="4" width="20" height="16" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

/** Feather `github` (MIT). */
export function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

/** Feather `linkedin` (MIT). */
export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
