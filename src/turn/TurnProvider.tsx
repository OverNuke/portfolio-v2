import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { turnDirection } from "@/routes/registry";
import { useTurnKeys } from "./useTurnKeys";

interface TurnContextValue {
  direction: "forward" | "back";
  turnTo: (path: string) => void;
}

const TurnContext = createContext<TurnContextValue | null>(null);

export function useTurn(): TurnContextValue {
  const ctx = useContext(TurnContext);
  if (!ctx) throw new Error("useTurn must be used within TurnProvider");
  return ctx;
}

// Owns page-turn direction + the scoped arrow/Escape key layer (D7). Sections
// never bind window keydown directly — this is the single consolidation point.
export function TurnProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const prevPath = useRef(location.pathname);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  useEffect(() => {
    const from = prevPath.current;
    setDirection(turnDirection(from, location.pathname));
    // Restore focus to the nav item that opened the page being closed (spec
    // "close returns to Home and restores focus"). PageLayer's un-inert
    // effect (a descendant) already ran this commit, so the match is
    // focusable by now. Keyed off the route transition, not the trigger
    // mechanism, so it covers click/Enter/Escape/ArrowRight alike.
    if (location.pathname === "/" && from !== "/") {
      document.querySelector<HTMLElement>(`[data-turn-open="${from}"]`)?.focus();
    }
    prevPath.current = location.pathname;
  }, [location.pathname]);

  const turnTo = (path: string) => navigate(path);

  useTurnKeys(turnTo, location.pathname);

  return <TurnContext.Provider value={{ direction, turnTo }}>{children}</TurnContext.Provider>;
}
