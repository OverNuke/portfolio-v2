import { Panel } from "../components/panel/Panel";
import { ABOUT_PROFILE } from "../content/data";
import { useTurn } from "../turn/useTurn";
import { ROUTES } from "./routes";
import "./profile-page.css";

const route = ROUTES.find((r) => r.pageId === "profile")!;

export function ProfilePage() {
  const { go } = useTurn();
  const profile = ABOUT_PROFILE;

  return (
    <Panel
      title={route.title}
      status={route.tag}
      metadata={<span>{route.sub}</span>}
      content={
        <div className="profile-page">
          <div className="plate--flat profile-page__identity">
            <h3 className="profile-page__name">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="profile-page__role">{profile.role}</p>
          </div>

          <p className="profile-page__bio">{profile.bio}</p>
          <p className="profile-page__body">{profile.bodyText}</p>

          <ul className="profile-page__specs">
            <li>
              <span className="bar">
                <span className="k">Status</span>
                <span className="v">{profile.status}</span>
              </span>
            </li>
            <li>
              <span className="bar">
                <span className="k">Location</span>
                <span className="v">{profile.location}</span>
              </span>
            </li>
            <li>
              <span className="bar">
                <span className="k">Open to</span>
                <span className="v">{profile.openTo}</span>
              </span>
            </li>
          </ul>

          <div className="profile-page__actions">
            <button
              type="button"
              className="bar bar--accent"
              onClick={(event) => go(profile.ctaPrimary.href, event.currentTarget)}
            >
              <span className="v">{profile.ctaPrimary.label}</span>
            </button>
            <button
              type="button"
              className="bar"
              onClick={(event) => go(profile.ctaSecondary.href, event.currentTarget)}
            >
              <span className="v">{profile.ctaSecondary.label}</span>
            </button>
          </div>
        </div>
      }
    />
  );
}
