import { type MouseEvent, useRef, useState } from "react";
import type { AboutProfile, ProfilePanel } from "../../content/types";
import { useReducedMotion } from "../../shell/useReducedMotion";
import { useInert } from "../../turn/useInert";
import { ProfilePanelLightbox } from "./ProfilePanelLightbox";
import "./profile-hero.css";

export interface ProfileHeroProps {
  profile: AboutProfile;
  panels: ProfilePanel[];
  /** Fired by the "open to work" chip — the page's one Oxblood control. */
  onStatusClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * The /profile hero — an identity type stack beside a four-panel manga
 * collage, after the mockup (`Profile Page UI Mockups`, variant 3a). What
 * the mockup keeps: the two-column split, the exact `clip-path` polygons
 * and diagonal gutter sweep, identity-then-collage reading order, and
 * click-a-panel-to-enlarge. What it drops: the green accent, the display
 * fonts, the paper-tooth texture, rounded corners, and every rotation past
 * `--rot-max`. See `docs/12_COLLAGE_SYSTEM.md` and `profile-hero.css`.
 *
 * Accessibility contract (mirrors `ProfilePlate`):
 * - The name `<h2>` is a real heading; its accessible name is
 *   `profile.fullName` via a visually-hidden span. The three painted
 *   display lines are `aria-hidden` typography.
 * - Each panel is a real `<button>` (the mockup's are keyboard-dead
 *   `<div>`s — the fix its own README asks for); the accessible name is
 *   the portrait's real `alt` plus a hidden "enlarge" hint. Captions and
 *   the manga "SFX" overlays are `aria-hidden` print chrome.
 * - The "open to work" chip is the one Oxblood control, on the paper
 *   margin, never on a plate (oxblood on olive is 1.90:1). It routes to
 *   /contact via `onStatusClick`.
 * - While the lightbox is open, `.profile-hero__body` is `inert` — the
 *   same inert-the-siblings modal-ness `ProjectField`'s record zoom uses,
 *   so no second `aria-modal` is nested inside PageLayer's.
 */
export function ProfileHero({ profile, panels, onStatusClick }: ProfileHeroProps) {
  const reducedMotion = useReducedMotion();
  const [openPanel, setOpenPanel] = useState<ProfilePanel | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useInert(bodyRef, openPanel !== null);

  function openLightbox(panel: ProfilePanel, event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setOpenPanel(panel);
  }

  // Paint three display lines from the whole name — first name, then the
  // two surnames ("Kevin" / "Frías" / "García"). The accessible name stays
  // the untouched `fullName` in a visually-hidden span, so a screen reader
  // never reads these fragments.
  const nameWords = profile.fullName.split(/\s+/).filter(Boolean);
  const displayLines =
    nameWords.length >= 3
      ? [nameWords[0], nameWords[nameWords.length - 2], nameWords[nameWords.length - 1]]
      : nameWords;

  return (
    <div className="profile-hero" data-motion={reducedMotion ? "reduced" : "full"}>
      <div className="profile-hero__body" ref={bodyRef}>
        <div className="profile-hero__identity">
          <p className="profile-hero__eyebrow" aria-hidden="true">
            <span>Profile · 2026</span>
            {profile.establishedNote ? <span>{profile.establishedNote}</span> : null}
          </p>

          <h2 className="profile-hero__name">
            <span className="visually-hidden">{profile.fullName}</span>
            {displayLines.map((line, i) => (
              <span
                key={line + i}
                aria-hidden="true"
                className={
                  i === 1 ? "profile-hero__name-line profile-hero__name-line--outline" : "profile-hero__name-line"
                }
              >
                {line}
              </span>
            ))}
          </h2>

          {/* Identity facts. The availability line lives on the Oxblood
              chip below (which also routes to /contact), not here — one
              statement of it per screen. */}
          <p className="profile-hero__ribbon">
            <span>{profile.role}</span>
            <span>{profile.location}</span>
          </p>

          <p className="profile-hero__bio">{profile.bio}</p>

          <CvAffordance cv={profile.cv} />

          {profile.creed ? (
            <p className="profile-hero__creed" aria-hidden="true">
              {profile.creed}
            </p>
          ) : null}

          {/* Print chrome — the h2 above already carries the name as the
              page's accessible identity, so every part here is aria-hidden.
              Broken first-name / surnames, like the mockup's colophon. */}
          <p className="profile-hero__colophon" aria-hidden="true">
            <span className="profile-hero__colophon-name">
              {nameWords.slice(0, 2).join(" ")}
              <br />
              {nameWords.slice(2).join(" ")}
            </span>
            {profile.nickname ? (
              <span className="profile-hero__colophon-mark">{profile.nickname}</span>
            ) : null}
          </p>
        </div>

        <div className="profile-hero__stage">
          {panels.map((panel) => (
            <button
              key={panel.id}
              type="button"
              className="profile-hero__panel"
              data-panel-id={panel.id}
              onClick={(event) => openLightbox(panel, event)}
            >
              <span className="profile-hero__panel-paper">
                <img src={panel.image} alt={panel.alt} />
              </span>
              <span className="visually-hidden"> — enlarge</span>
              {panel.caption ? (
                <span className="profile-hero__panel-cap" aria-hidden="true">
                  {panel.caption}
                </span>
              ) : null}
            </button>
          ))}

          {panels
            .filter((panel) => panel.handle)
            .map((panel) => (
              <span
                key={panel.id}
                className="profile-hero__sfx"
                data-sfx={panel.id}
                aria-hidden="true"
              >
                {panel.handle}
              </span>
            ))}
        </div>
      </div>

      {onStatusClick ? (
        <div className="profile-hero__margin">
          <button type="button" className="profile-hero__status" onClick={onStatusClick}>
            {profile.availability}
          </button>
        </div>
      ) : null}

      {openPanel ? (
        <ProfilePanelLightbox
          panel={openPanel}
          onClose={() => setOpenPanel(null)}
          returnFocusTo={openerRef.current}
        />
      ) : null}
    </div>
  );
}

/**
 * The CV slot. With no `cv` it renders a non-link chip that holds its
 * place until a real one-page PDF lands — the `SocialLink.unresolved`
 * convention ("the safe state is the default one"). With `cv` it becomes a
 * real link that opens in a new tab (no repo uses a `download` attribute).
 */
function CvAffordance({ cv }: { cv?: AboutProfile["cv"] }) {
  if (!cv) {
    return (
      <div className="profile-hero__cv">
        <span className="k">CV</span>
        <span className="v">Not published yet</span>
      </div>
    );
  }
  return (
    <a className="profile-hero__cv" href={cv.href} target="_blank" rel="noopener noreferrer">
      <span className="k">Download CV</span>
      <span className="v">
        {cv.note} <span className="visually-hidden">(opens in a new tab)</span>
      </span>
    </a>
  );
}
