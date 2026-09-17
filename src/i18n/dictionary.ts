export type Locale = "en" | "es";

// Grows per-section in Phase 2 (2.x.5 tasks extract each section's copy).
// This batch seeds only what Phase 1 itself needs: nav labels + the toggle.
export type DictionaryKey =
  | "nav.profile"
  | "nav.certifications"
  | "nav.projects"
  | "nav.contact"
  | "lang.toggle.label"
  | "contact.heading"
  | "contact.status"
  | "contact.quote"
  | "contact.email.title"
  | "contact.email.cta"
  | "contact.github.title"
  | "contact.github.body1"
  | "contact.github.body2"
  | "contact.github.cta"
  | "contact.linkedin.title"
  | "contact.linkedin.body1"
  | "contact.linkedin.body2"
  | "contact.linkedin.cta";

export type Dictionary = Record<DictionaryKey, string>;

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en: {
    "nav.profile": "Profile",
    "nav.certifications": "Distinctions",
    "nav.projects": "Projects",
    "nav.contact": "Contact",
    "lang.toggle.label": "Language",
    "contact.heading": "Reach out",
    "contact.status": "open to work",
    "contact.quote": "Even an hundred of years isn't enough to appreciate what life is mean to be.",
    "contact.email.title": "Email",
    "contact.email.cta": "send message",
    "contact.github.title": "GitHub",
    "contact.github.body1": "@overnuke",
    "contact.github.body2": "repositories",
    "contact.github.cta": "source",
    "contact.linkedin.title": "LinkedIn",
    "contact.linkedin.body1": "/keffwontwakeup",
    "contact.linkedin.body2": "network · profile",
    "contact.linkedin.cta": "connect",
  },
  es: {
    "nav.profile": "Perfil",
    "nav.certifications": "Distinciones",
    "nav.projects": "Proyectos",
    "nav.contact": "Contacto",
    "lang.toggle.label": "Idioma",
    "contact.heading": "Hablemos",
    "contact.status": "disponible para trabajar",
    "contact.quote": "Ni cien años alcanzan para apreciar lo que la vida está destinada a ser.",
    "contact.email.title": "Correo",
    "contact.email.cta": "enviar mensaje",
    "contact.github.title": "GitHub",
    "contact.github.body1": "@overnuke",
    "contact.github.body2": "repositorios",
    "contact.github.cta": "código fuente",
    "contact.linkedin.title": "LinkedIn",
    "contact.linkedin.body1": "/keffwontwakeup",
    "contact.linkedin.body2": "red · perfil",
    "contact.linkedin.cta": "conectar",
  },
};
