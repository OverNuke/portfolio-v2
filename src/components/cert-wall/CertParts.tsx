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
export function GhostTitleMark() {
  return (
    <p className="cert-wall__ghost-title" aria-hidden="true" data-texture="true">
      Certificate archive
    </p>
  );
}
