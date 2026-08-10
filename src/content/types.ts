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
  /**
   * Which slot this record takes on the /projects panel sheet
   * (`claude/projects-module-manga-sheet-2026-08-05.md`). Slots are NOT
   * interchangeable — `record` is type-only by design (the reference
   * sheet's cards carry no image) and `spread` carries two plates — so the
   * assignment is explicit data, never derived from array position.
   *
   * Defaults to `record` when absent. A sheet resolves exactly one
   * `feature` and at most one `spread`; see `assignSlots`.
   */
  sheetSlot?: "feature" | "spread" | "record";
  /** Second plate, `spread` slot only. Ignored in every other slot. */
  imageB?: string;
  /** Required whenever `imageB` is set. */
  imageBAlt?: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  /** The document itself. This is what the credential wall's VIEW link opens. */
  href: string;
  category: "honors" | "language" | "academic";
  icon: string;
  hero?: boolean;
  /**
   * Halftone archive plate of the document, for the credential wall
   * (`tools/halftone.py --preset plate`). Distinct from `href`: four of the
   * five certificates are PDFs, which cannot render in an `<img>`, so the
   * plate is a generated raster of page 1 while `href` stays the real file.
   * Absent renders the placeholder stock — the record still gets a full mat,
   * because the mat is the frame.
   */
  scan?: string;
  /**
   * Real alt text for the plate. Omit only when the mat's caption already
   * states everything the image conveys; the plate is then decorative and
   * takes `role="presentation"`.
   */
  scanAlt?: string;
  /**
   * Shape of the plate. Wall slots are shaped for one orientation and are NOT
   * interchangeable (same principle as `Project.sheetSlot`) — `assignSlots`
   * matches records to slots so a portrait A4 never lands in a landscape
   * letterbox. Defaults to landscape.
   */
  scanOrientation?: "portrait" | "landscape";
}

export interface Skill {
  name: string;
  category: "language" | "framework" | "tool";
  /** Absent when simple-icons has no entry for the brand (e.g. VS Code isn't in the current dataset). */
  icon?: IconType;
  /**
   * Marks the skill for Home's stack rail (added 2026-08-06 with the Home
   * redesign). The rail is a 26px margin column and holds seven chips at
   * 1440x900, so this is a curation flag, not a seniority claim — the rail
   * renders `SKILLS.filter(s => s.core)` and states the remainder as a
   * count.
   *
   * It lives here rather than as a literal in `Canvas.tsx` for one reason:
   * a hand-written array on Home would drift from `SKILLS` the first time
   * this list changes, and nothing would catch it.
   */
  core?: boolean;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface AboutProfile {
  firstName: string;
  lastName: string;
  /**
   * The whole legal name, unabbreviated. `firstName`/`lastName` are the
   * *display* forms the profile plate needs ("Kevin S." / "F. García");
   * this is what every accessible name must use, because a screen reader
   * reading "Kevin S. F. García" is reading initials aloud.
   *
   * Home's masthead splits the name across two decorative, aria-hidden
   * lines and carries this string in a visually-hidden span — so the
   * heading announces the name once, whole. Added 2026-08-06; it replaces
   * the literal that used to be hardcoded in `Canvas.tsx`.
   */
  fullName: string;
  /**
   * The two-line initial mark printed on the profile sheet's rotated plate
   * (e.g. ["K.S", "F.G"]). Decorative — the accessible name is always the
   * full firstName/lastName pair, never these fragments. Exactly two lines,
   * because the plate's composition is built around a two-line mark.
   */
  mark: readonly [string, string];
  /**
   * Short declarative line for the data plate. Distinct from `bio`, which is
   * conversational and too long for the plate's 34ch measure — see
   * docs/02_DESIGN_SYSTEM.MD and the profile plate handoff. Keep under ~110
   * characters or the plate's occlusion gap closes.
   */
  summary: string;
  role: string;
  status: string;
  statusOnline: boolean;
  bio: string;
  bodyText: string;
  location: string;
  openTo: string;
}
