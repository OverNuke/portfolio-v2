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
  /**
   * Prose shown in the scan-viewer modal body (`CertScanModal`), set in
   * `--font-serif-edit` — editorial voice, not the mono meta line. Kept
   * factually consistent with this record's own `title`/`issuer`, never
   * copied from an external design mockup's renamed copy.
   */
  note?: string;
  /**
   * Human-readable label for the modal's placeholder plate when `scan` is
   * absent. Deliberately NOT derived from `href`: that's a Vite `?url`
   * import, which resolves to a hashed build path in production.
   */
  sourceFile?: string;
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

/**
 * Named composition slots for the CONTACT channel field
 * (`components/channel-field/`). Slots are NOT interchangeable — two are
 * vertical banners setting their label with `writing-mode` and three are
 * horizontal blocks — so the assignment is explicit data, never derived
 * from array position. Same principle as `Project.sheetSlot`.
 */
export type ChannelSlot = "primary" | "rail-a" | "feature" | "aside" | "rail-b";

export interface SocialLink {
  label: string;
  href: string;
  /**
   * The visible handle or address. Deliberately distinct from `href`:
   * "@OverNuke" is not "https://github.com/OverNuke", and printing a bare
   * URL in a 123px-wide banner is how a layout gets broken by its data.
   */
  handle: string;
  /** The short line under the name. "Network · profile", "Direct chat". */
  meta: string;
  /**
   * Which slot this channel takes in the field. Absent falls back to the
   * first free slot in `CHANNEL_SLOTS` order — see `assignChannelSlots`.
   */
  channelSlot?: ChannelSlot;
  /**
   * Marks a placeholder `href` that must not ship. `ContactPage.test.tsx`
   * asserts this list is empty, so the build fails loudly the day someone
   * forgets rather than publishing a dead link. Remove the flag when the
   * real address lands.
   */
  unresolved?: boolean;
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
  /**
   * Two or three words, printed inside the CONTACT field's Oxblood marker.
   * Separate from `status` ("ONLINE · OPEN TO WORK") because that string is
   * two facts joined by a middot and the marker is a tag roughly 90px wide
   * — it would wrap onto the face. Keep it under ~14 characters.
   */
  availability: string;
}
