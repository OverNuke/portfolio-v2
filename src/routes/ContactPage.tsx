import { Panel } from "../components/panel/Panel";
import { ChannelField } from "../components/channel-field/ChannelField";
import { ABOUT_PROFILE, SOCIAL_LINKS } from "../content/data";
import profileAnimateStand from "../assets/plates/portrait/profile-animate-stand.png";
import profileAnimateSit from "../assets/plates/portrait/profile-animate-sit.png";
import "./contact-page.css";

/**
 * Shipped 2026-08-20, replacing the Phase 2 placeholder.
 * Spec: `docs/design-exploration/contact-channel-field-2026-08-20.md`,
 * amended by `sdd/contact-section-editorial-dock` (2026-09-05) and trimmed
 * again 2026-09-05 (Keff).
 *
 * The page states addresses and nothing else — no form. The field carries one
 * piece of editorial chrome, the `<h2>` "Reach out" masthead (hardcoded in
 * `ChannelField` because it names the ACTION, not the page).
 *
 * 2026-09-05: the `[04] — CONTACT` readout, the lede and the "channels open ·
 * Mexico" footer were removed. They were a decorative echo of the page
 * <h1>/route plus a line the module wheel already prints on the way in
 * (`ROUTES['/contact'].lede`), so nothing accessible is lost. This drops the
 * `sdd/contact-section-editorial-dock` D4 chrome and lands back on the
 * `design-import-2026-09-04` HANDOFF §1.5 call. `route.index` / `.short` /
 * `.lede` / `.sub` stay in `routes.ts` (the wheel and `NavItem` still read
 * them); they are just no longer passed here. The Panel `metadata` slot stays
 * unused.
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
