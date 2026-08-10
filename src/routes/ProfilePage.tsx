import { Panel } from "../components/panel/Panel";
import { ProfilePlate } from "../components/profile-plate/ProfilePlate";
import { ABOUT_PROFILE } from "../content/data";
import { useTurn } from "../turn/useTurn";
import { ROUTES } from "./routes";
import sitSrc from "../assets/plates/portrait/profile-animate-sit.png";
import standSrc from "../assets/plates/portrait/profile-animate-stand.png";
import "./profile-page.css";

const route = ROUTES.find((r) => r.pageId === "profile")!;

/**
 * Rebuilt 2026-08-05 on `ProfilePlate` (see that component).
 *
 * The old identity plate + three spec bars are gone: name, role, location
 * and "open to" all live on the composition's data plate now, so repeating
 * them underneath would be duplicate DOM text, not extra information. What
 * stays below the sheet is what the plate deliberately can't hold — the
 * conversational bio (too long for the plate's 34ch measure).
 *
 * There's no separate CTA row: the plate's own status chip is the single
 * call to action, sending the visitor to /contact the same way Home's
 * `.hm-status` chip does (`src/shell/collage/Canvas.tsx`).
 *
 * The two flanking figures (`profile-animate-sit`/`-stand`) are pure
 * atmosphere in the gutters beside the sheet — `aria-hidden`, no
 * information they alone carry, hidden once the viewport is too narrow for
 * gutters to exist at all (`profile-page.css`).
 */
export function ProfilePage() {
  const { go } = useTurn();
  const profile = ABOUT_PROFILE;

  return (
    <Panel
      metadata={<span>{route.sub}</span>}
      content={
        <div className="profile-page">
          <img className="profile-page__silhouette profile-page__silhouette--sit" src={sitSrc} alt="" aria-hidden="true" />
          <img className="profile-page__silhouette profile-page__silhouette--stand" src={standSrc} alt="" aria-hidden="true" />

          <ProfilePlate
            profile={profile}
            statusLabel={profile.status}
            onStatusClick={(event) => go("/contact", event.currentTarget)}
          />

          <div className="profile-page__margin">
            <p className="profile-page__bio">{profile.bio}</p>
            <p className="profile-page__body">{profile.bodyText}</p>
          </div>
        </div>
      }
    />
  );
}
