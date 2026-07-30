import { render, screen } from "@testing-library/react";
import { SiReact } from "@icons-pack/react-simple-icons";
import { describe, expect, it } from "vitest";
import { SkillBadge } from "./SkillBadge";
import type { Skill } from "../../content/types";

describe("SkillBadge", () => {
  it("renders the skill name as visible text", () => {
    render(<SkillBadge skill={{ name: "React", category: "framework", icon: SiReact }} />);
    expect(screen.getByText("React", { selector: ".badge__name" })).toBeInTheDocument();
  });

  it("hides the brand icon from assistive tech (name is already visible text)", () => {
    const { container } = render(
      <SkillBadge skill={{ name: "React", category: "framework", icon: SiReact }} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders without an icon when the skill has none", () => {
    const skill: Skill = { name: "VS Code", category: "tool" };
    const { container } = render(<SkillBadge skill={skill} />);
    expect(screen.getByText("VS Code")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
