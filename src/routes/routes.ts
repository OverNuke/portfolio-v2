/**
 * Task 2.1 (sdd/phase2-app-shell), design's file layout + doc 11's NavItem
 * prop table (`index`, `label`/`title`, `sub`, `count`, `pageId`). One row
 * per real page route (Home/"/" is not a row here — Shell IS Home, per
 * design; it has no NavItem/PageLayer entry of its own).
 *
 * `tag` doubles as the page's PageLayer tag (design D8 / doc 11's
 * `TITLES` map, e.g. "PAGE 01") and `title` is the page's own heading
 * text. `index`/`sub`/`count` feed the NavItem (task 2.6) — values below
 * are ported directly from `docs/home.design-proof-v3.html`'s `#nav-stack`
 * markup and `TITLES` map, with `pageId`/`path` aligned to this app's real
 * routes (the proof calls the projects page "database"; here it is
 * "projects" to match the route path).
 *
 * `lede` was added 2026-08-10 with the editorial Home
 * (`claude/home-three-directions-2026-08-10.md`). It is the one sentence
 * Home prints under the module readout as the wheel turns. It lives HERE
 * rather than in `Canvas.tsx` for the same reason `Skill.core` lives in
 * `data.ts`: a hand-written map on Home would drift from `ROUTES` the
 * first time a module is added, and nothing would catch it. Keep it to one
 * sentence and under ~70 characters — Home sets it at a 24ch measure and a
 * third line pushes the caption rail into the wheel.
 *
 * NOTE ON `/contact`. It is a full row here and always has been; what
 * changed on 2026-08-10 is that Home now lists it. The old Home carried
 * the channel addresses itself and excluded contact from its index to
 * avoid saying the same thing twice — the editorial Home states no
 * addresses, so the wheel is the only way in. See `Canvas.tsx`.
 */
import { CERTIFICATES, PROJECTS } from "../content/data";

export interface RouteConfig {
  path: string;
  pageId: string;
  title: string;
  tag: string;
  index: string;
  sub: string;
  count: string;
  /**
   * The wheel's label. Separate from `title` because the wheel sets it at
   * ~34px in a left column and the full titles ("CERTIFICATE ARCHIVE",
   * "PROJECT DATABASE") run the width of the composition at that size —
   * they collide with the photograph and shove the caption rail out of
   * the way. The readout right above still prints the full `title`, so
   * nothing is lost: the wheel is the control, the readout is the label.
   */
  short: string;
  /** One sentence, printed by Home under the module readout. */
  lede: string;
}

export const ROUTES: RouteConfig[] = [
  {
    path: "/profile",
    pageId: "profile",
    short: "PROFILE",
    title: "PROFILE",
    tag: "PAGE 01",
    index: "01",
    sub: "identity / experience",
    count: "RDY",
    lede: "Identity, experience, and the way the work actually gets made.",
  },
  {
    path: "/certifications",
    pageId: "certifications",
    short: "DISTINCTIONS",
    title: "CERTIFICATE ARCHIVE",
    tag: "PAGE 02",
    index: "02",
    sub: `${CERTIFICATES.length} credential${CERTIFICATES.length === 1 ? "" : "s"}`,
    count: String(CERTIFICATES.length),
    lede: "Credentials, scanned, filed, and readable end to end.",
  },
  {
    path: "/projects",
    pageId: "projects",
    short: "PROJECTS",
    title: "PROJECT DATABASE",
    tag: "PAGE 03",
    index: "03",
    sub: `${PROJECTS.length} record${PROJECTS.length === 1 ? "" : "s"}`,
    count: String(PROJECTS.length),
    lede: "A booking backend, an e-waste app, and an Odoo module.",
  },
  {
    path: "/contact",
    pageId: "contact",
    short: "CONTACT",
    title: "CONTACT TERMINAL",
    tag: "PAGE 04",
    index: "04",
    sub: "channels open",
    count: "ON",
    lede: "GitHub, LinkedIn, email. No form, no funnel.",
  },
];
