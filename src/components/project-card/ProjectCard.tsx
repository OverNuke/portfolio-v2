import type { Project } from "../../content/types";
import { formatProjectId, getProjectStatus, STATUS_LABEL } from "../../content/projects";
import "./project-card.css";

export interface ProjectCardProps {
  project: Project;
  index: number;
}

/**
 * Doc 04's Project Card contract: PROJECT_ID / IMAGE / TITLE / STACK /
 * STATUS. `project.href` is a placeholder ("#") until a live demo exists
 * for any of the current projects, so linking there would ship a dead
 * `href="#"` anchor (flagged by jsx-a11y/anchor-is-valid, and just
 * misleading either way) — the card links out to `repo` when the project
 * is Live, and renders as a plain (non-interactive) record when Private,
 * matching what the STATUS bar already tells the reader.
 */
export function ProjectCard({ project, index }: ProjectCardProps) {
  const status = getProjectStatus(project);
  const isFeatured = index === 0 && project.featured;

  const body = (
    <>
      <span className="project-card__id">{formatProjectId(index)}</span>
      <figure className="plate--photo project-card__figure">
        <img src={project.image} alt={project.imageAlt} loading="lazy" />
        <figcaption>{project.subtitle}</figcaption>
      </figure>
      <h3 className="project-card__title">{project.title}</h3>
      <p className="project-card__description">{project.description}</p>
      <ul className="badge-field project-card__stack">
        {project.tags.map((tag) => (
          <li key={tag} className="badge">
            {tag}
          </li>
        ))}
      </ul>
      <span className={`bar project-card__status${isFeatured ? " bar--accent" : ""}`}>
        <span className="k">Status</span>
        <span className="v">{STATUS_LABEL[status]}</span>
      </span>
    </>
  );

  if (status === "Live" && project.repo) {
    return (
      <a
        className="project-card"
        href={project.repo}
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
      </a>
    );
  }

  return <article className="project-card">{body}</article>;
}
