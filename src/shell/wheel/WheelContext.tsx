import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * `ModuleWheel` owns the actual gate state (`useWheelGate`, colocated with
 * the `OptionWheel` ref it has to drive) — that cannot move up to
 * `AppShell` without separating the imperative wheel handle from the state
 * that decides when to call it. What DOES need to live above `ModuleWheel`
 * is a read of its `open` value, because two things outside it need it:
 *
 *   - `useTurnKeyboard` (invoked from `Shell`, a DOM sibling of
 *     `ModuleWheel` now that the wheel is promoted out of `.shell`) has to
 *     skip its own Escape/ArrowRight handling while the wheel is open, so
 *     the wheel closes first instead of racing the page closed underneath
 *     it.
 *   - anything else that wants to react to "is the global nav open" without
 *     being inside `ModuleWheel`'s own subtree.
 *
 * So this is a mirror, not a second source of truth: `ModuleWheelProvider`
 * holds the boolean and a setter; `ModuleWheel` pushes its local
 * `useWheelGate().open` into it on every change (see its `useEffect`), the
 * same shape as the `onOpenChange` prop `Canvas` used to read before the
 * wheel left its subtree.
 */

interface WheelContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const WheelContext = createContext<WheelContextValue | null>(null);

export function WheelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <WheelContext.Provider value={{ open, setOpen }}>{children}</WheelContext.Provider>;
}

function useWheelContext(): WheelContextValue {
  const ctx = useContext(WheelContext);
  if (!ctx) {
    throw new Error("useWheelContext must be used within a WheelProvider");
  }
  return ctx;
}

/** Read-only: is the global module wheel currently open? */
export function useWheelOpen(): boolean {
  return useWheelContext().open;
}

/** Write-only: `ModuleWheel` publishes its local gate state here. */
export function useSetWheelOpen(): (open: boolean) => void {
  return useWheelContext().setOpen;
}
