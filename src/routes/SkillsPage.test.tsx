import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkillsPage } from "./SkillsPage";
import { SKILLS } from "../content/data";

describe("SkillsPage", () => {
  it("renders every skill in SKILLS, grouped under a category heading", () => {
    render(<SkillsPage />);
    for (const skill of SKILLS) {
      expect(screen.getByText(skill.name, { selector: ".badge__name" })).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "Languages", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frameworks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tools", level: 3 })).toBeInTheDocument();
  });
});
