import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { ROUTES } from "../routes/routes";
import { useReducedMotion } from "../shell/useReducedMotion";
import { resolveTurn, type Turn } from "./resolveTurn";
import { setInert } from "./useInert";
import { TurnContext, type TurnContextValue } from "./useTurn";

const SETTLE_MS = 200;

function titleFor(path: string): string {
  return ROUTES.find((route) => route.path === path)?.title ?? "";
}

export interface TurnProviderProps {
  children: ReactNode;
}

/**
 * Task 2.4 (sdd/phase2-app-shell), design "Page-turn Flow": the whole turn
 * machine is one imperative `useLayoutEffect` reacting to
 * `location.pathname` — not distributed across components, so effect order
 * is guaranteed. Two invariants govern every step: never focus into an
 * inert subtree; never leave focus inside a subtree about to go inert.
 *
 * `displayedPath` is what the persistent `PageLayer` is CURRENTLY showing
 * (design D3) — it only updates once a turn settles, so it deliberately
 * diverges from `location.pathname` for the duration of a turn. Seeded to
 * "/", so a deep link to e.g. "/skills" resolves "forward-home" on the
 * first paint (spec: "applies uniformly to ... deep-link initial loads"),
 * with `opener = null`.
 */
export function TurnProvider({ children }: TurnProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Refs are the imperative source of truth (busy-guard checks, DOM nodes
  // TurnProvider manipulates directly). State mirrors them only for
  // context consumers that need to re-render — keeps the driver effect's
  // deps honest at [location.pathname, start] with no eslint-disable.
  const shellElRef = useRef<HTMLElement | null>(null);
  const titleElRef = useRef<HTMLHeadingElement | null>(null);
  const displayedPathRef = useRef("/");
  const busyRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const pendingPathRef = useRef<string | null>(null);
  // Set synchronously by go() before navigate(); consumed once by the next
  // driver effect run. Distinguishes a go()-initiated navigation (opener
  // already stored, busy already claimed by go() itself) from one the
  // driver discovered on its own — browser back/forward and typed URLs,
  // which "cannot be blocked" and never carry a reliable opener.
  const viaGoRef = useRef(false);

  // Task 2.5: `start` reads this via a ref, not directly from the hook's
  // return value, so `start`'s own `useCallback` deps can stay `[]` —
  // advisor-flagged: adding `reducedMotion` to `start`'s deps would change
  // its identity whenever the media query flips, re-running the driver
  // `useLayoutEffect` ([location.pathname, start]). If that fired mid-turn,
  // `initiatedByGo` would read `false` and the effect would clobber
  // `openerRef.current = null` — silently re-introducing the exact opener
  // bug batch 3 fixed. Mirroring into a ref sidesteps this entirely.
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const [displayedPath, setDisplayedPath] = useState("/");
  const [turn, setTurn] = useState<Turn>("none");
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const registerShell = useCallback((el: HTMLElement | null) => {
    shellElRef.current = el;
  }, []);
  const registerTitle = useCallback((el: HTMLHeadingElement | null) => {
    titleElRef.current = el;
  }, []);

  // No external reactive dependencies: everything it touches is a ref or a
  // setState function (both stable identities), plus a recursive
  // self-reference for pendingPath reconciliation (safe — the reference is
  // only evaluated when the returned closure is later called, by which
  // point `start` is fully assigned).
  const start = useCallback((nextTurn: Turn, nextPath: string) => {
    busyRef.current = true;
    setBusy(true);
    setTurn(nextTurn);

    if (nextTurn !== "reverse") {
      // forward-home / forward-page: the layer is already in the DOM
      // (merely clipped) — `layerMounted` flips true the instant
      // location.pathname changes, in the same render/commit as this
      // effect, so the destination <h1> already exists. Focus it BEFORE
      // the shell goes inert: never leave focus inside a subtree that is
      // about to become inert.
      titleElRef.current?.focus();
      if (shellElRef.current) setInert(shellElRef.current, true);
    }

    const settle = () => {
      if (nextTurn === "reverse") {
        // Un-inert BEFORE focusing — focusing an inert-adjacent target
        // first fails silently (design D-flow note).
        if (shellElRef.current) setInert(shellElRef.current, false);
        const opener = openerRef.current;
        if (opener && document.contains(opener) && !opener.hasAttribute("disabled")) {
          opener.focus();
        } else {
          document.getElementById("main-content")?.focus();
        }
        setAnnouncement(`${titleFor(displayedPathRef.current)} closed. Home.`);
        // Consumed — clear only now. Clearing unconditionally on every
        // settle (including forward turns) was a real bug: it wiped the
        // opener before the eventual reverse turn ever got to use it.
        openerRef.current = null;
      } else {
        setAnnouncement(`${titleFor(nextPath)} module opened.`);
      }

      displayedPathRef.current = nextPath;
      setDisplayedPath(nextPath);
      setTurn("none");
      busyRef.current = false;
      setBusy(false);

      // Reconcile a navigation that arrived mid-turn (browser back/forward
      // cannot be blocked, so the driver queued it instead of starting a
      // second concurrent turn).
      const pending = pendingPathRef.current;
      pendingPathRef.current = null;
      if (pending && pending !== nextPath) {
        const queuedTurn = resolveTurn(nextPath, pending);
        if (queuedTurn !== "none") start(queuedTurn, pending);
      }
    };

    if (reducedMotionRef.current) {
      settle();
    } else {
      setTimeout(settle, SETTLE_MS);
    }
  }, []);

  useLayoutEffect(() => {
    const nextPath = location.pathname;
    const nextTurn = resolveTurn(displayedPathRef.current, nextPath);
    if (nextTurn === "none") return;

    const initiatedByGo = viaGoRef.current;
    viaGoRef.current = false;

    if (!initiatedByGo) {
      // Typed URL / browser back-forward — no reliable opener, and this
      // path did not already claim the busy flag the way go() does.
      openerRef.current = null;
      if (busyRef.current) {
        pendingPathRef.current = nextPath;
        return;
      }
    }

    start(nextTurn, nextPath);
  }, [location.pathname, start]);

  const go = useCallback(
    (path: string, opener?: HTMLElement | null) => {
      // Busy guard's *initiation* half: claimed synchronously here, not
      // deferred to the effect, so a second go() call in the same tick
      // (rapid double-click/double-open) is a true no-op — the second
      // navigate() never even fires.
      if (busyRef.current) return;
      if (resolveTurn(displayedPathRef.current, path) === "none") return;

      busyRef.current = true;
      setBusy(true);
      if (opener !== undefined) openerRef.current = opener;
      viaGoRef.current = true;
      navigate(path);
    },
    [navigate],
  );

  const layerMounted = useMemo(
    () => location.pathname !== "/" || displayedPath !== "/",
    [location.pathname, displayedPath],
  );

  const value = useMemo<TurnContextValue>(
    () => ({
      busy,
      turn,
      displayedPath,
      layerMounted,
      announcement,
      go,
      registerShell,
      registerTitle,
    }),
    [busy, turn, displayedPath, layerMounted, announcement, go, registerShell, registerTitle],
  );

  return <TurnContext.Provider value={value}>{children}</TurnContext.Provider>;
}
