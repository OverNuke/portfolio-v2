import { useEffect, useRef, useState, type RefObject } from "react";

export type StageMode = "scaled" | "reflow";

export interface StageScale {
  stageRef: RefObject<HTMLDivElement>;
  scale: number;
  mode: StageMode;
}

const DESIGN_WIDTH = 1440;
const REFLOW_BREAKPOINT = 1100;

// Scale/reflow boundary (D8): >=1100px mirrors the mockup's fixed-1440
// transform, clamped to never upscale; below it, sections render a real
// flow layout instead. A zero-width stage bails and keeps the last mode.
export function useStageScale(): StageScale {
  const stageRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ scale: number; mode: StageMode }>({ scale: 1, mode: "reflow" });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.clientWidth;
      if (!width) return;
      const mode: StageMode = width < REFLOW_BREAKPOINT ? "reflow" : "scaled";
      const scale = mode === "scaled" ? Math.min(1, width / DESIGN_WIDTH) : 1;
      setState({ scale, mode });
    };

    measure();
    window.addEventListener("resize", measure);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  return { stageRef, ...state };
}
