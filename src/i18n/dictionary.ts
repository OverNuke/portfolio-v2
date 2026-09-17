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
  | "contact.linkedin.cta"
  | "profile.heading"
  | "profile.bio"
  | "profile.availability"
  | "profile.cta"
  | "profile.status"
  | "profile.chamber.software"
  | "profile.chamber.systems"
  | "profile.chamber.anywhere"
  | "profile.chamber.dependable"
  | "profile.dot.java"
  | "profile.dot.javascript"
  | "profile.dot.python"
  | "profile.dot.sql"
  | "profile.dot.uml"
  | "profile.dot.spanish"
  | "profile.dot.english"
  | "profile.dot.french"
  | "profile.dot.responsible"
  | "profile.dot.hardworking"
  | "profile.dot.teamwork"
  | "profile.dot.dedicated";

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
    "profile.heading": "Junior software engineer",
    "profile.bio": "Just graduated from Universidad Veracruzana. Small projects so far — and the appetite for one that makes a change.",
    "profile.availability": "Always learning · open to travel",
    "profile.cta": "Get in touch",
    "profile.status": "Looking for an opportunity",
    "profile.chamber.software": "Software",
    "profile.chamber.systems": "Systems",
    "profile.chamber.anywhere": "Anywhere",
    "profile.chamber.dependable": "Dependable",
    "profile.dot.java": "Java",
    "profile.dot.javascript": "JavaScript",
    "profile.dot.python": "Python",
    "profile.dot.sql": "SQL",
    "profile.dot.uml": "UML",
    "profile.dot.spanish": "Spanish",
    "profile.dot.english": "English B1+",
    "profile.dot.french": "French basics",
    "profile.dot.responsible": "Responsible",
    "profile.dot.hardworking": "Hardworking",
    "profile.dot.teamwork": "Teamwork",
    "profile.dot.dedicated": "Dedicated",
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
    "profile.heading": "Ingeniero de software junior",
    "profile.bio": "Recién egresado de la Universidad Veracruzana. Proyectos pequeños hasta ahora — y las ganas de uno que haga la diferencia.",
    "profile.availability": "Siempre aprendiendo · disponible para viajar",
    "profile.cta": "Ponte en contacto",
    "profile.status": "Buscando una oportunidad",
    "profile.chamber.software": "Software",
    "profile.chamber.systems": "Sistemas",
    "profile.chamber.anywhere": "En cualquier lugar",
    "profile.chamber.dependable": "Confiable",
    "profile.dot.java": "Java",
    "profile.dot.javascript": "JavaScript",
    "profile.dot.python": "Python",
    "profile.dot.sql": "SQL",
    "profile.dot.uml": "UML",
    "profile.dot.spanish": "Español",
    "profile.dot.english": "Inglés B1+",
    "profile.dot.french": "Francés básico",
    "profile.dot.responsible": "Responsable",
    "profile.dot.hardworking": "Trabajador",
    "profile.dot.teamwork": "Trabajo en equipo",
    "profile.dot.dedicated": "Dedicado",
  },
};
