import { motionAttr, useReducedMotion } from "@/a11y/useReducedMotion";
import "./ink-flow.css";

// Accessible host only (D9/R2): fully aria-hidden, carries no information,
// exposes the data-motion observable Tier-A layers must expose. The full
// 11-layer gradient field + SVG filters land in Phase 2 task 2.1.1.
export function InkFlowBackground() {
  const reduced = useReducedMotion();
  return <div className="ink-flow" aria-hidden="true" data-motion={motionAttr(reduced)} />;
}
