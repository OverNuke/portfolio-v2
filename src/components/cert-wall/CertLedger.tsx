import type { Certificate } from "../../content/types";
import { CertLink, CertScan } from "./CertParts";
import "./cert-wall.css";

export interface CertLedgerProps {
  certificates: readonly Certificate[];
}

/**
 * THE LEDGER — the phone composition (< 768px), composition B from the design
 * proof, restored at Keff's request 2026-08-06.
 *
 * Where the wall is a pile of framed documents, this is a document control
 * register: full-bleed olive rows, alternating print pass, zero rotation
 * anywhere. That contrast is the point — the phone is not a shrunken wall,
 * it is the other composition.
 *
 * This is the ONLY regime in the module that scrolls, and it is entitled to:
 * below 768px WCAG 1.4.10 reflow releases the no-scroll rule, and
 * `docs/05_ACCESSIBILITY.MD`'s conflict order puts accessibility above the
 * single-viewport vision.
 *
 * No pagination: a register is allowed to be long, and paging a phone list
 * would add a control where a thumb already has one.
 */
export function CertLedger({ certificates }: CertLedgerProps) {
  const years = certificates.map((c) => c.date).filter(Boolean).sort();
  const first = years[0];
  const last = years[years.length - 1];
  const span = !years.length ? "—" : first === last ? first : `${first}—${last}`;

  if (certificates.length === 0) {
    return (
      <div className="cert-ledger">
        <div className="cert-ledger__head">
          <span>Certificate archive</span>
        </div>
        <p className="cert-row">No credentials on file</p>
      </div>
    );
  }

  return (
    <div className="cert-ledger">
      <div className="cert-ledger__head" style={{ "--cw-i": 0 } as React.CSSProperties}>
        <span>Certificate archive</span>
        <span>{String(certificates.length).padStart(2, "0")} on file</span>
      </div>

      {certificates.map((certificate, i) => (
        <article
          key={certificate.id}
          className={`cert-row${i % 2 === 1 ? " cert-row--deep" : ""}`}
          style={{ "--cw-i": i + 1 } as React.CSSProperties}
        >
          <div className="cert-row__tick">{String(i + 1).padStart(2, "0")}</div>
          <div className="cert-row__main">
            <h3 className="cert-row__title">{certificate.title}</h3>
            <p className="cert-row__sub">
              {certificate.issuer} · {certificate.date}
            </p>
          </div>
          {certificate.scan ? (
            <CertScan certificate={certificate} className="cert-row__scan" />
          ) : null}
          <div className="cert-row__act">
            <CertLink certificate={certificate} />
          </div>
        </article>
      ))}

      <div
        className="cert-ledger__foot"
        style={{ "--cw-i": certificates.length + 1 } as React.CSSProperties}
      >
        <span>{span} · issued documents</span>
      </div>
    </div>
  );
}
