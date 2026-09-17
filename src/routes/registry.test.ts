import { describe, expect, it } from "vitest";
import { findRoute, NAV_ROUTES, ROUTES, turnDirection } from "./registry";

describe("routes registry", () => {
  it("covers exactly the 5 canonical routes in turn order", () => {
    expect(ROUTES.map((r) => r.path)).toEqual(["/", "/profile", "/certifications", "/projects", "/contact"]);
  });

  it("labels /certifications as Distinctions per obs #385", () => {
    expect(findRoute("/certifications")?.labelEn).toBe("Distinctions");
  });

  it("excludes Home from NAV_ROUTES", () => {
    expect(NAV_ROUTES.some((r) => r.path === "/")).toBe(false);
    expect(NAV_ROUTES).toHaveLength(4);
  });

  it("turns forward from Home into a page, back from a page to Home", () => {
    expect(turnDirection("/", "/profile")).toBe("forward");
    expect(turnDirection("/profile", "/")).toBe("back");
  });
});
