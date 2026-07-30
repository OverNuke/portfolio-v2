import type { IconType } from "@icons-pack/react-simple-icons";

export interface Project {
  title: string;
  subtitle: string;
  description: string;
  tags: readonly string[];
  year: string;
  href: string;
  repo?: string;
  featured?: boolean;
  image: string;
  imageAlt: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  href: string;
  category: "honors" | "language" | "academic";
  icon: string;
  hero?: boolean;
}

export interface Skill {
  name: string;
  category: "language" | "framework" | "tool";
  /** Absent when simple-icons has no entry for the brand (e.g. VS Code isn't in the current dataset). */
  icon?: IconType;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

export interface CallToAction {
  label: string;
  href: string;
}

export interface AboutProfile {
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  statusOnline: boolean;
  bio: string;
  bodyText: string;
  location: string;
  openTo: string;
  ctaPrimary: CallToAction;
  ctaSecondary: CallToAction;
}
