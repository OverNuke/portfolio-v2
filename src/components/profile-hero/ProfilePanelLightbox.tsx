import { useEffect, useId, useRef } from "react";
import type { ProfilePanel } from "../../content/types";
import { useReducedMotion } from "../../shell/useReducedMotion";

export interface ProfilePanelLightboxProps {
  panel: ProfilePanel;
  onClose: () => void;
  /** The panel button that opened this — focus returns here on close. */
  returnFocusTo: HTMLElement | null;
}

/**
 * Enlarged view of one /profile hero panel — the "click a panel to see it
 * bigger" interaction the manga-collage mockup specs.
 *
 * Shares its accessibility decisions with `project-field`'s in-place record
 * zoom (`FieldRecord.tsx`) — the two components differ in interaction shape
 * (a separate overlay here vs. a record scaling in place there) but land on
 * the same a11y contract:
 *
 * - `role="dialog"` WITHOUT `aria-modal`: `PageLayer` already wraps the
 *   whole routed page in `aria-modal="true"`; nesting a second one is
 *   ambiguous for AT. The real modal-ness is `useInert` on
 *   `.profile-hero__body` (applied by `ProfileHero` while this is mounted).
 * - Dismiss is Escape or Right Arrow (docs/05_ACCESSIBILITY.MD: right =
 *   back/close). CAPTURE-phase listener with `stopPropagation()` so it wins
 *   against `useTurnKeyboard`'s bubble-phase handler, which would otherwise
 *   close the whole page instead of just this overlay.
 * - Focus return is deferred a microtask: React runs effect cleanup before
 *   the commit that removes `inert`, so focusing the trigger synchronously
 *   lands on `<body>` (focusing into an inert subtree is a silent no-op).
 *   Fails only in a real browser — jsdom has no `inert`.
 */
export function ProfilePanelLightbox({ panel, onClose, returnFocusTo }: ProfilePanelLightboxProps) {
  const reducedMotion = useReducedMotion();
  const headingId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

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
      className="profile-lightbox"
      role="dialog"
      aria-labelledby={headingId}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <div className="profile-lightbox__scrim" aria-hidden="true" onClick={onClose} />
      <div className="profile-lightbox__panel">
        <button type="button" ref={closeRef} className="profile-lightbox__close" onClick={onClose}>
          Close
          <span className="visually-hidden"> — or press Escape / Right Arrow</span>
        </button>
        <h3 id={headingId} className="profile-lightbox__title">
          {panel.caption ?? "Portrait"}
        </h3>
        <img className="profile-lightbox__img" src={panel.image} alt={panel.alt} />
      </div>
    </div>
  );
}
