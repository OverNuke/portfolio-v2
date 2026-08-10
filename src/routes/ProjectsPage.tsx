import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Panel } from "../components/panel/Panel";
import { ProjectSheet } from "../components/project-sheet/ProjectSheet";
import { clampSheet, paginate, RECORDS_PER_SHEET } from "../components/project-sheet/sheetLayout";
import { useSheetKeyboard } from "../components/project-sheet/useSheetKeyboard";
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
 * Rebuilt 2026-08-05 as a panel sheet — see `ProjectSheet` and the project
 * doc `claude/projects-module-manga-sheet-2026-08-05.md`.
 *
 * The old `projects-page__grid` list extended horizontally because Home's
 * no-scroll rule had been applied one level too far. docs/03_UX_ARCHITECTURE.MD
 * settles it: "the shell never scrolls, content is always free to." A module
 * page was never bound by Home's constraint, so the list was solving a
 * problem the architecture had already solved.
 *
 * PAGINATION LIVES IN A QUERY PARAM, NOT A PATH SEGMENT. The spec asks for
 * `/projects/2`; this ships `?sheet=2` instead, deliberately. App.tsx
 * resolves both `PageLayer`'s title/tag and its `<Routes location>` by
 * exact pathname match against `ROUTES`, so a second path segment would
 * fall through to NOT FOUND until the turn machine's route matching is
 * reworked — a shell change, well outside a module wiring pass. The query
 * form is still a real URL: deep-linkable, and browser back/forward walk
 * the sheets. Flagged in the doc's open items.
 */
export function ProjectsPage() {
  const [params, setParams] = useSearchParams();

  const sheets = useMemo(() => paginate(PROJECTS, RECORDS_PER_SHEET), []);
  const sheetIndex = clampSheet(params.get("sheet"), sheets.length);
  const current = sheets[sheetIndex - 1] ?? [];

  const goToSheet = useCallback(
    (next: number) => {
      const nextParams = new URLSearchParams(params);
      if (next <= 1) nextParams.delete("sheet");
      else nextParams.set("sheet", String(next));
      setParams(nextParams);
    },
    [params, setParams],
  );

  const hasNext = sheetIndex < sheets.length;
  const hasPrev = sheetIndex > 1;

  const onNext = useCallback(() => goToSheet(sheetIndex + 1), [goToSheet, sheetIndex]);
  const onPrev = useCallback(() => goToSheet(sheetIndex - 1), [goToSheet, sheetIndex]);

  // Left = forward = next sheet; Right = back = previous sheet, and only
  // when there IS one — otherwise it falls through to the shell's own
  // handler and closes the page, which is exactly the documented
  // behaviour. See useSheetKeyboard for why that fall-through is automatic.
  useSheetKeyboard({
    onForward: hasNext ? onNext : undefined,
    onBack: hasPrev ? onPrev : undefined,
  });

  const span = useMemo(() => yearSpan(PROJECTS.map((p) => p.year)), []);

  return (
    <Panel
      metadata={<span>{route.sub}</span>}
      content={
        <div className="projects-page">
          <ProjectSheet
            projects={current}
            sheetIndex={sheetIndex}
            sheetCount={sheets.length}
            totalRecords={PROJECTS.length}
            span={span}
            colophonName={`${ABOUT_PROFILE.firstName} ${ABOUT_PROFILE.lastName}`}
            colophonRole={ABOUT_PROFILE.role}
            onNext={hasNext ? onNext : undefined}
            onPrev={hasPrev ? onPrev : undefined}
          />
        </div>
      }
    />
  );
}
