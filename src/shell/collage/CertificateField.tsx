import { CERTIFICATES } from "../../content/data";
import { CertificatePlate } from "./CertificatePlate";

/**
 * Home collage's certificate plates — a single, fixed, hand-authored
 * chaotic layout (docs/12_COLLAGE_SYSTEM.md's three controlled deviations:
 * overlapping grid-area, capped rotation, stagger). Not seeded/randomized —
 * that mechanism is scoped to the Skills badge field only (SkillsCollage).
 */
export function CertificateField() {
  return (
    <ul className="cert-field">
      {CERTIFICATES.map((certificate) => (
        <li key={certificate.id}>
          <CertificatePlate certificate={certificate} />
        </li>
      ))}
    </ul>
  );
}
