import { Panel } from "../components/panel/Panel";
import { ROUTES } from "./routes";

const route = ROUTES.find((r) => r.pageId === "contact")!;

/** Task 2.1 (sdd/phase2-app-shell): placeholder only — real content ships in Phase 3. */
export function ContactPage() {
  return (
    <Panel
      title={route.title}
      status={route.tag}
      metadata={<span>{route.sub}</span>}
      content={<p>Contact terminal placeholder — content ships in Phase 3.</p>}
    />
  );
}
