import { useRef, useState, type ElementType } from "react";
import type { Certificate } from "../../content/types";
import { useInert } from "../../turn/useInert";
import { CertScanModal } from "./CertScanModal";
import { CertLink, CertPagerTabs, CertScan, GhostTitleMark } from "./CertParts";
import {
  assertCertLayouts,
  assignSlots,
  getCertLayout,
  perSheet,
  recordSlots,
  type CertSlot,
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
  /**
   * Fires whenever the scan modal opens/closes. `CertificationsPage` uses
   * this to stand its own sheet-level arrow-key pager down while a scan is
   * open (`useFieldKeyboard`'s onForward/onBack go inert) — the same
   * "topmost layer wins" precedent `useTurnKeyboard` already follows for
   * `useWheelOpen()`. Without this, `CertScanModal`'s own capture-phase
   * ArrowRight-close and the sheet's ArrowRight-back both fire on the same
   * keypress (same node, same phase — `stopPropagation` doesn't stop a
   * sibling listener), closing the modal AND paging the sheet at once.
   */
  onScanOpenChange?: (open: boolean) => void;
}

/** Exported so `CertificationsPage.tsx` can compute the same route the pager
 * tabs use, for wiring `useFieldKeyboard` — one implementation, not a
 * duplicated string template. */
export const defaultPagerHref = (p: number) =>
  p === 1 ? "/certifications" : `/certifications/${p}`;

function orientationOf(c: Certificate): Orientation {
  return c.scanOrientation ?? "landscape";
}

interface OpenScan {
  certificate: Certificate;
  trigger: HTMLElement;
}

/**
 * A bento tile — `sheet="landscape"` only (`certLayouts.ts`'s 2026-08-17
 * header note). Text-only: no `CertScan` here, the scan lives in the modal
 * `onOpen` triggers. The whole tile is one `<button>`; `CertLink` (the real
 * "open the source file" action `CertWall` used to render inside every mat)
 * is a sibling, not nested inside the button — a link inside a button is
 * invalid interactive nesting, so it's positioned over the tile via CSS
 * instead (`.cert-mat__link-slot`).
 */
function BentoTile({
  certificate,
  slot,
  slotIndex,
  style,
  onOpen,
}: {
  certificate: Certificate;
  slot: CertSlot;
  slotIndex: number;
  style: React.CSSProperties;
  onOpen: (certificate: Certificate, trigger: HTMLElement) => void;
}) {
  const tone = slot.tone ?? "light";
  const anatomy = slot.anatomy ?? "standard";

  return (
    <figure
      className={`cert-mat cert-mat--${tone} cert-mat--${anatomy}`}
      style={style}
      data-cut={slotIndex % 4}
    >
      <button
        type="button"
        className="cert-mat__trigger"
        onClick={(event) => onOpen(certificate, event.currentTarget)}
      >
        <span className="cert-mat__stack">
          <span className="cert-mat__head">
            <span className="cert-mat__kicker">{certificate.category}</span>
          </span>
          <span className="cert-mat__title">{certificate.title}</span>
        </span>
        <span className="cert-mat__row">
          <span className="cert-mat__meta">
            <b className="cert-mat__issuer">{certificate.issuer}</b>
            <em className="cert-mat__date">{certificate.date}</em>
          </span>
          {anatomy === "lead" ? (
            <span className="cert-mat__affordance" aria-hidden="true">
              View scan →
            </span>
          ) : null}
        </span>
        <span className="visually-hidden"> — view scan</span>
      </button>
      <span className="cert-mat__link-slot">
        <CertLink certificate={certificate} />
      </span>
    </figure>
  );
}

export function CertWall({
  certificates,
  sheet,
  page = 1,
  pagerHref = defaultPagerHref,
  LinkComponent = "a",
  onScanOpenChange,
}: CertWallProps) {
  const cap = perSheet(sheet);
  const total = certificates.length;
  const pageCount = Math.max(1, Math.ceil(total / cap));
  const current = Math.min(Math.max(page, 1), pageCount);
  const slice = certificates.slice((current - 1) * cap, current * cap);

  const Link = LinkComponent;
  const sheetRef = useRef<HTMLElement>(null);
  const [openScan, setOpenScan] = useState<OpenScan | null>(null);
  useInert(sheetRef, openScan !== null);

  function openModal(certificate: Certificate, trigger: HTMLElement) {
    setOpenScan({ certificate, trigger });
    onScanOpenChange?.(true);
  }
  function closeModal() {
    setOpenScan(null);
    onScanOpenChange?.(false);
  }

  if (total === 0) {
    return (
      <div className="cert-wall" data-sheet={sheet}>
        <section className="cert-wall__sheet">
          <GhostTitleMark />
          <p className="cert-wall__empty" style={{ "--cw-i": 0 } as React.CSSProperties}>
            No credentials on file
          </p>
        </section>
      </div>
    );
  }

  const layout = getCertLayout(sheet, slice.length);
  // Slots are shaped for a matching axis — `wantsHero` on the landscape
  // ladder, `wants` (scan orientation) on the portrait ladder — so records
  // are matched to slots rather than placed by array position.
  const order = assignSlots(
    slice.map((c) => ({ orientation: orientationOf(c), hero: c.hero ?? false })),
    recordSlots(layout),
  );
  let recordCursor = 0;

  return (
    <>
      <div
        className="cert-wall"
        data-sheet={sheet}
        style={layout.gutter ? ({ "--cw-gutter": layout.gutter } as React.CSSProperties) : undefined}
      >
        <section className="cert-wall__sheet" ref={sheetRef}>
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

            if (sheet === "landscape") {
              return (
                <BentoTile
                  key={certificate.id}
                  certificate={certificate}
                  slot={slot}
                  slotIndex={slotIndex}
                  style={style}
                  onOpen={openModal}
                />
              );
            }

            const deep = slotIndex % 2 === 1;

            if (slot.kind === "visual") {
              return (
                <figure key={certificate.id} className="cert-mat cert-mat--visual" style={style}>
                  <button
                    type="button"
                    className="cert-mat__trigger cert-mat__trigger--visual"
                    onClick={(event) => openModal(certificate, event.currentTarget)}
                  >
                    <CertScan certificate={certificate} eager={slotIndex === 0} />
                    <span className={`cert-mat__cap${deep ? " cert-mat__cap--deep" : ""}`}>
                      <span className="cert-mat__title">{certificate.title}</span>
                      <span className="cert-mat__row">
                        <span className="cert-mat__meta">
                          <b className="cert-mat__issuer">{certificate.issuer}</b>
                          <em className="cert-mat__date">
                            {certificate.date} · {certificate.category}
                          </em>
                        </span>
                      </span>
                    </span>
                    <span className="visually-hidden"> — view scan</span>
                  </button>
                  <span className="cert-mat__link-slot cert-mat__link-slot--visual">
                    <CertLink certificate={certificate} />
                  </span>
                </figure>
              );
            }

            return (
              <figure key={certificate.id} className="cert-mat cert-mat--micro" style={style}>
                <button
                  type="button"
                  className="cert-mat__trigger cert-mat__trigger--micro"
                  onClick={(event) => openModal(certificate, event.currentTarget)}
                >
                  <span className="cert-mat__index" aria-hidden="true">
                    {String(recordCursor).padStart(2, "0")}
                  </span>
                  <span className="cert-mat__body">
                    <span className="cert-mat__title">{certificate.title}</span>
                    <span className="cert-mat__row">
                      <span className="cert-mat__meta">
                        <b className="cert-mat__issuer">{certificate.issuer}</b>
                        <em className="cert-mat__date">
                          {certificate.date} · {certificate.category}
                        </em>
                      </span>
                    </span>
                  </span>
                  <span className="visually-hidden"> — view scan</span>
                </button>
                <span className="cert-mat__link-slot">
                  <CertLink certificate={certificate} />
                </span>
              </figure>
            );
          })}
        </section>
      </div>

      <CertPagerTabs
        pageCount={pageCount}
        current={current}
        pagerHref={pagerHref}
        LinkComponent={Link}
      />

      {openScan ? (
        <CertScanModal
          certificate={openScan.certificate}
          onClose={closeModal}
          returnFocusTo={openScan.trigger}
        />
      ) : null}
    </>
  );
}
