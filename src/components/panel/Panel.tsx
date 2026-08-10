import type { ReactNode } from "react";
import "./panel.css";

/**
 * Task 2.2 (sdd/phase2-app-shell), doc 04 Panel contract: title, status,
 * metadata, content. Design's Interfaces section names the fourth slot
 * `children`; this implementation uses `content` instead to stay literal
 * with doc 04's own property list ("title / status / metadata / content")
 * and with the task text that names all four slots explicitly — a
 * documentation-consistency choice, not a functional deviation (flagged
 * for sdd-verify).
 *
 * `status` is a short technical-label STRING (Field Olive), never a
 * ReactNode — an absent or whitespace-only status still renders the
 * literal fallback text "SYSTEM NOMINAL" so the slot is never dropped or
 * left blank (spec: panel-system / Panel primitive contract).
 *
 * `title` is optional: every current call site sits inside `PageLayer`
 * (`src/turn/PageLayer.tsx`), which already renders the page's real
 * `<h1>`/tag chrome and owns the a11y dialog's `aria-labelledby` target.
 * Passing the same route title/tag into Panel too produced a literal
 * duplicate heading + status pair in the DOM. Omitting `title` skips
 * `.panel__head` entirely rather than rendering an orphaned status with no
 * heading beside it.
 */
export interface PanelProps {
  title?: string;
  status?: string;
  metadata?: ReactNode;
  content?: ReactNode;
}

const FALLBACK_STATUS = "SYSTEM NOMINAL";

export function Panel({ title, status, metadata, content }: PanelProps) {
  const resolvedStatus = status?.trim() ? status : FALLBACK_STATUS;

  return (
    <section className="panel">
      {title !== undefined && (
        <header className="panel__head">
          <h2 className="panel__title">{title}</h2>
          <span className="panel__status">{resolvedStatus}</span>
        </header>
      )}
      {metadata !== undefined && <div className="panel__metadata">{metadata}</div>}
      {content !== undefined && <div className="panel__content">{content}</div>}
    </section>
  );
}
