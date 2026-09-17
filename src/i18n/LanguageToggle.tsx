import { useI18n } from "./I18nProvider";
import "./lang-toggle.css";

// Real <button> pair, Tab-reachable, native Enter/Space — fixes the mockup's
// bare div[role=button] defect (R3, applied by analogy per the spec's note).
export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="lang-toggle" role="group" aria-label={t("lang.toggle.label")}>
      <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>
        EN
      </button>
      <button type="button" aria-pressed={locale === "es"} onClick={() => setLocale("es")}>
        ES
      </button>
    </div>
  );
}
