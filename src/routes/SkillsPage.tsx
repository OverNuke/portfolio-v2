import { Panel } from "../components/panel/Panel";
import { ROUTES } from "./routes";

const route = ROUTES.find((r) => r.pageId === "skills")!;

/** Task 2.1 (sdd/phase2-app-shell): placeholder only — real content ships in Phase 3. */
export function SkillsPage() {
  return (
    <Panel
      title={route.title}
      status={route.tag}
      metadata={<span>{route.sub}</span>}
      content={<p>Skills module placeholder — content ships in Phase 3.</p>}
    />
  );
}
