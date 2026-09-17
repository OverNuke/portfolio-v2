import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStageScale } from "./useStageScale";

function stubWidth(el: HTMLElement, width: number) {
  Object.defineProperty(el, "clientWidth", { configurable: true, value: width });
}

function Probe({ onReady }: { onReady: (v: ReturnType<typeof useStageScale>) => void }) {
  const stage = useStageScale();
  onReady(stage);
  return <div ref={stage.stageRef} data-testid="stage" />;
}

describe("useStageScale", () => {
  it("bails on a zero-width stage and stays in reflow mode", () => {
    let last: ReturnType<typeof useStageScale> | undefined;
    render(<Probe onReady={(v) => (last = v)} />);
    expect(last?.mode).toBe("reflow");
    expect(last?.scale).toBe(1);
  });

  it("switches to reflow below the 1100px breakpoint", () => {
    let last: ReturnType<typeof useStageScale> | undefined;
    const { getByTestId } = render(<Probe onReady={(v) => (last = v)} />);
    const stage = getByTestId("stage");
    stubWidth(stage, 800);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(last?.mode).toBe("reflow");
  });

  it("switches to scaled mode clamped to <=1 at/above 1100px", () => {
    let last: ReturnType<typeof useStageScale> | undefined;
    const { getByTestId } = render(<Probe onReady={(v) => (last = v)} />);
    const stage = getByTestId("stage");
    stubWidth(stage, 1440);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(last?.mode).toBe("scaled");
    expect(last?.scale).toBe(1);

    stubWidth(stage, 1200);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(last?.mode).toBe("scaled");
    expect(last?.scale).toBeCloseTo(1200 / 1440, 5);
  });
});
