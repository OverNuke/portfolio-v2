import { Link, useParams } from "react-router";
import { CertLedger } from "../components/cert-wall/CertLedger";
import { CertWall } from "../components/cert-wall/CertWall";
import { useCertMode } from "../components/cert-wall/useCertMode";
import { Panel } from "../components/panel/Panel";
import { CERTIFICATES } from "../content/data";
import { ROUTES } from "./routes";
import "./certifications-page.css";

const route = ROUTES.find((r) => r.pageId === "certifications")!;

/** react-router's `Link` takes `to`; CertWall's pager passes `href`. */
function RouterPagerLink({ href, ...rest }: { href: string } & Record<string, unknown>) {
  return <Link to={href} {...rest} />;
}

/**
 * `/certifications` — the credential wall (`claude/certifications-module-2026-08-05.md`).
 *
 * Composition A / THE WALL at 768px and up, in a landscape or portrait ladder
 * depending on the shape of the viewport, sized so the sheet NEVER scrolls
 * (Keff, 2026-08-06). Below 768px it is replaced — not resized — by
 * composition B / THE LEDGER, which is the one place scrolling is permitted.
 *
 * Replaces the flat `CertificatePlate` list that stood here from 2026-08-01.
 */
export function CertificationsPage() {
  const mode = useCertMode();
  const { page } = useParams();
  const parsed = Number(page);
  const current = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  return (
    <div className="certifications" data-mode={mode}>
      <Panel
        metadata={<span>{route.sub}</span>}
        content={
          mode === "ledger" ? (
            <CertLedger certificates={CERTIFICATES} />
          ) : (
            <CertWall
              certificates={CERTIFICATES}
              sheet={mode === "wall-portrait" ? "portrait" : "landscape"}
              page={current}
              LinkComponent={RouterPagerLink}
              serial={`SER. CRT—${String(CERTIFICATES.length).padStart(4, "0")}—MX`}
            />
          )
        }
      />
    </div>
  );
}
