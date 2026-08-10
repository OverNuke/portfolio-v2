import type { Certificate } from "../../content/types";

export interface CertificatePlateProps {
  certificate: Certificate;
}

/**
 * A real link (opens the certificate image/PDF), not a button. Used by the
 * Certifications page (`/certifications`) — moved out of the Home collage
 * 2026-08-01 when Certificates became their own routed module (see
 * `docs/03_UX_ARCHITECTURE.MD`). `certificate.icon` is not rendered this
 * change (deferred — no renderer exists yet for its string values).
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
