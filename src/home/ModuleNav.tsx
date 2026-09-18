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
export function ModuleNav() {
  const { t } = useI18n();
  return (
    <nav className="home__nav" aria-label="Module navigation">
      <ul>
        {NAV_ROUTES.map((route) => (
          <li key={route.path}>
            <Link className="home__nav-link" to={route.path} data-turn-open={route.path}>
              {t(NAV_KEY[route.path])}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
