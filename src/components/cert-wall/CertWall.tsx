import type { ElementType } from "react";
import type { Certificate } from "../../content/types";
import { CertLink, CertScan, GhostKanji, GhostTitleMark, TickRail } from "./CertParts";
import {
  assertCertLayouts,
  assignSlots,
  getCertLayout,
  perSheet,
  recordSlots,
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
}: CertWallProps) {
  const cap = perSheet(sheet);
  const total = certificates.length;
  const pageCount = Math.max(1, Math.ceil(total / cap));
  const current = Math.min(Math.max(page, 1), pageCount);
  const slice = certificates.slice((current - 1) * cap, current * cap);

  const Link = LinkComponent;

  if (total === 0) {
    return (
      <div className="cert-wall" data-sheet={sheet}>
        <section className="cert-wall__sheet">
          <TickRail />
          <GhostKanji />
          <GhostTitleMark />
          <p className="cert-wall__empty" style={{ "--cw-i": 0 } as React.CSSProperties}>
            No credentials on file
          </p>
        </section>
      </div>
    );
  }

  const layout = getCertLayout(sheet, slice.length);
  // Slots are shaped for an orientation; records are matched to them so a
  // portrait A4 never lands in a landscape-shaped cell.
  const order = assignSlots(slice.map(orientationOf), recordSlots(layout));
  let recordCursor = 0;

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
          <GhostTitleMark />

          {layout.slots.map((slot, slotIndex) => {
            const style = {
              gridArea: slot.area,
              "--cw-i": slotIndex + 1,
            } as React.CSSProperties;

            const recordIndex = order[recordCursor];
            recordCursor += 1;
            const certificate = slice[recordIndex];
            if (!certificate) return null;

            const deep = slotIndex % 2 === 1;

            if (slot.kind === "visual") {
              return (
                <figure key={certificate.id} className="cert-mat cert-mat--visual" style={style}>
                  <CertScan certificate={certificate} eager={slotIndex === 0} />
                  <figcaption className={`cert-mat__cap${deep ? " cert-mat__cap--deep" : ""}`}>
                    <h3 className="cert-mat__title">{certificate.title}</h3>
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
            }

            return (
              <figure key={certificate.id} className="cert-mat cert-mat--micro" style={style}>
                <div className="cert-mat__index" aria-hidden="true">
                  {String(recordCursor).padStart(2, "0")}
                </div>
                <div className="cert-mat__body">
                  <h3 className="cert-mat__title">{certificate.title}</h3>
                  <div className="cert-mat__row">
                    <div className="cert-mat__meta">
                      <b className="cert-mat__issuer">{certificate.issuer}</b>
                      <em className="cert-mat__date">
                        {certificate.date} · {certificate.category}
                      </em>
                    </div>
                    <CertLink certificate={certificate} />
                  </div>
                </div>
              </figure>
            );
          })}
        </section>
      </div>

      {/* NEXT sits LEFT of PREVIOUS, dots between. Doc 03: directional chrome
          reads with the right-to-left turn. Only the turn mirrors — never the
          tab order. */}
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

          <div className="cert-pager__dots">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) =>
              n === current ? (
                <span
                  key={n}
                  className="cert-pager__dot"
                  data-inert="true"
                  aria-current="page"
                >
                  <span className="cert-pager__dot-glyph" />
                  <span className="visually-hidden">{`Sheet ${n}, current`}</span>
                </span>
              ) : (
                <Link key={n} className="cert-pager__dot" href={pagerHref(n)}>
                  <span className="cert-pager__dot-glyph" />
                  <span className="visually-hidden">{`Sheet ${n}`}</span>
                </Link>
              ),
            )}
          </div>

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
