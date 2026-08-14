/**
 * Fused shape for the feature disc — a circle whose left half is squared
 * off, per the editorial reference (`image_01`): flat left/top/bottom
 * edges up to the midline, a semicircular lobe carrying the rest.
 *
 * `clip-path` has no union of `polygon()` + `circle()` in one declaration,
 * so this is the one shape on the sheet that needs a real path instead of
 * a CSS primitive. `clipPathUnits="objectBoundingBox"` normalizes the path
 * to the 0–1 unit square and stretches it to whatever box uses
 * `clip-path: url(#ps-fused)` — here, `.sheet-disc--fused`.
 *
 * COUPLED WITH CSS: a true semicircular lobe spanning the full height
 * needs radius >= 0.5 (half the vertical chord), which is why the flat
 * portion stops at x=0.58 rather than a rounder number — at r=0.5 the arc
 * reaches x=1.08, matching `.sheet-disc--fused`'s `aspect-ratio: 1.08` in
 * `project-sheet.css`. Changing either number without the other skews the
 * shape (a narrower aspect-ratio truncates the lobe's tip; a flatter
 * radius stops reaching the right edge at all).
 *
 * Rendered once from `ProjectSheet.tsx`, not per panel — `url(#id)`
 * clip-path references must resolve within the same document (a
 * requirement Firefox enforces strictly), so one shared `<defs>` is
 * correct, not wasteful.
 */
export function SheetShapeDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={0}
      height={0}
      style={{ position: "absolute" }}
    >
      <defs>
        <clipPath id="ps-fused" clipPathUnits="objectBoundingBox">
          <path d="M0,0 H0.58 A0.5,0.5 0 0 1 0.58,1 H0 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}
