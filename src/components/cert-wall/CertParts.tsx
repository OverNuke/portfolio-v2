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

/** Numerals down the left margin — makes the 12-row grid legible. */
export function TickRail() {
  return (
    <div className="cert-wall__rail" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <i key={i}>{String(i + 1).padStart(2, "0")}</i>
      ))}
    </div>
  );
}

/**
 * 証 — "proof". A wash at opacity .07, not type. `data-texture` marks it so
 * the contrast audit skips it by exemption rather than by lowering the bar.
 * Needs `--font-jp`: Archivo Narrow has no CJK coverage and renders tofu.
 */
export function GhostKanji() {
  return (
    <div className="cert-wall__kanji" aria-hidden="true" data-texture="true">
      証
    </div>
  );
}

export function SheetChrome({ serial }: { serial: string }) {
  return (
    <div className="cert-wall__chrome" aria-hidden="true">
      <div className="cert-wall__barcode">
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="cert-wall__serial">{serial}</div>
    </div>
  );
}

/** Exactly one per sheet — two reads as a gimmick (doc 12). */
export function AnnotationScrap({ area, text }: { area: string; text: string }) {
  return (
    <aside
      className="cert-wall__scrap"
      aria-hidden="true"
      style={{ gridArea: area, "--cw-rot": "1.8deg" } as React.CSSProperties}
    >
      <p>{text}</p>
      <small>ANNOTATION · 01 OF 01</small>
    </aside>
  );
}
