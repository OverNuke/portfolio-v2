import type { Certificate } from "../../content/types";

export interface CertificatePlateProps {
  certificate: Certificate;
}

/**
 * A real link (opens the certificate image/PDF), not a button — placed in
 * the interactive z-index band (20-30) alongside NavItem, per
 * docs/12_COLLAGE_SYSTEM.md's stack-order-follows-meaning rule.
 * `certificate.icon` is not rendered this change (deferred — no renderer
 * exists yet for its string values).
 */
export function CertificatePlate({ certificate }: CertificatePlateProps) {
  return (
    <a
      href={certificate.href}
      target="_blank"
      rel="noopener noreferrer"
      className="plate cert-plate"
    >
      <span className="cert-plate__title" data-truncate="ellipsis">
        {certificate.title}
      </span>
      <span className="bar cert-plate__meta">
        <span className="k">{certificate.issuer}</span>
        <span className="v" data-truncate="ellipsis">
          {certificate.date}
        </span>
      </span>
    </a>
  );
}
