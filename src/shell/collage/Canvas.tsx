import { ABOUT_PROFILE, SKILLS } from "../../content/data";
import "./home.css";

/**
 * HOME — "EDITORIAL MINIMAL / FIELD" (2026-08-10, Keff).
 *
 * Direction 01's typography and hierarchy on direction 03's two-field
 * ground. Design record: `claude/home-three-directions-2026-08-10.md`
 * (the three proofs) and `claude/home-editorial-port-2026-08-10.md` (the
 * React port). The proofs are still in `docs/design-exploration/`.
 *
 * ── THE FIELD ────────────────────────────────────────────────────────────
 * Paper on the left, FIELD OLIVE DEEP on the right, one hard seam. The
 * seated-cutout photograph that used to stand on it was dropped
 * `sdd/drop-intro-hero-placeholder` (2026-08-24) — the hero slot is now a
 * reserved, imageless placeholder (design D3) holding the same footprint
 * until the editorial Home redesign replaces it. This was a deliberate
 * move back toward direction 03 — 01 won partly by being accent-free
 * paper-and-ink, so adding a field is a decision, not a drift.
 *
 * ── TWO CONSTRAINTS GOVERN EVERYTHING DOWNSTREAM ─────────────────────────
 * From `claude/profile-plate-composition-2026-08-05.md`, site-wide:
 *   · Ink on olive is 2.57:1 — BANNED. All type on the field is Paper
 *     White (7.74:1 on olive-deep).
 *   · Oxblood on olive is 1.90:1 — BANNED. The accent only ever appears on
 *     paper, and here only as a focus ring.
 *
 * That is why the masthead is TWO CLIPPED COPIES rather than one element
 * with a blend mode. Direction 03 crossed its seam with
 * `mix-blend-mode: difference`, which works against a neutral ink block and
 * does not work here: difference against a chromatic olive resolves to a
 * pale lavender-grey, not an inversion. So the word is painted twice — Ink
 * clipped to the paper side, Paper White clipped to the field side — both
 * in the same grid area, so they register exactly at every width with no
 * hand-tuned offset. `home.css` owns the clip.
 *
 * ── THE COMPOSITION, in the order it reads ───────────────────────────────
 *   1. A metadata line across the top.
 *   2. THE SURNAME at 16cqw, crossing the seam. It used to pass BEHIND the
 *      photograph's head and shoulders — with the photograph gone, the
 *      masthead's own clip at the seam is unchanged, but nothing occludes
 *      it any more (an accepted, explicitly deferred regression, per
 *      `sdd/drop-intro-hero-placeholder`).
 *   3. THE RESERVED HERO SLOT, standing on the seam and the bottom edge —
 *      two crop marks and a status label, design D3. It is deliberately
 *      MUTE rather than a texture (see `home.css` §4's header for why).
 *   4. THE STACK, lower right, on the field, in Paper White.
 *
 * BOTH MASTHEAD COPIES AND THE RESERVED HERO SLOT ARE `aria-hidden`. The
 * accessible identity is the visually-hidden `<h1>` plus the role line —
 * everything painted on the canvas is decorative, so these two elements are
 * Home's ONLY accessible carriers of name and role (not "the accessible
 * equivalent of an intro" — there is no longer an intro for them to be
 * equivalent to; see `docs/05_ACCESSIBILITY.MD`).
 *
 * ALL placement lives in `home.css` (design D5). This component applies
 * class names — never an inline style, never a pixel top/left.
 *
 * THE MODULE WHEEL AND ITS CAPTION RAIL LIVE ELSEWHERE (2026-08-11,
 * promoted-to-global pass). Both used to render here — the wheel as a grid
 * item, the caption rail describing its selection — but the wheel is now a
 * `position: fixed` DOM sibling of `Shell` itself (`shell/wheel/`, mounted
 * from `App.tsx`) so it keeps working from every routed page, not only from
 * Home. Canvas no longer holds any wheel-related state; it is purely the
 * decorative composition now.
 */

/** Curated in `data.ts`, not here — see `Skill.core`. */
const CORE_SKILLS = SKILLS.filter((skill) => skill.core);
const UNLISTED_SKILLS = SKILLS.length - CORE_SKILLS.length;

/**
 * The painted masthead is the last word of the legal name, uppercased in
 * CSS. Derived rather than written out so it cannot drift from
 * `ABOUT_PROFILE` the way the hardcoded "GARCÍA" in the previous Home did —
 * `firstName`/`lastName` are display forms ("Kevin S." / "F. García"), and
 * "F. GARCÍA" is not a masthead.
 */
const MASTHEAD = ABOUT_PROFILE.fullName.split(" ").at(-1) ?? ABOUT_PROFILE.lastName;

/**
 * Same derivation discipline as `MASTHEAD` — the initials are read off
 * `ABOUT_PROFILE`, never hardcoded, so they cannot drift from the name the
 * rest of the page states in words.
 */
const KG_FIRST = (ABOUT_PROFILE.fullName.split(" ").at(0) ?? "").charAt(0);
const KG_LAST = MASTHEAD.charAt(0);

export function Canvas() {
  return (
    <div className="canvas">
      {/* The field. Decorative, placed with the `inset` shorthand. (The
          contact shade that used to sit under the figure was removed
          outright, design D4 — `sdd/drop-intro-hero-placeholder` — a shade
          under nothing reads as a rendering bug, not a device.) */}
      <div className="hm-field" aria-hidden="true" />

      {/* Oversized, low-opacity background texture — same design role as
          direction 03's cropped corner letters, ported to this field's
          paper/olive palette instead of ink-block. Clipped at the seam with
          the same technique as `.hm-mast`, so K can never paint ink onto
          the olive side and G can never paint paper white onto the paper
          side. Decorative and aria-hidden, like the masthead and the
          reserved hero slot. */}
      <p className="hm-kg hm-kg--k" aria-hidden="true">
        {KG_FIRST}
      </p>
      <p className="hm-kg hm-kg--g" aria-hidden="true">
        {KG_LAST}
      </p>

      <p className="hm-meta">
        <span>{ABOUT_PROFILE.fullName}</span>
        <span className="hm-meta__end" aria-hidden="true">
          KEVIN_ARCHIVE_OS — {ABOUT_PROFILE.location} · 2026
        </span>
      </p>

      <h1 className="visually-hidden">{ABOUT_PROFILE.fullName}</h1>

      {/* Two copies, one grid area, clipped at the seam — see the header. */}
      <p className="hm-mast hm-mast--paper" aria-hidden="true">
        {MASTHEAD}
      </p>
      <p className="hm-mast hm-mast--field" aria-hidden="true">
        {MASTHEAD}
      </p>

      {/* RESERVED — the seated-cutout photograph was dropped
          `sdd/drop-intro-hero-placeholder` (2026-08-24, design D3). This
          slot holds the same footprint (`--reserved` modifier, so a single
          grep finds every removable piece) with two CSS-drawn crop marks
          and a status label — transparent, no texture, no `<img>`. Fully
          decorative, like the masthead. */}
      <div className="hm-hero hm-hero--reserved" aria-hidden="true">
        <p className="hm-hero__label">FIGURE / RESERVED</p>
      </div>

      {/* The role is its own element, not interpolated into a longer line:
          along with the `<h1>` above, it is one of Home's only two
          accessible identity carriers, since everything else painted on
          the canvas is `aria-hidden` — so it has to be findable on its own
          rather than as a fragment of a string. */}
      <p className="hm-role">{ABOUT_PROFILE.role}</p>

      <aside className="hm-stack" aria-label="Core stack">
        <span className="hm-stack__label">Stack</span>
        <ul>
          {CORE_SKILLS.map((skill) => (
            <li key={skill.name}>{skill.name}</li>
          ))}
        </ul>
        {UNLISTED_SKILLS > 0 && (
          <span className="hm-stack__tail">
            + {String(UNLISTED_SKILLS).padStart(2, "0")} more
          </span>
        )}
      </aside>
    </div>
  );
}
