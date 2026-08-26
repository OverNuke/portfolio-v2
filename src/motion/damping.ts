/**
 * Frame-rate-independent exponential smoothing, extracted from the rAF loop
 * `OptionWheel.tsx` already ran (`runFrame`, ~L248-259): `k = 1 - e^(-dt/tau)`
 * moves `current` toward `target` by the same fraction regardless of how long
 * the frame actually took, so a slow frame doesn't overshoot and a fast one
 * doesn't stall. `dockHover`'s per-plate easing (`ChannelField.tsx`) is the
 * second consumer; `OptionWheel` itself is not yet migrated onto this (still
 * has its own inlined copy) — a follow-up, not part of this change.
 *
 * `dt` and `tau` are both in seconds. `dt` should already be clamped by the
 * caller (`OptionWheel` clamps to 0.05s to survive a backgrounded tab).
 */
export function dampStep(current: number, target: number, dt: number, tau: number): number {
  const k = 1 - Math.exp(-dt / Math.max(tau, 0.001));
  return current + (target - current) * k;
}

/** Same `< 0.001` threshold `OptionWheel` uses to decide a value has
 * settled and stop re-arming its rAF loop. */
export function isSettled(current: number, target: number): boolean {
  return Math.abs(target - current) < 0.001;
}
