import { render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REFORM_STAGGER, useReform } from "./useReform";

/**
 * jsdom has neither the Web Animations API nor real layout, so both are
 * stubbed: `boxes` is the fake geometry, keyed by `data-reform-id`, and
 * `animate` records what the hook asked for. Nothing here tests the
 * browser — it tests the arithmetic and the guards, which is where the
 * bugs in a FLIP actually live.
 */
const boxes = new Map<string, { x: number; y: number; w: number; h: number }>();
let animate: ReturnType<typeof vi.fn>;

function box(x: number, y: number, w: number, h: number) {
  return { x, y, w, h };
}

function Harness({ layout, readKey }: { layout: string; readKey?: () => string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReform(ref, layout, { readKey });
  return (
    <div ref={ref}>
      <div data-reform-id="plate" data-reform-rank={1} />
      <div data-reform-id="caption" data-reform-scale="none" />
      <div data-reform-id="poster" />
    </div>
  );
}

beforeEach(() => {
  boxes.clear();
  animate = vi.fn(() => ({ id: "", cancel: vi.fn() }));

  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    writable: true,
    value: animate,
  });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", {
    configurable: true,
    writable: true,
    value: () => [],
  });
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const id = this.getAttribute("data-reform-id") ?? "";
    const b = boxes.get(id) ?? box(0, 0, 0, 0);
    return {
      x: b.x,
      y: b.y,
      left: b.x,
      top: b.y,
      width: b.w,
      height: b.h,
      right: b.x + b.w,
      bottom: b.y + b.h,
      toJSON: () => ({}),
    } as DOMRect;
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useReform", () => {
  it("does not animate on first render — there is no 'before' yet", () => {
    boxes.set("plate", box(0, 0, 100, 100));
    render(<Harness layout="pc" />);
    expect(animate).not.toHaveBeenCalled();
  });

  it("inverts a move and a resize from the centre, not the corner", () => {
    boxes.set("plate", box(0, 0, 100, 100));
    const { rerender } = render(<Harness layout="pc" />);

    // The plate halves and moves: centre 50,50 -> 200,200.
    boxes.set("plate", box(175, 175, 50, 50));
    rerender(<Harness layout="phone" />);

    expect(animate).toHaveBeenCalled();
    const frames = animate.mock.calls[0][0] as Array<{ transform: string }>;
    // Centre delta is -150,-150 and the scale is 100/50 = 2. A corner
    // delta would have read -175,-175 and double-counted the size change.
    expect(frames[0].transform).toBe("translate(-150px, -150px) scale(2, 2)");
    expect(frames[1].transform).toBe("none");
  });

  it("moves a type part without scaling it", () => {
    boxes.set("caption", box(0, 0, 200, 40));
    const { rerender } = render(<Harness layout="pc" />);

    boxes.set("caption", box(0, 300, 100, 80));
    rerender(<Harness layout="phone" />);

    const frames = animate.mock.calls[0][0] as Array<{ transform: string }>;
    expect(frames[0].transform).toContain("scale(1, 1)");
  });

  it("staggers by rank", () => {
    boxes.set("plate", box(0, 0, 100, 100));
    const { rerender } = render(<Harness layout="pc" />);
    boxes.set("plate", box(400, 0, 100, 100));
    rerender(<Harness layout="phone" />);

    const options = animate.mock.calls[0][1] as { delay: number; fill: string };
    expect(options.delay).toBe(REFORM_STAGGER);
    // `backwards`, never `forwards`: a forwards fill would latch the final
    // transform onto the element and win over every later CSS layout.
    expect(options.fill).toBe("backwards");
  });

  it("leaves a part that has no box on one side to the cross-fade", () => {
    // The poster card does not exist above 900px. Flying it in from
    // nowhere reads worse than letting CSS fade it, so the hook skips it.
    boxes.set("poster", box(0, 0, 0, 0));
    const { rerender } = render(<Harness layout="pc" />);
    boxes.set("poster", box(0, 0, 300, 400));
    rerender(<Harness layout="phone" />);

    expect(animate).not.toHaveBeenCalled();
  });

  it("keeps the snapshot fresh while the key is not changing", () => {
    // A drag from 1600px to 1101px never re-renders — same tier — so the
    // resize refresh is what stops the eventual reform from flying the
    // parts in from wherever they were at 1600.
    boxes.set("plate", box(0, 0, 100, 100));
    const { rerender } = render(<Harness layout="pc" readKey={() => "pc"} />);

    boxes.set("plate", box(10, 0, 100, 100));
    window.dispatchEvent(new Event("resize"));

    boxes.set("plate", box(400, 0, 100, 100));
    rerender(<Harness layout="phone" readKey={() => "phone"} />);

    const frames = animate.mock.calls[0][0] as Array<{ transform: string }>;
    // -390, not -400: the refresh took, so the invert starts from where
    // the part actually was rather than from the last render.
    expect(frames[0].transform).toContain("translate(-390px, 0px)");
  });

  it("stands down on the frame that crosses the boundary", () => {
    // The regression this exists for: on an instant resize the media query
    // has already applied when the listener runs, so refreshing there
    // destroys the only record of the old layout and the reform plays
    // nothing at all. Caught in a real browser, not in review.
    boxes.set("plate", box(0, 0, 100, 100));
    const { rerender } = render(<Harness layout="pc" readKey={() => "phone"} />);

    boxes.set("plate", box(400, 0, 100, 100));
    window.dispatchEvent(new Event("resize"));
    rerender(<Harness layout="phone" readKey={() => "phone"} />);

    expect(animate).toHaveBeenCalled();
    const frames = animate.mock.calls[0][0] as Array<{ transform: string }>;
    expect(frames[0].transform).toContain("translate(-400px, 0px)");
  });

  it("does nothing at all under prefers-reduced-motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    boxes.set("plate", box(0, 0, 100, 100));
    const { rerender } = render(<Harness layout="pc" />);
    boxes.set("plate", box(400, 400, 50, 50));
    rerender(<Harness layout="phone" />);

    expect(animate).not.toHaveBeenCalled();
  });
});
