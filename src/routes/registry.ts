export interface RouteEntry {
  path: string;
  /** English nav/page label. */
  labelEn: string;
  /** Spanish nav/page label. */
  labelEs: string;
  /** Page number as printed on-page, e.g. "01". Home has none. */
  page: string | null;
  /** Turn order, ascending — used for direction (forward/back) between routes. */
  order: number;
}

// Single source for path/label/turn-order (D7). "/certifications" on-page
// label is "Distinctions" per obs #385, overriding docs/03's older
// "CERTIFICATE ARCHIVE" note — route path itself is unchanged.
export const ROUTES: RouteEntry[] = [
  { path: "/", labelEn: "Home", labelEs: "Inicio", page: null, order: 0 },
  { path: "/profile", labelEn: "Profile", labelEs: "Perfil", page: "01", order: 1 },
  { path: "/certifications", labelEn: "Distinctions", labelEs: "Distinciones", page: "02", order: 2 },
  { path: "/projects", labelEn: "Projects", labelEs: "Proyectos", page: "03", order: 3 },
  { path: "/contact", labelEn: "Contact", labelEs: "Contacto", page: "04", order: 4 },
];

export const HOME_ROUTE = ROUTES[0];
export const NAV_ROUTES = ROUTES.slice(1);

export function findRoute(path: string): RouteEntry | undefined {
  return ROUTES.find((r) => r.path === path);
}

// Turn direction between two paths: forward ("left") when moving to a higher
// order (Home -> a page, page -> next page); back ("right") otherwise (D7 /
// docs/03 "Turn direction" — manga order, spatial convention only).
export function turnDirection(from: string, to: string): "forward" | "back" {
  const a = findRoute(from)?.order ?? 0;
  const b = findRoute(to)?.order ?? 0;
  return b >= a ? "forward" : "back";
}
