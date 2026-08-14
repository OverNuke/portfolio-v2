import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Panel } from "../components/panel/Panel";
import { ProjectField } from "../components/project-field/ProjectField";
import { clampField, paginate, RECORDS_PER_FIELD } from "../components/project-field/fieldLayout";
import { useFieldKeyboard } from "../components/project-field/useFieldKeyboard";
import { ABOUT_PROFILE, PROJECTS } from "../content/data";
import { ROUTES } from "./routes";
import "./projects-page.css";

const route = ROUTES.find((r) => r.pageId === "projects")!;

/** "2023—2026", or just the single year if every record shares one. */
function yearSpan(years: readonly string[]): string | undefined {
  if (years.length === 0) return undefined;
  const sorted = [...years].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? first : `${first}—${last}`;
}

/**
 * Rebuilt 2026-08-13 as an editorial field — see `ProjectField` and
 * `fieldLayout.ts`. It replaces the panel sheet (2026-08-05, rescattered
 * 2026-08-12), which put one olive panel per record on a 12x12 grid;
 * Keff's reference has no panels in it, only a band and three shapes.
 * `ProjectField.tsx`'s header comment records the full reasoning.
 *
 * The shell contract this page depends on is unchanged: docs/03_UX_
 * ARCHITECTURE.MD's "the shell never scrolls, content is always free to"
 * is why `/projects` keeps `.page-content`'s `overflow-y: auto` rather
 * than clipping. The desktop no-scroll requirement is met by the field's
 * bounded size, not by hiding overflow.
 *
 * PAGINATION LIVES IN A QUERY PARAM, NOT A PATH SEGMENT, and keeps the
 * name `?sheet=` it has always had so existing links still resolve. The
 * spec asks for `/projects/2`; App.tsx resolves both `PageLayer`'s
 * title/tag and its `<Routes location>` by exact pathname match against
 * `ROUTES`, so a second path segment falls through to NOT FOUND until the
 * turn machine's route matching is reworked — a shell change, well outside
 * this module. The query form is still a real URL: deep-linkable, and
 * browser back/forward walk the fields. Unreachable today regardless
 * (3 records, cap 5).
 */
export function ProjectsPage() {
  const [params, setParams] = useSearchParams();

  const fields = useMemo(() => paginate(PROJECTS, RECORDS_PER_FIELD), []);
  const fieldIndex = clampField(params.get("sheet"), fields.length);
  const current = fields[fieldIndex - 1] ?? [];

  const goToField = useCallback(
    (next: number) => {
      const nextParams = new URLSearchParams(params);
      if (next <= 1) nextParams.delete("sheet");
      else nextParams.set("sheet", String(next));
      setParams(nextParams);
    },
    [params, setParams],
  );

  const hasNext = fieldIndex < fields.length;
  const hasPrev = fieldIndex > 1;

  const onNext = useCallback(() => goToField(fieldIndex + 1), [goToField, fieldIndex]);
  const onPrev = useCallback(() => goToField(fieldIndex - 1), [goToField, fieldIndex]);

  // Left = forward = next field; Right = back = previous field, and only
  // when there IS one — otherwise it falls through to the shell's own
  // handler and closes the page, which is exactly the documented
  // behaviour. See useFieldKeyboard for why that fall-through is automatic.
  useFieldKeyboard({
    onForward: hasNext ? onNext : undefined,
    onBack: hasPrev ? onPrev : undefined,
  });

  const span = useMemo(() => yearSpan(PROJECTS.map((p) => p.year)), []);

  return (
    <Panel
      metadata={<span>{route.sub}</span>}
      content={
        <div className="projects-page">
          {/* `.projects-page__lede` is gone with the redesign. It printed
              `route.lede` above the composition, which Home already prints
              under the module readout, and the foot index now names all
              three projects concretely a few centimetres below it. It was
              costing roughly forty pixels of the desktop no-scroll budget
              to say something twice. */}
          <ProjectField
            projects={current}
            fieldIndex={fieldIndex}
            fieldCount={fields.length}
            totalRecords={PROJECTS.length}
            span={span}
            colophonName={`${ABOUT_PROFILE.firstName} ${ABOUT_PROFILE.lastName}`}
            colophonRole={ABOUT_PROFILE.role}
            onNext={hasNext ? onNext : undefined}
            onPrev={hasPrev ? onPrev : undefined}
            macroWord={route.short}
          />
        </div>
      }
    />
  );
}
