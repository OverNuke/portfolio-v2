import { Link } from "react-router";
import type { DictionaryKey } from "@/i18n/dictionary";
import { useI18n } from "@/i18n/I18nProvider";
import { NAV_ROUTES } from "@/routes/registry";

const NAV_KEY: Record<string, DictionaryKey> = {
  "/profile": "nav.profile",
  "/certifications": "nav.certifications",
  "/projects": "nav.projects",
  "/contact": "nav.contact",
};

// Real <Link> items in DOM order (R3) — Tab/Enter native, ArrowLeft opens
// via TurnProvider reading each item's data-turn-open (useTurnKeys.ts).
// D4: numeral and arrow are decorative aria-hidden spans, sourced from
// registry.ts's own `page` field (read-only — no parallel numbering
// scheme) — each link's accessible name is the label alone.
export function ModuleNav() {
  const { t } = useI18n();
  return (
    <nav className="home__nav" aria-label="Module navigation">
      <ul>
        {NAV_ROUTES.map((route) => (
          <li key={route.path}>
            <Link className="home__nav-link" to={route.path} data-turn-open={route.path}>
              <span className="home__nav-num" aria-hidden="true">
                {route.page}
              </span>
              <span className="home__nav-label">{t(NAV_KEY[route.path])}</span>
              <span className="home__nav-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
