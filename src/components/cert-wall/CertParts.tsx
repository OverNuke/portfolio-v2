import type { ElementType } from "react";
import type { Certificate } from "../../content/types";

/**
 * Shared pieces for both compositions (wall and ledger). Kept in one file the
 * way `project-sheet/SheetPanels.tsx` groups its panel primitives.
 */

/**
 * The document itself, as a halftone archive plate (tools/halftone.py
 * --preset plate). `object-fit: contain` on stock, never `cover` — a cropped
 * certificate is a ruined certificate, and Keff's set mixes portrait A4 with
 * landscape.
 *
 * With no plate the `.ph` stock is the empty state: the record still gets a
 * full mat, because the mat is the frame.
 */
export function CertScan({
  certificate,
  eager = false,
  className = "cert-mat__scan",
}: {
  certificate: Certificate;
  eager?: boolean;
  className?: string;
}) {
  if (!certificate.scan) {
    return (
      <div className={`${className} cert-mat__scan--empty`}>
        <span className="cert-mat__ph">{`NO PLATE — ${certificate.id.toUpperCase()}`}</span>
      </div>
    );
  }

  // `scanAlt` absent means the caption already carries everything the image
  // conveys, so the plate is decorative. Never ship alt="" on a figure whose
  // visible caption says something different.
  return (
    <div className={className}>
      {certificate.scanAlt ? (
        <img
          src={certificate.scan}
          alt={certificate.scanAlt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      ) : (
        <img
          src={certificate.scan}
          alt=""
          role="presentation"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
}

/**
 * Opens the certificate document. It says VIEW, not VERIFY: `href` is the
 * file, not an issuer verification endpoint, and claiming otherwise would be
 * a lie in the accessible name.
 *
 * Paper White inside its olive plate — oxblood on olive is 1.90:1. The ring
 * comes from `--focus`, set per surface, never hardcoded here.
 *
 * "View" alone is not a name: a link-list read-out of five identical "View"
 * links is useless, so each carries a visually-hidden suffix.
 */
export function CertLink({ certificate }: { certificate: Certificate }) {
  return (
    <a
      className="cert-link"
      href={certificate.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      View <span aria-hidden="true">{"↗"}</span>
      <span className="visually-hidden">{` — ${certificate.title}, opens in a new tab`}</span>
    </a>
  );
}

/**
 * Decorative stand-in for the masthead this sheet no longer renders. Real
 * text set with `writing-mode`, never a transform on a text node — same
 * pattern as `project-field.css`'s `.pf__mark`. `aria-hidden` regardless,
 * since `PageLayer`'s own `<h1>` already says "Certifications" and this is
 * the same string as ornament.
 */
export interface CertPagerTabsProps {
  /** Total sheets. 1 or fewer renders nothing — a single sheet needs no pager. */
  pageCount: number;
  /** 1-based, already clamped by the caller (`CertWall`). */
  current: number;
  pagerHref: (page: number) => string;
  /** Router `Link`, so paging does not full-reload — same contract as `CertWall`'s own prop. */
  LinkComponent: ElementType;
}

/**
 * "01" / "02" vertical number tabs — replaces the dot pager (D3,
 * `sdd/design-import-sections`, 2026-09-04). `LinkComponent` + `pagerHref`
 * are kept, non-negotiably: this codebase routes `/certifications/2`
 * (deep-links + browser back/forward), unlike the mockup's local-state
 * paging.
 *
 * The current-page tab keeps the OLD dot-pager's exact inert-`<span>`
 * treatment, not `aria-disabled` on a link: *"a disabled link still takes
 * focus and still fires on Enter."* Stacked VERTICALLY, direction-neutral,
 * so it carries no claim about which side "next" sits on — if ever laid out
 * horizontally, `02` must sit left of `01` (doc 03: NEXT left of PREVIOUS).
 *
 * Zero rotation (Record register, ADR-5) — the mockup rotates the tab base
 * `±1.5deg` and the hover `±2deg`; both ship at `0`, hover keeps only
 * `translateY(-2px)`.
 */
export function CertPagerTabs({
  pageCount,
  current,
  pagerHref,
  LinkComponent,
}: CertPagerTabsProps) {
  if (pageCount <= 1) return null;

  const Link = LinkComponent;

  return (
    <nav className="cert-pager" aria-label="Certificate sheets">
      <div className="cert-pager__tabs">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
          const label = String(n).padStart(2, "0");
          return n === current ? (
            <span key={n} className="cert-pager__tab" data-inert="true" aria-current="page">
              <span aria-hidden="true">{label}</span>
              <span className="visually-hidden">{`Sheet ${n}, current`}</span>
            </span>
          ) : (
            <Link key={n} className="cert-pager__tab" href={pagerHref(n)}>
              <span aria-hidden="true">{label}</span>
              <span className="visually-hidden">{`Sheet ${n}`}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function GhostTitleMark() {
  return (
    <p className="cert-wall__ghost-title" aria-hidden="true" data-texture="true">
      Certificate archive
    </p>
  );
}
