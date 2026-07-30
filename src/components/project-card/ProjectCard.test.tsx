import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "../../content/types";

const liveProject: Project = {
  title: "Test Project",
  subtitle: "A test subtitle",
  description: "A test description.",
  tags: ["React", "TypeScript"],
  year: "2025",
  href: "#",
  repo: "https://github.com/example/test-project",
  featured: true,
  image: "/test-image.png",
  imageAlt: "Test project screenshot",
};

const privateProject: Project = {
  ...liveProject,
  title: "Private Project",
  repo: undefined,
};

describe("ProjectCard", () => {
  it("renders a positional PROJECT_ID, title, tags, and image alt text", () => {
    render(<ProjectCard project={liveProject} index={0} />);
    expect(screen.getByText("PROJECT_001")).toBeInTheDocument();
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByAltText("Test project screenshot")).toBeInTheDocument();
  });

  it("derives PROJECT_ID from position, not title", () => {
    render(<ProjectCard project={liveProject} index={4} />);
    expect(screen.getByText("PROJECT_005")).toBeInTheDocument();
  });

  it("maps Live status to the DEPLOYED label and links to the repo", () => {
    render(<ProjectCard project={liveProject} index={0} />);
    expect(screen.getByText("DEPLOYED")).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", liveProject.repo);
  });

  it("maps Private status to the PRIVATE label and renders no link", () => {
    render(<ProjectCard project={privateProject} index={0} />);
    expect(screen.getByText("PRIVATE")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
