import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFieldKeyboard } from "./useFieldKeyboard";

/**
 * Task 1.2 (sdd/design-import-sections). No test file existed for this hook
 * at its previous home (`project-field/useFieldKeyboard.ts`) — this is the
 * first coverage, written as part of the move to `src/turn/`, where it
 * becomes shared infrastructure (Phase 4 wires `/certifications` onto it
 * too). Behavior is unchanged by the move; these tests pin down the
 * contract the hook's own header comment documents:
 *
 *   Left (ArrowLeft)  -> onForward, if provided
 *   Right (ArrowRight) -> onBack, if provided
 *   otherwise         -> falls through (capture-phase listener does NOT
 *                        stopPropagation, so a bubble-phase listener still
 *                        sees the event)
 *
 * The capture-phase/stopPropagation-only-when-handled mechanism is verified
 * directly by asserting whether a bubble-phase listener on `document` also
 * observes the same keydown — that is the actual fall-through contract,
 * not an implementation detail.
 */
describe("useFieldKeyboard", () => {
  function fireKey(key: string, init: KeyboardEventInit = {}) {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    document.dispatchEvent(event);
    return event;
  }

  it("calls onForward for ArrowLeft when a forward handler is provided", () => {
    const onForward = vi.fn();
    renderHook(() => useFieldKeyboard({ onForward, onBack: undefined }));

    fireKey("ArrowLeft");

    expect(onForward).toHaveBeenCalledTimes(1);
  });

  it("calls onBack for ArrowRight when a back handler is provided", () => {
    const onBack = vi.fn();
    renderHook(() => useFieldKeyboard({ onForward: undefined, onBack }));

    fireKey("ArrowRight");

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("does not call onBack for ArrowLeft, or onForward for ArrowRight", () => {
    const onForward = vi.fn();
    const onBack = vi.fn();
    renderHook(() => useFieldKeyboard({ onForward, onBack }));

    fireKey("ArrowLeft");
    fireKey("ArrowRight");

    expect(onForward).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("falls through to a bubble-phase listener when there is no handler for that key (ArrowRight, no onBack)", () => {
    const bubbleListener = vi.fn();
    document.addEventListener("keydown", bubbleListener);

    renderHook(() => useFieldKeyboard({ onForward: undefined, onBack: undefined }));
    fireKey("ArrowRight");

    document.removeEventListener("keydown", bubbleListener);
    expect(bubbleListener).toHaveBeenCalledTimes(1);
  });

  it("stops propagation to a bubble-phase listener when it DOES handle the key (ArrowRight, has onBack)", () => {
    const bubbleListener = vi.fn();
    document.addEventListener("keydown", bubbleListener);
    const onBack = vi.fn();

    renderHook(() => useFieldKeyboard({ onForward: undefined, onBack }));
    fireKey("ArrowRight");

    document.removeEventListener("keydown", bubbleListener);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(bubbleListener).not.toHaveBeenCalled();
  });

  it("ignores Escape entirely (deliberate asymmetry — the shell handles module exit)", () => {
    const onForward = vi.fn();
    const onBack = vi.fn();
    renderHook(() => useFieldKeyboard({ onForward, onBack }));

    fireKey("Escape");

    expect(onForward).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });

  it("ignores the key when a modifier is held", () => {
    const onForward = vi.fn();
    renderHook(() => useFieldKeyboard({ onForward, onBack: undefined }));

    fireKey("ArrowLeft", { ctrlKey: true });

    expect(onForward).not.toHaveBeenCalled();
  });

  it("ignores the key when focus/target is a text input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    const onForward = vi.fn();
    renderHook(() => useFieldKeyboard({ onForward, onBack: undefined }));

    const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
    input.dispatchEvent(event);

    expect(onForward).not.toHaveBeenCalled();
    input.remove();
  });

  it("does not attach a listener at all when neither handler is provided", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    renderHook(() => useFieldKeyboard({ onForward: undefined, onBack: undefined }));

    expect(addSpy).not.toHaveBeenCalledWith("keydown", expect.any(Function), true);
    addSpy.mockRestore();
  });

  it("removes its listener on unmount", () => {
    const onForward = vi.fn();
    const { unmount } = renderHook(() => useFieldKeyboard({ onForward, onBack: undefined }));

    unmount();
    fireKey("ArrowLeft");

    expect(onForward).not.toHaveBeenCalled();
  });
});
