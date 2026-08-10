import type { MouseEvent } from "react";
import type { AboutProfile } from "../../content/types";
import { useReducedMotion } from "../../shell/useReducedMotion";
import portraitSrc from "../../assets/plates/portrait/plate-composition.png";
import "./profile-plate.css";

/**
 * Sheet 01's identity composition: one square stage, one photograph
 * underneath, two olive plates printed over it. Every fact lives on a
 * plate; the photograph carries none. That separation is what makes the
 * module extensible — new components dock to the plates or to the paper
 * margin, never onto the image.
 *
 * Accessibility contract (docs/05_ACCESSIBILITY.MD, "Decorative /
 * Auto-Playing Animations"):
 *
 * - The portrait is decorative (`alt=""`). It carries no information the
 *   heading doesn't already carry. If it ever becomes the only place some
 *   fact lives, it needs a real alt string, not a caption.
 * - The wordmark is a real heading. `profile.mark` ("K.S" / "F.G") is
 *   decorative typography, so both fragments are aria-hidden and the
 *   accessible name comes from a visually-hidden full name — otherwise a
 *   screen reader announces "K dot S, F dot G".
 * - The `[01]`/`[02]`/`[03]`/year registration marks are aria-hidden. They
 *   are print chrome; every fact they sit beside is real DOM text.
 * - The seam is aria-hidden and pointer-events: none. The film-grain
 *   texture is NOT rendered here — it used to be plate-local, but the
 *   stage's `overflow: hidden` + `isolation: isolate` clipped it at the
 *   stage edge, producing a visible seam against the flat paper margin
 *   below. It now lives as a page-level layer in `profile-page.css`
 *   (`::before`/`::after` on the Profile panel), covering the stage and
 *   the margin as one continuous texture.
 *
 * The status chip is a real button — the sheet's only call to action,
 * mirroring Home's `.hm-status` chip (`src/shell/collage/Canvas.tsx`,
 * `home.css`), which sends the visitor to /contact the same way. It's the
 * only oxblood on the sheet and deliberately sits on the paper margin
 * rather than on a plate: oxblood on Field Olive is 1.90:1.
 */
export interface ProfilePlateProps {
  profile: AboutProfile;
  /** Rendered inside the status chip. Omitted → no chip, which is a valid sheet. */
  statusLabel?: string;
  /** Printed in the plate's bottom-left corner. */
  year?: string;
  /** Required whenever `statusLabel` is set — the chip is a real button. */
  onStatusClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function ProfilePlate({ profile, statusLabel, year = "2026", onStatusClick }: ProfilePlateProps) {
  const reducedMotion = useReducedMotion();
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const [markTop, markBottom] = profile.mark;

  return (
    <div className="profile-plate" data-motion={reducedMotion ? "reduced" : "full"}>
      <div className="profile-plate__portrait">
        <img src={portraitSrc} alt="" />
      </div>

      <div className="profile-plate__seam" aria-hidden="true" />

      <div className="profile-plate__plate profile-plate__plate--data">
        <span className="profile-plate__tick" aria-hidden="true">
          [01]
        </span>

        <div className="profile-plate__field">
          <span className="profile-plate__tick" aria-hidden="true">
            [02]
          </span>
          <p className="profile-plate__summary">{profile.summary}</p>
          <ul className="profile-plate__meta">
            <li>{profile.role}</li>
            <li>{profile.location}</li>
            <li>{profile.openTo}</li>
          </ul>
        </div>

        <div className="profile-plate__footrow" aria-hidden="true">
          <span>{year}</span>
          <span>[03]</span>
        </div>
      </div>

      <div className="profile-plate__plate profile-plate__plate--mark">
        <h3 className="profile-plate__wordmark">
          <span className="visually-hidden">{fullName}</span>
          <span aria-hidden="true">{markTop}</span>
          <span aria-hidden="true">{markBottom}</span>
        </h3>
      </div>

      {statusLabel ? (
        <button type="button" className="profile-plate__status" onClick={onStatusClick}>
          {statusLabel}
        </button>
      ) : null}
    </div>
  );
}
