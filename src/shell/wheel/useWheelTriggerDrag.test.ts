import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * sdd/animejs-wheel-trigger-drag, Phase 2/3. Targets the `DraggableParams`
 * CONTRACT passed to a mocked `createDraggable` — not click-vs-drag
 * disambiguation, which is meaningless against a mock (jsdom has no layout
 * engine; that lives in `e2e/wheel-trigger-drag.spec.ts` instead). Mirrors
 * `ModuleWheel.test.tsx`'s `vi.hoisted` mock pattern.
 */

const createDraggableMock = vi.hoisted(() => vi.fn());
const cubicBezierMock = vi.hoisted(() => vi.fn(() => "mock-ease"));

vi.mock("animejs/draggable", () => ({
  createDraggable: createDraggableMock,
}));
vi.mock("animejs", () => ({
  cubicBezier: cubicBezierMock,
}));

const { useWheelTriggerDrag } = await import("./useWheelTriggerDrag");

function makeRef() {
  const el = document.createElement("button");
  document.body.appendChild(el);
  return { current: el } as React.RefObject<HTMLButtonElement | null>;
}

describe("useWheelTriggerDrag", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let draggableInstance: any;

  beforeEach(() => {
    createDraggableMock.mockReset();
    draggableInstance = {
      x: 0,
      y: 0,
      setX: vi.fn(),
      setY: vi.fn(),
      refresh: vi.fn(),
      revert: vi.fn(),
      disable: vi.fn(),
    };
    createDraggableMock.mockReturnValue(draggableInstance);
  });

  it("wires releaseContainerFriction: 1 — the anti-overshoot control (D2)", () => {
    const ref = makeRef();
    renderHook(() => useWheelTriggerDrag(ref, { enabled: true, reducedMotion: false }));

    expect(createDraggableMock).toHaveBeenCalledTimes(1);
    const params = createDraggableMock.mock.calls[0][1];
    expect(params.releaseContainerFriction).toBe(1);
  });

  it("sets a non-spring releaseEase, duplicating --ease-hard by hand (D2)", () => {
    const ref = makeRef();
    renderHook(() => useWheelTriggerDrag(ref, { enabled: true, reducedMotion: false }));

    const params = createDraggableMock.mock.calls[0][1];
    expect(cubicBezierMock).toHaveBeenCalledWith(0.7, 0, 0.3, 1);
    expect(params.releaseEase).toBe("mock-ease");
  });

  it("container is a fn that returns 4 finite numbers even before x/y are assigned (NaN guard, D1)", () => {
    const ref = makeRef();
    renderHook(() => useWheelTriggerDrag(ref, { enabled: true, reducedMotion: false }));

    const params = createDraggableMock.mock.calls[0][1];
    // {} simulates the constructor-time call, before `this.x`/`this.y` exist.
    const bounds = params.container({});
    expect(bounds).toHaveLength(4);
    for (const n of bounds) {
      expect(Number.isFinite(n)).toBe(true);
    }
  });

  it("container fn survives x/y ACCESSORS that throw, not just missing properties", () => {
    // The real `Draggable#x`/`#y` are getters that read internal state
    // (`this.animate[this.xProp]()`) not assigned until later in the
    // constructor — the construction-time call THROWS, it doesn't just
    // read `undefined`. A plain `{}` (the previous test) can't reproduce
    // that; this mimics it directly.
    const ref = makeRef();
    renderHook(() => useWheelTriggerDrag(ref, { enabled: true, reducedMotion: false }));

    const params = createDraggableMock.mock.calls[0][1];
    const throwingInstance = {
      get x(): number {
        throw new Error("Cannot read properties of undefined (reading 'undefined')");
      },
      get y(): number {
        throw new Error("Cannot read properties of undefined (reading 'undefined')");
      },
    };
    const bounds = params.container(throwingInstance);
    expect(bounds).toHaveLength(4);
    for (const n of bounds) {
      expect(Number.isFinite(n)).toBe(true);
    }
  });

  it("pins containerPadding to --space-xs (8, tokens.css:99)", () => {
    const ref = makeRef();
    renderHook(() => useWheelTriggerDrag(ref, { enabled: true, reducedMotion: false }));

    const params = createDraggableMock.mock.calls[0][1];
    expect(params.containerPadding).toBe(8);
  });

  it("reduced-motion zeroes the velocity trio for a deterministic instant settle (D4)", () => {
    const ref = makeRef();
    renderHook(() => useWheelTriggerDrag(ref, { enabled: true, reducedMotion: true }));

    const params = createDraggableMock.mock.calls[0][1];
    expect(params.velocityMultiplier).toBe(0);
    expect(params.maxVelocity).toBe(0);
    expect(params.minVelocity).toBe(0);
  });

  it("leaves the velocity trio at library defaults when motion is not reduced", () => {
    const ref = makeRef();
    renderHook(() => useWheelTriggerDrag(ref, { enabled: true, reducedMotion: false }));

    const params = createDraggableMock.mock.calls[0][1];
    expect(params.velocityMultiplier).toBeUndefined();
    expect(params.maxVelocity).toBeUndefined();
    expect(params.minVelocity).toBeUndefined();
  });

  it("cleanup calls revert(), never disable() (D6)", () => {
    const ref = makeRef();
    const { unmount } = renderHook(() =>
      useWheelTriggerDrag(ref, { enabled: true, reducedMotion: false }),
    );

    unmount();

    expect(draggableInstance.revert).toHaveBeenCalledTimes(1);
    expect(draggableInstance.disable).not.toHaveBeenCalled();
  });

  it("does nothing when disabled (wheel open) — no Draggable is created", () => {
    const ref = makeRef();
    renderHook(() => useWheelTriggerDrag(ref, { enabled: false, reducedMotion: false }));

    expect(createDraggableMock).not.toHaveBeenCalled();
  });

  it("persists the released offset and restores it via setX/setY on remount", () => {
    const ref = makeRef();
    const { rerender } = renderHook(
      ({ enabled }) => useWheelTriggerDrag(ref, { enabled, reducedMotion: false }),
      { initialProps: { enabled: true } },
    );

    const onRelease = createDraggableMock.mock.calls[0][1].onRelease;
    act(() => {
      onRelease({ x: 40, y: -12 });
    });

    // Simulates the button's own unmount (wheel opens) then remount (wheel
    // closes again) — the offset ref must survive it.
    rerender({ enabled: false });
    rerender({ enabled: true });

    expect(draggableInstance.setX).toHaveBeenCalledWith(40, true);
    expect(draggableInstance.setY).toHaveBeenCalledWith(-12, true);
  });

  it("re-clamps the stored offset on window resize via refresh() + setX/setY", () => {
    const ref = makeRef();
    renderHook(() => useWheelTriggerDrag(ref, { enabled: true, reducedMotion: false }));

    draggableInstance.setX.mockClear();
    draggableInstance.setY.mockClear();

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(draggableInstance.refresh).toHaveBeenCalledTimes(1);
    expect(draggableInstance.setX).toHaveBeenCalledWith(0, true);
    expect(draggableInstance.setY).toHaveBeenCalledWith(0, true);
  });

  it("removes the resize listener on cleanup", () => {
    const ref = makeRef();
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() =>
      useWheelTriggerDrag(ref, { enabled: true, reducedMotion: false }),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    removeSpy.mockRestore();
  });
});
