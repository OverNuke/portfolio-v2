import { Panel } from "../components/panel/Panel";
import { ChannelField } from "../components/channel-field/ChannelField";
import { ABOUT_PROFILE, SOCIAL_LINKS } from "../content/data";
import profileAnimateStand from "../assets/plates/portrait/profile-animate-stand.png";
import profileAnimateSit from "../assets/plates/portrait/profile-animate-sit.png";
import "./contact-page.css";

/**
 * Shipped 2026-08-20, replacing the Phase 2 placeholder.
 * Spec: `docs/design-exploration/contact-channel-field-2026-08-20.md`.
 *
 * The page states addresses and nothing else — no form, which is what the
 * wheel promises on the way in (`ROUTES[].lede`: "GitHub, LinkedIn, email.
 * No form, no funnel."). It deliberately does NOT print that lede again:
 * Home already shows it under the module readout, and the plates below say
 * the same thing concretely a few centimetres lower. Same call
 * `ProjectsPage` made when it dropped `.projects-page__lede`.
 *
 * No `metadata` slot either (2026-08-23) — `route.sub`'s "channels open"
 * and the field's own "CH—FIELD / REV 02" / lat-long accents were spec-plate
 * dressing with no informational load, and read as ghost text against the
 * editorial direction. `route.sub` still feeds the Home nav wheel; it just
 * isn't repeated here.
 *
 * The composition itself is `components/channel-field/`. Nothing about the
 * layout lives here.
 */
export function ContactPage() {
  return (
    <Panel
      content={
        <div className="contact-page">
          <ChannelField
            channels={SOCIAL_LINKS}
            plateWide={profileAnimateStand}
            plateNarrow={profileAnimateSit}
            availability={ABOUT_PROFILE.availability}
          />
        </div>
      }
    />
  );
}
