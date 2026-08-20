import { Panel } from "../components/panel/Panel";
import { ChannelField } from "../components/channel-field/ChannelField";
import { ABOUT_PROFILE, SOCIAL_LINKS } from "../content/data";
import contactPlate from "../assets/plates/portrait/contact-plate.png";
import { ROUTES } from "./routes";
import "./contact-page.css";

const route = ROUTES.find((r) => r.pageId === "contact")!;

/**
 * Shipped 2026-08-20, replacing the Phase 2 placeholder.
 * Spec: `claude/contact-channel-field-2026-08-20.md`.
 *
 * The page states addresses and nothing else — no form, which is what the
 * wheel promises on the way in (`ROUTES[].lede`: "GitHub, LinkedIn, email.
 * No form, no funnel."). It deliberately does NOT print that lede again:
 * Home already shows it under the module readout, and the plates below say
 * the same thing concretely a few centimetres lower. Same call
 * `ProjectsPage` made when it dropped `.projects-page__lede`.
 *
 * The composition itself is `components/channel-field/`. Nothing about the
 * layout lives here.
 */
export function ContactPage() {
  return (
    <Panel
      metadata={<span>{route.sub}</span>}
      content={
        <div className="contact-page">
          <ChannelField
            channels={SOCIAL_LINKS}
            plate={contactPlate}
            availability={ABOUT_PROFILE.availability}
            coordinates="19.5438° N / 99.1269° W"
          />
        </div>
      }
    />
  );
}
