/**
 * Task 2.1 (sdd/phase2-app-shell), design's file layout + doc 11's NavItem
 * prop table (`index`, `label`/`title`, `sub`, `count`, `pageId`). One row
 * per real page route (Home/"/" is not a row here — Shell IS Home, per
 * design; it has no NavItem/PageLayer entry of its own).
 *
 * `tag` doubles as the page's PageLayer tag (design D8 / doc 11's
 * `TITLES` map, e.g. "PAGE 01") and `title` is the page's own heading
 * text. `index`/`sub`/`count` feed the future NavItem (task 2.6) — values
 * below are ported directly from `docs/home.design-proof-v3.html`'s
 * `#nav-stack` markup and `TITLES` map, with `pageId`/`path` aligned to
 * this app's real routes (the proof calls the projects page "database";
 * here it is "projects" to match the route path).
 */
export interface RouteConfig {
  path: string;
  pageId: string;
  title: string;
  tag: string;
  index: string;
  sub: string;
  count: string;
}

export const ROUTES: RouteConfig[] = [
  {
    path: "/profile",
    pageId: "profile",
    title: "PROFILE",
    tag: "PAGE 01",
    index: "01",
    sub: "identity / experience",
    count: "RDY",
  },
  {
    path: "/projects",
    pageId: "projects",
    title: "PROJECT DATABASE",
    tag: "PAGE 02",
    index: "02",
    sub: "12 records",
    count: "12",
  },
  {
    path: "/skills",
    pageId: "skills",
    title: "SKILLS",
    tag: "PAGE 03",
    index: "03",
    sub: "stack / tooling",
    count: "RDY",
  },
  {
    path: "/contact",
    pageId: "contact",
    title: "CONTACT TERMINAL",
    tag: "PAGE 04",
    index: "04",
    sub: "channels open",
    count: "ON",
  },
];
