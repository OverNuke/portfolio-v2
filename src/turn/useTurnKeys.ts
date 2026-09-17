import { useEffect } from "react";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

// Scoped arrow/Escape keys (R3): Left = forward/open, Right/Escape = back/
// close. Bails whenever focus sits inside a real form field, since Contact
// hosts real inputs and typing must never trigger a page turn.
export function useTurnKeys(turnTo: (path: string) => void, currentPath: string): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;

      if (e.key === "ArrowRight" || e.key === "Escape") {
        if (currentPath !== "/") turnTo("/");
        return;
      }
      if (e.key === "ArrowLeft") {
        const active = document.activeElement;
        const target = active instanceof HTMLElement ? active.getAttribute("data-turn-open") : null;
        if (target) turnTo(target);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [turnTo, currentPath]);
}
