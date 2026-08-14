/**
 * The fused shape for the primary record — a square whose LEFT half is a
 * semicircular lobe, per `image_01`: round on the left, flat top and
 * bottom, a straight vertical right edge, and a registration seam where
 * the two halves meet.
 *
 * `clip-path` has no union of `polygon()` and `circle()` in one
 * declaration, so this is the only shape on the field that needs a real
 * path instead of a CSS primitive. The two smaller records are plain
 * `circle(closest-side)` in `project-field.css`.
 *
 * THE GEOMETRY, AND WHY IT IS THE NUMBERS IT IS.
 * `clipPathUnits="objectBoundingBox"` normalises the path to a 0-1 unit
 * square and then scales each axis to the element's box independently. The
 * box here is `aspect-ratio: 1` (`.pf-shape--fused`), so the two axes scale
 * by the same factor and unit-space circles stay circles. The lobe is
 * therefore a true semicircle of radius 0.5 spanning the full height,
 * apex landing exactly on the left edge, and the flat half runs from the
 * midline to the right edge.
 *
 * COUPLED WITH CSS, in two places, both of which move together or not at
 * all: `.pf-shape--fused`'s `aspect-ratio: 1` (change it and the lobe
 * becomes an ellipse), and `.pf-shape--fused::after`'s `left: 50%` (the
 * seam, which is deliberately NOT part of the clip so it is never clipped
 * away with the shape).
 *
 * Rendered once from `ProjectField.tsx`, never per record — `url(#id)`
 * clip-path references must resolve within the same document (Firefox
 * enforces this strictly), so one shared `<defs>` is correct, not wasteful.
 */
export function FieldShapeDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <clipPath id="pf-fused" clipPathUnits="objectBoundingBox">
          <path d="M1,0 H0.5 A0.5,0.5 0 0 0 0.5,1 H1 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}
