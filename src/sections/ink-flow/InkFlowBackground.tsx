import { motionAttr, useReducedMotion } from "@/a11y/useReducedMotion";
import "./ink-flow.css";

// D9: full CSS-only ambient field (11 gradient layers, 2 SVG filters, 5
// keyframes), ported verbatim from docs/design-canvas/Ink Flow Background
// .dc.html. Fully aria-hidden, carries no information, static JSX (no
// props/lifecycle) — see ink-flow.css for the layer geometry itself.
export function InkFlowBackground() {
  const reduced = useReducedMotion();
  return (
    <div className="ink-flow" aria-hidden="true" data-motion={motionAttr(reduced)}>
      <svg className="ink-flow__filters" aria-hidden="true">
        <filter id="ifWarp" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0055 0.0085" numOctaves={3} seed={9} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={120} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="ifWarpSoft" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.007 0.006" numOctaves={2} seed={3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={90} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="ink-flow__mass" />

      <div className="ink-flow__rings-dark">
        <div className="ink-flow__ring ink-flow__ring--d1" />
        <div className="ink-flow__ring ink-flow__ring--d2" />
        <div className="ink-flow__ring ink-flow__ring--d3" />
        <div className="ink-flow__ring ink-flow__ring--d4" />
        <div className="ink-flow__ring ink-flow__ring--d5" />
        <div className="ink-flow__ring ink-flow__ring--d6" />
      </div>

      <div className="ink-flow__rings-light">
        <div className="ink-flow__ring ink-flow__ring--l1" />
        <div className="ink-flow__ring ink-flow__ring--l2" />
        <div className="ink-flow__ring ink-flow__ring--l3" />
      </div>

      <div className="ink-flow__dust" />
      <div className="ink-flow__lift" />
      <div className="ink-flow__grain" />
    </div>
  );
}
