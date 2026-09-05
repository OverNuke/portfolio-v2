import { Panel } from "../components/panel/Panel";
import { ProfileHero } from "../components/profile-hero";
import { ABOUT_PROFILE, PROFILE_PANELS } from "../content/data";
import { useTurn } from "../turn/useTurn";
import "./profile-page.css";

/**
 * `/profile` — re-added 2026-08-28 as PAGE 01 (removed 2026-08-12 when it
 * was folded into Home; this branch's editorial direction gave it real
 * content again). Pure adapter, like `ContactPage` / `ProjectsPage`: the
 * composition is `components/profile-hero/`, nothing about the layout lives
 * here.
 *
 * No `title` on `<Panel>` (PageLayer owns the `<h1>`) and no `metadata`
 * slot — matches every other routed page since the 2026-08-23 metadata
 * cleanup. The "open to work" chip routes to /contact through the turn
 * machine, passing its own element as the focus-return target.
 */
export function ProfilePage() {
  const { go } = useTurn();
  return (
    <Panel
      content={
        <div className="profile-page">
          <ProfileHero
            profile={ABOUT_PROFILE}
            panels={PROFILE_PANELS}
            onStatusClick={(event) => go("/contact", event.currentTarget)}
          />
        </div>
      }
    />
  );
}
