import {
  SiCss,
  SiFigma,
  SiGit,
  SiHtml5,
  SiJavascript,
  SiNextdotjs,
  SiNodedotjs,
  SiReact,
  SiTailwindcss,
  SiTypescript,
} from "@icons-pack/react-simple-icons";

import barbershopUserImg from "../assets/plates/projects/barbershop/user.png";
import acopiatechMainImg from "../assets/plates/projects/acopiatech/main.png";
import odooAccessImg from "../assets/plates/projects/odoo/access.png";

import anfecaCertImg from "../assets/certificates/ANFECA_Certificate.jpg";
import notaCertUrl from "../assets/certificates/notaLaudatoria.pdf?url";
import exaverCertUrl from "../assets/certificates/exaver.pdf?url";
import angloCertUrl from "../assets/certificates/anglo.pdf?url";
import toeflCertUrl from "../assets/certificates/sepToelf.pdf?url";

import type { AboutProfile, Certificate, Project, Skill, SocialLink } from "./types";

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
    image: barbershopUserImg,
    imageAlt: "Barbershop admin dashboard showing an employee record with contact details and status.",
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
    image: acopiatechMainImg,
    imageAlt: "AcopiaTech mobile app home screen showing a scheduled e-waste pickup and quick actions.",
  },
  {
    title: "Odoo Custom Module",
    subtitle: "Document management module for a local company",
    description:
      "Maintenance and new features for a custom Odoo module handling document management workflows.",
    tags: ["Odoo", "Python", "PostgreSQL"],
    year: "2025",
    href: "#",
    image: odooAccessImg,
    imageAlt: "Odoo document manager showing a file-sharing dialog with read and write access groups.",
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
  },
  {
    id: "nota",
    title: "Nota Laudatoria",
    issuer: "Universidad",
    date: "2025",
    href: notaCertUrl,
    category: "honors",
    icon: "crown",
  },
  {
    id: "exaver",
    title: "EXAVER Language Proficiency",
    issuer: "Universidad Veracruzana",
    date: "2022",
    href: exaverCertUrl,
    category: "language",
    icon: "globe",
  },
  {
    id: "anglo",
    title: "English Language Certificate",
    issuer: "Anglo Mexicano de Coatzacoalcos",
    date: "2021",
    href: angloCertUrl,
    category: "academic",
    icon: "scroll",
  },
  {
    id: "toefl",
    title: "TOEFL Certificate",
    issuer: "SEP",
    date: "2018",
    href: toeflCertUrl,
    category: "language",
    icon: "globe",
  },
];

export const SKILLS: Skill[] = [
  { name: "TypeScript", category: "language", icon: SiTypescript },
  { name: "JavaScript", category: "language", icon: SiJavascript },
  { name: "HTML", category: "language", icon: SiHtml5 },
  { name: "CSS", category: "language", icon: SiCss },
  { name: "React", category: "framework", icon: SiReact },
  { name: "Next.js", category: "framework", icon: SiNextdotjs },
  { name: "Tailwind CSS", category: "framework", icon: SiTailwindcss },
  { name: "Node.js", category: "framework", icon: SiNodedotjs },
  { name: "Git", category: "tool", icon: SiGit },
  { name: "VS Code", category: "tool" },
  { name: "Figma", category: "tool", icon: SiFigma },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/OverNuke", icon: "/github-light.svg" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/keffwontwakeup/", icon: "/linkedin.svg" },
  { label: "Email", href: "mailto:ksfgarcia24@gmail.com", icon: "/gmail.svg" },
];

export const ABOUT_PROFILE: AboutProfile = {
  firstName: "Kevin S.",
  lastName: "F. García",
  role: "Jr. Software Developer",
  status: "ONLINE · OPEN TO WORK",
  statusOnline: true,
  bio: "Want to know more about me? I might not be the most experienced nor the flashiest player, but I always give my best and I'm eager to learn new skills and take on challenges.",
  bodyText: "Open to junior roles and internships where I can grow and contribute.",
  location: "Mexico",
  openTo: "Junior roles · internships",
  ctaPrimary: { label: "PRESS START", href: "/contact" },
  ctaSecondary: { label: "CONTINUE", href: "/projects" },
};
