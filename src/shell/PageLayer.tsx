import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useLocation } from "react-router";

interface PageLayerProps {
  homeRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

// Route-driven page turn: marks Home `inert` and moves focus into the page
// root whenever the route isn't "/"; releases both when back at Home.
// Focus restoration to the nav item that opened the page is TurnProvider's
// concern (its own location effect, after this one un-inerts Home).
export function PageLayer({ homeRef, children }: PageLayerProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const homeEl = homeRef.current;
    if (!homeEl) return;
    if (isHome) {
      homeEl.removeAttribute("inert");
    } else {
      homeEl.setAttribute("inert", "");
      pageRef.current?.focus();
    }
  }, [isHome, homeRef]);

  if (isHome) return null;

  return (
    <div ref={pageRef} tabIndex={-1} data-testid="page-layer">
      {children}
    </div>
  );
}
