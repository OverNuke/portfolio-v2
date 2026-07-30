import { Panel } from "../components/panel/Panel";
import { ProjectCard } from "../components/project-card/ProjectCard";
import { PROJECTS } from "../content/data";
import { ROUTES } from "./routes";
import "./projects-page.css";

const route = ROUTES.find((r) => r.pageId === "projects")!;

export function ProjectsPage() {
  return (
    <Panel
      title={route.title}
      status={route.tag}
      metadata={<span>{route.sub}</span>}
      content={
        <ul className="projects-page__grid">
          {PROJECTS.map((project, index) => (
            <li key={project.title}>
              <ProjectCard project={project} index={index} />
            </li>
          ))}
        </ul>
      }
    />
  );
}
