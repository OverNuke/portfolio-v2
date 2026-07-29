import { Panel } from "../components/panel/Panel";
import { ROUTES } from "./routes";

const route = ROUTES.find((r) => r.pageId === "profile")!;

/** Task 2.1 (sdd/phase2-app-shell): placeholder only — real content ships in Phase 3. */
export function ProfilePage() {
  return (
    <Panel
      title={route.title}
      status={route.tag}
      metadata={<span>{route.sub}</span>}
      content={<p>Profile module placeholder — content ships in Phase 3.</p>}
    />
  );
}
