import { useEffect, useId, useRef } from "react";
import type { Project } from "../../content/types";
import { useReducedMotion } from "../../shell/useReducedMotion";

export interface ImageExpandOverlayProps {
  project: Project;
  onClose: () => void;
  /** The button that opened this overlay — focus returns here on close. */
  returnFocusTo: HTMLElement | null;
}

/**
 * Inspect-in-detail view for a record with no repo (Odoo today) — the
 * "no public GitHub repository" branch of the brief's interaction spec.
 *
 * Deliberately `role="dialog"` WITHOUT `aria-modal`: `PageLayer` already
 * wraps the whole routed page in `aria-modal="true"`, and nesting a second
 * `aria-modal` region inside it is ambiguous for assistive tech. Actual
 * modal-ness comes from `useInert` (applied by `ProjectSheet.tsx` to
 * `.project-sheet__panels` while this is mounted) — the same
 * inert-the-siblings approach `PageLayer`/`TurnProvider` already use for
 * the shell's own modal, so this is consistent with existing precedent,
 * not a new pattern.
 *
 * Dismissal is Escape or Right Arrow, per docs/05_ACCESSIBILITY.MD's
 * keyboard mapping (right = back/close). The listener is CAPTURE-phase
 * with `stopPropagation()`, mirroring `useSheetKeyboard.ts` exactly —
 * that's what reliably wins against `useTurnKeyboard`'s BUBBLE-phase
 * Escape/ArrowRight handler (which would otherwise close the whole page
 * out from under this overlay). See that file's header comment for the
 * full mechanism.
 */
export function ImageExpandOverlay({ project, onClose, returnFocusTo }: ImageExpandOverlayProps) {
  const reducedMotion = useReducedMotion();
  const headingId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      returnFocusTo?.focus();
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
      className="sheet-overlay"
      role="dialog"
      aria-labelledby={headingId}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <div className="sheet-overlay__scrim" aria-hidden="true" onClick={onClose} />
      <div className="sheet-overlay__panel">
        <button type="button" ref={closeRef} className="sheet-overlay__close" onClick={onClose}>
          Close
          <span className="visually-hidden"> — or press Escape / Right Arrow</span>
        </button>
        <h3 id={headingId} className="sheet-overlay__title">
          {project.title}
        </h3>
        <img className="sheet-overlay__img" src={project.image} alt={project.imageAlt} />
      </div>
    </div>
  );
}
