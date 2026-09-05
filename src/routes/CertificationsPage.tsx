import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CertLedger } from "../components/cert-wall/CertLedger";
import { CertWall, defaultPagerHref } from "../components/cert-wall/CertWall";
import { perSheet } from "../components/cert-wall/certLayouts";
import { useCertMode } from "../components/cert-wall/useCertMode";
import { Panel } from "../components/panel/Panel";
import { CERTIFICATES } from "../content/data";
import { useFieldKeyboard } from "../turn/useFieldKeyboard";
import "./certifications-page.css";

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
  const navigate = useNavigate();
  const parsed = Number(page);
  const current = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  // Arrow-key sheet paging — genuinely new work, not a reuse of an existing
  // handler (§2.3, D3, `sdd/design-import-sections`: verified `/certifications`
  // had no arrow-key paging before this). `pageCount` is computed here from
  // the exported `perSheet`/`defaultPagerHref` rather than duplicated —
  // `CertWall` computes its own copy internally for slicing, from the same
  // inputs, so the two never disagree. The ledger (< 768px) has no pager at
  // all, so no wall mode -> no keys wired there.
  const sheet = mode === "wall-portrait" ? "portrait" : "landscape";
  const pageCount = Math.max(1, Math.ceil(CERTIFICATES.length / perSheet(sheet)));
  const isWall = mode !== "ledger";

  // Stands the sheet's own arrow keys down while a `CertScanModal` scan is
  // open — found while implementing this task (4.8's e2e coverage): the
  // modal already owns a document-level, capture-phase Escape/ArrowRight
  // listener, and this hook is now ALSO a document-level, capture-phase
  // ArrowRight listener. Both live on the SAME node in the SAME phase, so
  // `stopPropagation()` (neither hook calls `stopImmediatePropagation`)
  // does not stop the other from firing — without this guard, one
  // ArrowRight both closes the modal AND pages the sheet out from under
  // it. Same "topmost layer wins" precedent as `useTurnKeyboard` standing
  // down while `useWheelOpen()` is true.
  const [scanOpen, setScanOpen] = useState(false);

  // House convention (Left = forward, Right = back), NOT the mockup's
  // inverted ArrowRight-next/ArrowLeft-previous binding. Escape is
  // deliberately unhandled here — `CertScanModal` owns it.
  useFieldKeyboard({
    onForward:
      isWall && !scanOpen && current < pageCount
        ? () => navigate(defaultPagerHref(current + 1))
        : undefined,
    onBack:
      isWall && !scanOpen && current > 1 ? () => navigate(defaultPagerHref(current - 1)) : undefined,
  });

  return (
    <div className="certifications" data-mode={mode}>
      <Panel
        content={
          mode === "ledger" ? (
            <CertLedger certificates={CERTIFICATES} />
          ) : (
            <CertWall
              certificates={CERTIFICATES}
              sheet={sheet}
              page={current}
              LinkComponent={RouterPagerLink}
              onScanOpenChange={setScanOpen}
            />
          )
        }
      />
    </div>
  );
}
