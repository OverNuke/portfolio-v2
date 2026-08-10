import type { ElementType } from "react";
import type { Certificate } from "../../content/types";
import { CertLink, CertScan, AnnotationScrap, GhostKanji, SheetChrome, TickRail } from "./CertParts";
import {
  assertCertLayouts,
  assignSlots,
  getCertLayout,
  perSheet,
  type Orientation,
} from "./certLayouts";
import "./cert-wall.css";

if (import.meta.env.DEV) assertCertLayouts();

export interface CertWallProps {
  /** Every record. The sheet slices its own page. */
  certificates: readonly Certificate[];
  /** Which ladder — driven by the viewport's shape, see `useCertMode`. */
  sheet: Orientation;
  /** 1-based. Out of range clamps rather than rendering an empty sheet. */
  page?: number;
  pagerHref?: (page: number) => string;
  /** Router `Link`, so paging does not full-reload. Defaults to a plain anchor. */
  LinkComponent?: ElementType;
  annotation?: string;
  serial?: string;
}

const defaultPagerHref = (p: number) => (p === 1 ? "/certifications" : `/certifications/${p}`);

function orientationOf(c: Certificate): Orientation {
  return c.scanOrientation ?? "landscape";
}

export function CertWall({
  certificates,
  sheet,
  page = 1,
  pagerHref = defaultPagerHref,
  LinkComponent = "a",
  annotation = "the paper ones are in a drawer somewhere",
  serial = "SER. CRT—0000—MX",
}: CertWallProps) {
  const cap = perSheet(sheet);
  const total = certificates.length;
  const pageCount = Math.max(1, Math.ceil(total / cap));
  const current = Math.min(Math.max(page, 1), pageCount);
  const slice = certificates.slice((current - 1) * cap, current * cap);

  const years = certificates.map((c) => c.date).filter(Boolean).sort();
  const first = years[0];
  const last = years[years.length - 1];
  // "2025—2025" reads as a bug; a one-year span is a year.
  const span = !years.length ? "—" : first === last ? first : `${first}—${last}`;
  const countLabel = String(total).padStart(2, "0");

  const Link = LinkComponent;

  const head = (
    <header className="cert-wall__head" style={{ "--cw-i": 0 } as React.CSSProperties}>
      <div>
        <h3>Certificate archive</h3>
        <div className="cert-wall__sub">Module 02 · Credential wall</div>
      </div>
      <div className="cert-wall__rule">
        {countLabel} on file · {span}
      </div>
    </header>
  );

  if (total === 0) {
    return (
      <div className="cert-wall" data-sheet={sheet}>
        <section className="cert-wall__sheet">
          <TickRail />
          <GhostKanji />
          {head}
          <p className="cert-wall__empty" style={{ "--cw-i": 1 } as React.CSSProperties}>
            No credentials on file
          </p>
        </section>
      </div>
    );
  }

  const layout = getCertLayout(sheet, slice.length);
  // Slots are shaped for an orientation; records are matched to them so a
  // portrait A4 never lands in a landscape letterbox.
  const order = assignSlots(slice.map(orientationOf), layout.slots);

  return (
    <>
      <div
        className="cert-wall"
        data-sheet={sheet}
        style={layout.gutter ? ({ "--cw-gutter": layout.gutter } as React.CSSProperties) : undefined}
      >
        <section className="cert-wall__sheet">
          <TickRail />
          <GhostKanji />
          {head}

          <div className="cert-wall__meta" style={{ "--cw-i": 1 } as React.CSSProperties}>
            <span>
              {pageCount > 1
                ? `Sheet ${String(current).padStart(2, "0")} / ${String(pageCount).padStart(2, "0")}`
                : "Issued documents"}
            </span>
          </div>

          <SheetChrome serial={serial} />

          {order.map((recordIndex, slotIndex) => {
            const certificate = slice[recordIndex];
            const slot = layout.slots[slotIndex];
            return (
              <figure
                key={certificate.id}
                className="cert-mat"
                style={
                  {
                    gridArea: slot.area,
                    "--cw-rot": `${slot.rot}deg`,
                    "--cw-i": slotIndex + 2,
                  } as React.CSSProperties
                }
              >
                <CertScan certificate={certificate} eager={slotIndex === 0} />
                <figcaption
                  className={`cert-mat__cap${slotIndex % 2 === 1 ? " cert-mat__cap--deep" : ""}`}
                >
                  <h4 className="cert-mat__title">{certificate.title}</h4>
                  <div className="cert-mat__row">
                    <div className="cert-mat__meta">
                      <b className="cert-mat__issuer">{certificate.issuer}</b>
                      <em className="cert-mat__date">
                        {certificate.date} · {certificate.category}
                      </em>
                    </div>
                    <CertLink certificate={certificate} />
                  </div>
                </figcaption>
              </figure>
            );
          })}

          {layout.scrap ? <AnnotationScrap area={layout.scrap} text={annotation} /> : null}
        </section>
      </div>

      {/* NEXT sits LEFT of PREVIOUS. Doc 03: directional chrome reads with the
          right-to-left turn. Only the turn mirrors — never the tab order. */}
      {pageCount > 1 ? (
        <nav className="cert-pager" aria-label="Certificate sheets">
          {current < pageCount ? (
            <Link className="cert-pager__btn" href={pagerHref(current + 1)}>
              Next sheet
            </Link>
          ) : (
            // Inert span, not an aria-disabled link: a disabled link still
            // takes focus and still fires on Enter.
            <span className="cert-pager__btn" data-inert="true" aria-hidden="true">
              Next sheet
            </span>
          )}
          <span className="cert-pager__count">
            {String(current).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}
          </span>
          {current > 1 ? (
            <Link className="cert-pager__btn" href={pagerHref(current - 1)}>
              Previous
            </Link>
          ) : (
            <span className="cert-pager__btn" data-inert="true" aria-hidden="true">
              Previous
            </span>
          )}
        </nav>
      ) : null}
    </>
  );
}
