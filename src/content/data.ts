import {
  SiGit,
  SiJavascript,
  SiMysql,
  SiNodedotjs,
  SiPython,
} from "@icons-pack/react-simple-icons";

import barbershopUserImg from "../assets/plates/projects/barbershop/user.png";
import acopiatechMainImg from "../assets/plates/projects/acopiatech/main.png";
import acopiatechPickupImg from "../assets/plates/projects/acopiatech/pickup.png";
import odooAccessImg from "../assets/plates/projects/odoo/access.png";

import profilePanelKeff from "../assets/plates/portrait/profile-panel-keff.jpg";
import profilePanelAlien from "../assets/plates/portrait/profile-panel-alien.jpg";
import profilePanelCold from "../assets/plates/portrait/profile-panel-cold.jpg";
import profilePanelOvernuke from "../assets/plates/portrait/profile-panel-overnuke.jpg";

import anfecaCertImg from "../assets/certificates/ANFECA_Certificate.jpg";
import notaCertUrl from "../assets/certificates/notaLaudatoria.pdf?url";
import exaverCertUrl from "../assets/certificates/exaver.pdf?url";
import angloCertUrl from "../assets/certificates/anglo.pdf?url";
import toeflCertUrl from "../assets/certificates/sepToelf.pdf?url";
import aiFundamentalsCertUrl from "../assets/certificates/AI Fundamentals - DataCamp.pdf?url";
import powerbiCertUrl from "../assets/certificates/CONISOFT25 Taller Kevin Sebastián.pdf?url";
import aiInitiationCertUrl from "../assets/certificates/Certificado-BIG-School-Kevin-Sebastian-Frias-Garcia.pdf?url";
import propadeuticCertUrl from "../assets/certificates/Certificado TecNM CPFCDE-CPF _ Cursos MOOC TecNM 2026.pdf?url";

// Halftone archive plates of each document (tools/halftone.py --preset plate,
// page 1). Separate from the `*Url` imports above because four of the five
// certificates are PDFs: the PDF stays the thing VIEW opens, the plate is what
// the wall can actually render. Portrait A4s are 920x1301, landscape 1440x920.
import anfecaPlate from "../assets/certificates/plates/anfeca.png";
import notaPlate from "../assets/certificates/plates/nota.png";
import exaverPlate from "../assets/certificates/plates/exaver.png";
import angloPlate from "../assets/certificates/plates/anglo.png";
import toeflPlate from "../assets/certificates/plates/sepToelf.png";

import type {
  AboutProfile,
  Certificate,
  Project,
  ProfilePanel,
  Skill,
  SocialLink,
} from "./types";

export const PROJECTS: Project[] = [
  {
    title: "Barbershop",
    subtitle: "Final project for Web Development Course",
    description:
      "Backend for an online booking system for a barbershop. Includes booking management, notifications, and full API documentation in the project wiki.",
    tags: ["Express", "JavaScript", "Docker", "MySQL"],
    year: "2025",
    href: "#",
    repo: "https://github.com/Sinhularity/barbershop",
    featured: true,
    sheetSlot: "feature",
    // The one authored chip label — "flagship" is a judgment call no stack
    // tag produces (Barbershop derives to `Backend`). AcopiaTech → "mobile"
    // and Odoo → "module" fall out of `getProjectCategory`. See `resolveChipText`.
    chip: "flagship",
    image: barbershopUserImg,
    imageAlt:
      "Barbershop admin dashboard showing an employee record with contact details and status.",
  },
  {
    title: "AcopiaTech",
    subtitle: "Mobile app for e-waste donation",
    description:
      "Allows users to find nearby e-waste collection points, schedule pickups, and learn about proper e-waste disposal.",
    tags: ["Google Maps API", "Flutter", "Dart", "Firebase"],
    year: "2025",
    href: "#",
    repo: "https://github.com/Sinhularity/acopiatech-app",
    featured: true,
    sheetSlot: "spread",
    image: acopiatechMainImg,
    imageAlt:
      "AcopiaTech mobile app home screen showing a scheduled e-waste pickup and quick actions.",
    imageB: acopiatechPickupImg,
    imageBAlt: "AcopiaTech pickup scheduling screen with a collection point selected on the map.",
  },
  {
    title: "Odoo Custom Module",
    subtitle: "Document management module for a local company",
    description:
      "Maintenance and new features for a custom Odoo module handling document management workflows.",
    tags: ["Odoo", "Python", "PostgreSQL"],
    year: "2025",
    href: "#",
    sheetSlot: "record",
    image: odooAccessImg,
    imageAlt:
      "Odoo document manager showing a file-sharing dialog with read and write access groups.",
  },
];

export const CERTIFICATES: Certificate[] = [
  {
    id: "anfeca",
    title: "ANFECA Academic Recognition",
    issuer: "ANFECA",
    date: "2025",
    href: anfecaCertImg,
    category: "honors",
    icon: "trophy",
    hero: true,
    scan: anfecaPlate,
    scanAlt:
      "ANFECA recognition: first place, XVIII Maraton Regional Zona 6 Sur, Informatica Administrativa, 2025",
    scanOrientation: "landscape",
    note: "First place, XVIII Maratón Regional Zona 6 Sur — Administrative Informatics. Awarded by ANFECA, the national association of accounting and administration faculties.",
  },
  {
    id: "nota",
    title: "Nota Laudatoria",
    issuer: "Universidad",
    date: "2025",
    href: notaCertUrl,
    category: "honors",
    icon: "crown",
    scan: notaPlate,
    scanAlt:
      "Nota Laudatoria from Universidad Veracruzana for a 9.40 general average in Software Engineering",
    scanOrientation: "portrait",
    note: "An institutional citation from Universidad Veracruzana recognizing a 9.40 general average in Software Engineering.",
  },
  {
    id: "exaver",
    title: "EXAVER Language Proficiency",
    issuer: "Universidad Veracruzana",
    date: "2022",
    href: exaverCertUrl,
    category: "language",
    icon: "globe",
    scan: exaverPlate,
    scanAlt: "EXAVER language proficiency certificate, Universidad Veracruzana",
    scanOrientation: "portrait",
    note: "English proficiency certification issued by Universidad Veracruzana's EXAVER examination board.",
  },
  {
    id: "anglo",
    title: "English Language Certificate",
    issuer: "Anglo Mexicano de Coatzacoalcos",
    date: "2021",
    href: angloCertUrl,
    category: "academic",
    icon: "scroll",
    scan: angloPlate,
    scanAlt: "English language certificate from Anglo Mexicano de Coatzacoalcos",
    scanOrientation: "landscape",
    note: "General English certification issued after completing the full programme at Anglo Mexicano de Coatzacoalcos.",
  },
  {
    id: "toefl",
    title: "TOEFL Certificate",
    issuer: "SEP",
    date: "2018",
    href: toeflCertUrl,
    category: "language",
    icon: "globe",
    scan: toeflPlate,
    scanAlt: "TOEFL certificate issued by SEP",
    scanOrientation: "portrait",
    note: "Standardised English test certification, issued through SEP (Secretaría de Educación Pública).",
  },
  {
    id: "aifundamentals",
    title: "AI Fundamentals Certificate",
    issuer: "DataCamp",
    date: "2026",
    href: aiFundamentalsCertUrl,
    category: "academic",
    icon: "scroll",
    scanAlt: "AI Fundamentals certificate issued by DataCamp",
    scanOrientation: "landscape",
    note: "Track completion covering the foundations of machine learning, model evaluation, and applied AI workflows.",
    sourceFile: "AI Fundamentals - DataCamp.pdf",
  },
  {
    id: "powerbi",
    title: "Introduction to Power BI",
    issuer: "CONISOFT",
    date: "2025",
    href: powerbiCertUrl,
    category: "academic",
    icon: "scroll",
    scanAlt:
      "Introduction to Power BI certificate issued at the 13th International Conference in Software Engineering Research and Innovation (CONISOFT)",
    scanOrientation: "landscape",
    note: "Workshop on data modelling, DAX basics, and dashboard authoring at CONISOFT's 13th International Conference in Software Engineering Research and Innovation.",
    sourceFile: "CONISOFT25 Taller Kevin Sebastián.pdf",
  },
  {
    id: "aiinitiation",
    title: "AI Initiation Certificate",
    issuer: "MoureDev",
    date: "2026",
    href: aiInitiationCertUrl,
    category: "academic",
    icon: "scroll",
    scanAlt: "AI Initiation certificate issued by MoureDev",
    scanOrientation: "landscape",
    note: "Applied introduction to AI tooling, prompting, and agent-assisted development, via MoureDev's Big School programme.",
    sourceFile: "Certificado-BIG-School-Kevin-Sebastian-Frias-Garcia.pdf",
  },
  {
    id: "propadeutic",
    title: "Propadeutic Certificate",
    issuer: "Tecnm and The Public Capacitation Center in Artifical Intelligence",
    date: "2026",
    href: propadeuticCertUrl,
    category: "academic",
    icon: "scroll",
    scanAlt: "Propadeutic certificate for finishing the propadeutic program",
    scanOrientation: "landscape",
    note: "Propedeutic MOOC course completion, TecNM 2026 cycle, delivered with the Public Capacitation Center in Artificial Intelligence.",
    sourceFile: "Certificado TecNM CPFCDE-CPF _ Cursos MOOC TecNM 2026.pdf",
  },

  // The following is yet to be achived SO DO NOT ADD yet to the project
  // {
  //   id: "genai",
  //   title: "AI for Future Workforce- GenAI",
  //   issuer: "Intel",
  //   date: "2026",
  //   href: ,
  //   category: "academic",
  //   icon: "",
  //   scan: ,
  //   scanAlt:
  //     "AI for Future Workforce- GenAI certificate issued by Intel",
  //   scanOrientation: "portrait",
  // },
];

export const SKILLS: Skill[] = [
  { name: "Python", category: "language", icon: SiPython, core: true },
  { name: "JavaScript", category: "language", icon: SiJavascript, core: true },
  { name: "Java", category: "language", core: true }, // Add a SVG JAVA
  { name: "MySQL", category: "language", icon: SiMysql, core: true },
  { name: "Node.js", category: "framework", icon: SiNodedotjs, core: true },
  { name: "Git", category: "tool", icon: SiGit, core: true },
  { name: "VS Code", category: "tool" },
];

/**
 * Array order is DOM order in the CONTACT field, and DOM order is tab order,
 * so this list is ranked by how much Keff actually wants to be reached that
 * way — not by slot geometry. Where each one LANDS on the sheet is
 * `channelSlot`; see `components/channel-field/channelLayout.ts`.
 *
 * Extended 2026-08-20 from three channels to five with the CONTACT module
 * (`claude/contact-channel-field-2026-08-20.md`). Reduced back to four
 * 2026-09-04 (design import, `sdd/design-import-sections`): Instagram is
 * dropped outright (its `rail-b` slot goes with it — see `ChannelSlot` in
 * `types.ts`), not deferred as pending.
 *
 * On the WhatsApp entry specifically: a `wa.me` link publishes a personal
 * phone number in the page source, permanently and scrapeably. That is a
 * different disclosure from an email address and wanted a deliberate yes.
 * **Yes, given 2026-09-04** (design import, C2): the number below is real.
 * `ChannelField` still renders a flagged channel as a plate with NO link when
 * `unresolved` is set — that path stays wired and tested, unused, matching
 * `FieldRecord.tsx`'s "no record exercises that branch today; it is a real
 * code path rather than a promise" precedent — but nothing in this list
 * exercises it any more.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Email",
    href: "mailto:ksfgarcia24@gmail.com",
    handle: "ksfgarcia24@gmail.com",
    meta: "Send message",
    channelSlot: "primary",
  },
  {
    label: "GitHub",
    href: "https://github.com/OverNuke",
    handle: "@OverNuke",
    meta: "Repositories",
    channelSlot: "rail-a",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/keffwontwakeup/",
    handle: "/keffwontwakeup",
    meta: "Network · profile",
    channelSlot: "feature",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/529212652693",
    handle: "+52 921 265 2693",
    meta: "Direct chat",
    channelSlot: "aside",
  },
];

export const ABOUT_PROFILE: AboutProfile = {
  firstName: "Kevin S.",
  lastName: "F. García",
  fullName: "Kevin Sebastián Frías García",
  mark: ["K.S", "F.G"],
  summary: "Just an alien, who loves to code, between human beings",
  role: "Jr. Software Developer",
  status: "ONLINE · OPEN TO WORK",
  statusOnline: true,
  bio: "Whoami? Tough for me to say. But if I have to say something, I must say I'm a hard-working and dedicated guy.",
  bodyText: "Open to junior roles and internships where I can grow and contribute.",
  location: "Mexico",
  openTo: "Junior roles · Internships",
  availability: "Open to work",
  creed: "You fail? Congrats! Most people don't even try.",
  nickname: "Kevon",
  establishedNote: "est. 2003",
  // No `cv` yet — the /profile page renders a placeholder chip until a real
  // one-page PDF lands. Add `cv: { href, note }` to turn it into a link.
};

/**
 * The four portrait panels on the /profile manga-collage hero
 * (`components/profile-hero/`). Order is DOM order is tab order. Each `id`
 * is matched to an authored `clip-path` + stage position in
 * `profile-hero.css` — the panels are not interchangeable.
 *
 * All four source images are black ink line-art on white (poses from the
 * `docs/assets/portrait-prompt-kit.md` series). The page treats them
 * uniformly: `mix-blend-mode: multiply` so the white ground drops into the
 * paper, plus `grayscale(1)` to neutralise the stray brand colour in the
 * `cold`/`overnuke` sources.
 */
export const PROFILE_PANELS: ProfilePanel[] = [
  {
    id: "keff",
    image: profilePanelKeff,
    alt: "Kevin — ink portrait, head and shoulders, calm three-quarter view.",
    caption: "Keff",
  },
  {
    id: "alien",
    image: profilePanelAlien,
    alt: "Kevin in a hooded jacket and round glasses, hand to his chin, looking down.",
    caption: "ALIEN",
    handle: "K3V1N",
  },
  {
    id: "cold",
    image: profilePanelCold,
    alt: "Kevin crouching in an oversized hoodie and sneakers, smiling at the camera.",
    caption: "Cold",
  },
  {
    id: "overnuke",
    image: profilePanelOvernuke,
    alt: "Kevin mid-stride, arm extended, pointing straight at the viewer.",
    handle: "OverNuke",
  },
];
