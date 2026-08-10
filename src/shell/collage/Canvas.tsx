import { ABOUT_PROFILE, SKILLS, SOCIAL_LINKS } from "../../content/data";
import { ROUTES } from "../../routes/routes";
import { GithubIcon, LinkedinIcon, MailIcon } from "../../components/social-icon/SocialIcon";
import { NavItem } from "./NavItem";
import heroImg from "../../assets/plates/portrait/hero.png";
import "./home.css";

/**
 * HOME — "GHOST PLATE" (rewritten 2026-08-06, Keff).
 *
 * Supersedes the doc-12 collage Home entirely: the 12x12 grid, the three
 * photo/detail plates, the skills badge field, the fused channel icon
 * strip and the serial/barcode block are all gone. Design record:
 * `claude/home-y2k-editorial-directions-2026-08-06.md` (direction A, chosen
 * over B/DECK 99 and C/SPREAD) and `claude/home-icon-system-2026-08-06.md`
 * (the margin rail and the channel glyphs).
 *
 * The composition, in the order it reads:
 *
 *   1. ONE PHOTOGRAPH, bleeding off the right edge — `hero.png` (2026-08-09),
 *      grayscale + blurred for a clean editorial portrait, deliberately
 *      not given the ink-plate treatment `.hm-plate` and the Projects/
 *      Certificates cards use. See the full rationale in `home.css`.
 *   2. THE MASTHEAD, LT Superior Serif ExtraBold, beside the figure. The
 *      one accented glyph is olive.
 *   3. THE OLIVE INDEX PLATE, printed over the photograph at -1.15deg with
 *      a second `--field-olive-deep` pass behind it for registration drift.
 *      It carries the real `NavItem` list.
 *   4. THE STACK RAIL down the left margin — `SKILLS` filtered to `core`.
 *   5. THE CONTACT STRIP at the foot, imported from direction C.
 *
 * WHY CONTACT IS ON HOME AND PROJECTS ARE NOT. Direction C's foot strip
 * originally listed project records. Home listing them would repeat
 * module 02's entire job — the same duplication the 2026-08-03 third pass
 * removed when it stopped Home rendering `PROJECTS[].image`. Contact, by
 * contrast, has just left the module index, so this strip is the only
 * place those addresses appear. A component that duplicates a module is
 * decoration; a component that is the sole home of its content is
 * structure.
 *
 * `/contact` REMAINS A ROUTE (Keff, 2026-08-06) — it is simply not in the
 * index. Home carried its own "OPEN TO WORK" availability chip driving the
 * turn machine to that route until 2026-08-09, when it was removed as
 * redundant next to the channel list right below it (real links to GitHub/
 * LinkedIn/email, not the in-app route). `/contact` is now reachable from
 * Home only by deep link; the one interactive in-app path to it is
 * Profile's own status chip (`ProfilePlate`'s `.profile-plate__status`).
 *
 * ALL placement lives in `home.css` (design D5). This component applies
 * class names only — never an inline style, never a pixel top/left.
 */

/** The index shows routed *modules*. Contact is reachable, but its channels
 *  live on this page, so listing it would say the same thing twice. */
const MODULES = ROUTES.filter((route) => route.pageId !== "contact");

/** Curated in `data.ts`, not here — see `Skill.core`. Home and any future
 *  skills surface read the same flag, so they cannot drift. */
const CORE_SKILLS = SKILLS.filter((skill) => skill.core);
const UNLISTED_SKILLS = SKILLS.length - CORE_SKILLS.length;

const CHANNEL_ICONS = { GitHub: GithubIcon, LinkedIn: LinkedinIcon, Email: MailIcon } as const;

/** `mailto:ksfgarcia24@gmail.com` -> `ksfgarcia24@gmail.com`,
 *  `https://github.com/OverNuke` -> `github.com/OverNuke`. The address IS
 *  the link text — it is a better accessible name than "GitHub" because a
 *  link-list read-out then says where it actually goes. */
function channelAddress(href: string): string {
  return href
    .replace(/^mailto:/, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export function Canvas() {
  return (
    <div className="canvas">
      {/* Decorative: the photograph duplicates the heading and carries no
          information of its own — same call as the profile plate. */}
      <div className="hm-hero" aria-hidden="true">
        <img src={heroImg} alt="" />
      </div>

      <div className="hm-seam" aria-hidden="true" />

      <header className="hm-identity">
        {/* The role is its own element, not interpolated into the line:
            it is the accessible identity content design D6 requires Home to
            carry independently of the intro, so it has to be findable on
            its own rather than as a fragment of a longer string. */}
        <p className="hm-eyebrow">
          <span className="hm-eyebrow__role">{ABOUT_PROFILE.role}</span>
          <span aria-hidden="true"> — underground portfolio</span>
        </p>
        <h1 className="hm-name">
          <span className="visually-hidden">{ABOUT_PROFILE.fullName}</span>
          {/* The two visible lines are decorative fragments of the name
              above them; announcing them would repeat it letter-split. */}
          <span className="hm-name__given" aria-hidden="true">
            Kevin Sebastián Frías
          </span>
          <span className="hm-name__family" aria-hidden="true">
            GARC<i>Í</i>A
          </span>
        </h1>

        <div className="hm-rule" aria-hidden="true" />
        <p className="hm-summary">{ABOUT_PROFILE.summary}</p>
      </header>

      <nav className="hm-plate" aria-label="Primary">
        <span className="hm-plate__tick" aria-hidden="true">
          [01]
        </span>
        <h2 className="hm-plate__title">Module index</h2>
        <ul className="hm-index">
          {MODULES.map((route) => (
            <li key={route.pageId}>
              <NavItem route={route} />
            </li>
          ))}
        </ul>
        <div className="hm-plate__foot" aria-hidden="true">
          <span>2026</span>
          <span>[03]</span>
        </div>
      </nav>

      {/* Chips are inert text, not controls — there is no skills route to
          send them to. The glyphs the first cut carried were removed on
          2026-08-06: nine olive marks down the edge read as colour weight
          and pulled the page's only accent away from the plate. */}
      <aside className="hm-rail" aria-label="Core stack">
        <span className="hm-rail__label">Stack</span>
        <ul>
          {CORE_SKILLS.map((skill) => (
            <li className="hm-chip" key={skill.name}>
              <em>{skill.name}</em>
            </li>
          ))}
        </ul>
        {UNLISTED_SKILLS > 0 && (
          <span className="hm-rail__tail">
            + {String(UNLISTED_SKILLS).padStart(2, "0")} more
          </span>
        )}
      </aside>

      <section className="hm-channels" aria-labelledby="hm-channels-title">
        <div className="hm-channels__head">
          <h2 id="hm-channels-title">Contact channels</h2>
        </div>
        <ul>
          {SOCIAL_LINKS.map((link, index) => {
            const Icon = CHANNEL_ICONS[link.label as keyof typeof CHANNEL_ICONS];
            return (
              <li key={link.label}>
                <span className="hm-channels__ic" aria-hidden="true">
                  {Icon && <Icon aria-hidden="true" />}
                </span>
                <span className="hm-channels__id" aria-hidden="true">
                  CH {String(index + 1).padStart(2, "0")}
                </span>
                <a className="hm-channels__nm" href={link.href}>
                  {channelAddress(link.href)}
                </a>
                <span className="hm-channels__meta">{link.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <span className="hm-reticle hm-reticle--tl" aria-hidden="true" />
      <span className="hm-reticle hm-reticle--br" aria-hidden="true" />
    </div>
  );
}
