export type Locale = "en" | "es";

// Grows per-section in Phase 2 (2.x.5 tasks extract each section's copy).
// This batch seeds only what Phase 1 itself needs: nav labels + the toggle.
export type DictionaryKey =
  | "nav.profile"
  | "nav.certifications"
  | "nav.projects"
  | "nav.contact"
  | "lang.toggle.label";

export type Dictionary = Record<DictionaryKey, string>;

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en: {
    "nav.profile": "Profile",
    "nav.certifications": "Distinctions",
    "nav.projects": "Projects",
    "nav.contact": "Contact",
    "lang.toggle.label": "Language",
  },
  es: {
    "nav.profile": "Perfil",
    "nav.certifications": "Distinciones",
    "nav.projects": "Proyectos",
    "nav.contact": "Contacto",
    "lang.toggle.label": "Idioma",
  },
};
