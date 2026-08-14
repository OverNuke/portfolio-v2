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
 * modal-ness comes from `useInert` (applied by `ProjectField.tsx` to
 * `.pf__records` while this is mounted) — the same
 * inert-the-siblings approach `PageLayer`/`TurnProvider` already use for
 * the shell's own modal, so this is consistent with existing precedent,
 * not a new pattern.
 *
 * Dismissal is Escape or Right Arrow, per docs/05_ACCESSIBILITY.MD's
 * keyboard mapping (right = back/close). The listener is CAPTURE-phase
 * with `stopPropagation()`, mirroring `useFieldKeyboard.ts` exactly —
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

  /**
   * Focus goes back to the trigger on close — DEFERRED BY A MICROTASK, and
   * that is not a stylistic choice.
   *
   * React runs every effect CLEANUP for a commit before it runs that
   * commit's effects. At the moment this cleanup fires, `useInert` in
   * `ProjectField` has therefore not yet removed `inert` from
   * `.pf__records` — and the trigger button lives inside it. Focusing an
   * element in an inert subtree is silently a no-op: focus lands on
   * `<body>` instead, and a keyboard user who pressed Escape is dumped at
   * the top of the document with no indication of where they were.
   *
   * It fails invisibly, and it fails ONLY in a real browser — jsdom does
   * not implement inert at all, so a component test cannot catch it. This
   * was found by driving the built page in Chromium and reading
   * `document.activeElement`.
   *
   * A microtask runs after the whole commit, by which point the attribute
   * is gone and the button is focusable again.
   */
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
      className="pf-overlay"
      role="dialog"
      aria-labelledby={headingId}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <div className="pf-overlay__scrim" aria-hidden="true" onClick={onClose} />
      <div className="pf-overlay__panel">
        <button type="button" ref={closeRef} className="pf-overlay__close" onClick={onClose}>
          Close
          <span className="visually-hidden"> — or press Escape / Right Arrow</span>
        </button>
        <h3 id={headingId} className="pf-overlay__title">
          {project.title}
        </h3>
        <img className="pf-overlay__img" src={project.image} alt={project.imageAlt} />
      </div>
    </div>
  );
}
