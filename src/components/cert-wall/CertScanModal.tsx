import { useEffect, useId, useRef } from "react";
import type { Certificate } from "../../content/types";
import { useReducedMotion } from "../../shell/useReducedMotion";
import { CertLink } from "./CertParts";

export interface CertScanModalProps {
  certificate: Certificate;
  onClose: () => void;
  /** The tile trigger that opened this modal — focus returns here on close. */
  returnFocusTo: HTMLElement | null;
}

/**
 * Scan-viewer dialog for the bento wall — added 2026-08-17 alongside the
 * landscape ladder's redesign (`certLayouts.ts`'s header note). Every
 * landscape tile is text-only now (no thumbnail on the grid); this is where
 * the scan itself lives.
 *
 * Deliberately `role="dialog"` WITHOUT `aria-modal`, for the same reason
 * `ImageExpandOverlay.tsx` (the pattern this is modeled on) gives: `PageLayer`
 * already wraps the routed page in `aria-modal="true"`, and a second nested
 * `aria-modal` region is ambiguous for assistive tech. Actual modal-ness
 * comes from `useInert`, applied by `CertWall.tsx` to `.cert-wall__sheet`
 * while this is mounted.
 *
 * Scrim and sheet are CSS SIBLINGS here (not scrim-wraps-sheet), so a click
 * on the sheet never reaches the scrim's `onClick` — no `stopPropagation`
 * needed, unlike the design handoff's own JS reference.
 */
export function CertScanModal({ certificate, onClose, returnFocusTo }: CertScanModalProps) {
  const reducedMotion = useReducedMotion();
  const headingId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Deferred by a microtask: `CertWall`'s `useInert` on `.cert-wall__sheet`
  // has not yet cleared `inert` at the moment this cleanup runs (React runs
  // cleanups before the next commit's effects), and `returnFocusTo` lives
  // inside that subtree. Focusing an inert element is a silent no-op — same
  // gotcha `ImageExpandOverlay.tsx` documents and works around.
  useEffect(() => {
    return () => {
      queueMicrotask(() => returnFocusTo?.focus());
    };
  }, [returnFocusTo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      if (event.key !== "Escape" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <div
      className="cert-scan-modal"
      role="dialog"
      aria-labelledby={headingId}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <div className="cert-scan-modal__scrim" aria-hidden="true" onClick={onClose} />
      <div className="cert-scan-modal__sheet">
        <div className="cert-scan-modal__head">
          <div className="cert-scan-modal__head-text">
            <span className="cert-scan-modal__kicker">{certificate.category}</span>
            <h3 id={headingId} className="cert-scan-modal__title">
              {certificate.title}
            </h3>
            <span className="cert-scan-modal__meta">
              {certificate.issuer} · {certificate.date}
            </span>
          </div>
          <button type="button" ref={closeRef} className="cert-scan-modal__close" onClick={onClose}>
            <span aria-hidden="true">✕</span>
            <span className="visually-hidden"> Close — or press Escape / Right Arrow</span>
          </button>
        </div>

        <div className="cert-scan-modal__body">
          {certificate.scan ? (
            <img
              className="cert-scan-modal__img"
              src={certificate.scan}
              alt={certificate.scanAlt ?? certificate.title}
            />
          ) : (
            <div className="cert-scan-modal__plate">
              <span className="cert-scan-modal__plate-label">Scan placeholder</span>
              {certificate.sourceFile ? (
                <span className="cert-scan-modal__plate-file">{certificate.sourceFile}</span>
              ) : null}
            </div>
          )}

          {certificate.note ? <p className="cert-scan-modal__note">{certificate.note}</p> : null}

          <CertLink certificate={certificate} />
        </div>
      </div>
    </div>
  );
}
