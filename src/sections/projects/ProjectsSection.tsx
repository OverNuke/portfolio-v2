import { useEffect, useRef } from "react";
import acopiatechPhoto from "@/assets/plates/projects/acopiatech/pickup.png";
import barbershopPhoto from "@/assets/plates/projects/barbershop/user.png";
import odooPhoto from "@/assets/plates/projects/odoo/info.png";
import { motionAttr, useReducedMotion } from "@/a11y/useReducedMotion";
import { aimArm, boil } from "@/doodle/character";
import { GUY_ARM, GUY_BODY, GUY_EAR_L, GUY_EAR_R, layoutWord } from "@/doodle/shapes";
import { smooth } from "@/doodle/smooth";
import { type DictionaryKey } from "@/i18n/dictionary";
import { useI18n } from "@/i18n/I18nProvider";
import { useStageScale } from "@/layout/useStageScale";
import "./projects.css";

interface ProjectDef {
  id: string;
  n: string;
  titleKey: DictionaryKey;
  captionKey: DictionaryKey;
  roleKey: DictionaryKey;
  descKey: DictionaryKey;
  altKey: DictionaryKey;
  photo: string;
  tags: string[];
  repoHref: string | null;
  flagship?: boolean;
}

// 2.4.1 (obs #385): plain border-radius (via --blob-project-*, task 1.1)
// works fine for the circular photo + its border once static rounding is
// allowlisted — the SVG-ring note only applied to the declined clip-path
// branch, confirmed vestigial here.
const PROJECTS: ProjectDef[] = [
  {
    id: "p1", n: "01",
    titleKey: "projects.p1.title", captionKey: "projects.p1.caption", roleKey: "projects.p1.role",
    descKey: "projects.p1.desc", altKey: "projects.p1.alt",
    photo: barbershopPhoto, tags: ["Express", "JavaScript", "Docker", "MySQL"],
    // No verified per-project repo slug exists in any source artifact. Link
    // is real (the author's GitHub) rather than a guessed/dead path — but
    // copy is worded "GitHub", not "Repository", so it never overclaims a
    // specific repo exists at this URL (same honesty bar as 2.5.3's guard).
    repoHref: "https://github.com/overnuke", flagship: true,
  },
  {
    id: "p2", n: "02",
    titleKey: "projects.p2.title", captionKey: "projects.p2.caption", roleKey: "projects.p2.role",
    descKey: "projects.p2.desc", altKey: "projects.p2.alt",
    photo: acopiatechPhoto, tags: ["Flutter", "Dart", "Firebase", "Maps API"],
    repoHref: "https://github.com/overnuke",
  },
  {
    id: "p3", n: "03",
    titleKey: "projects.p3.title", captionKey: "projects.p3.caption", roleKey: "projects.p3.role",
    descKey: "projects.p3.desc", altKey: "projects.p3.alt",
    photo: odooPhoto, tags: ["Odoo", "Python", "PostgreSQL"],
    // Source-accurate: the mockup itself marks this one private, no repo
    // anchor at all — not a placeholder-link gap like p1/p2's slug.
    repoHref: null,
  },
];

// D4: hand-lettered "PROJECTS" headline, built once from the shared glyph
// skeletons — static (no rAF), so it needs no reduced-motion gating at all.
const HEAD_STROKES = layoutWord("PROJECTS", 0, 0, 1, 6).map((s) => smooth(s.pts, s.c));
const SWOOSH_D = smooth([[0, 40], [120, 48], [260, 36], [400, 49], [540, 33]], false);

function ProjectsHeadline() {
  return (
    <svg className="projects__headline" viewBox="0 0 560 100" aria-hidden="true">
      {HEAD_STROKES.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#586a30" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <path d={SWOOSH_D} fill="none" stroke="#c9351d" strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

const DOODLE_IDS = ["ear-l", "ear-r", "body", "arm"] as const;
type DoodleId = (typeof DOODLE_IDS)[number];
const GX = 720;
const GY = 840;

// D4/D6 shared-engine guy, idle only — no hover-aim/annotation system (D15:
// DOM-measured rings/arrows/underlines are the port's most fragile code and
// design's own "first thing I'd cut under schedule pressure"; cut here).
function doodleStrokes(t: number): Record<DoodleId, string> {
  const f = Math.floor(t * 7.5);
  const idleA = Math.sin(t * 1.6) * 0.12 - 0.15;
  const arm = boil(aimArm(GUY_ARM, idleA, 31, 2), GX, GY, 4, f, 1.2);
  return {
    "ear-l": smooth(boil(GUY_EAR_L, GX, GY, 2, f, 1.1), true),
    "ear-r": smooth(boil(GUY_EAR_R, GX, GY, 3, f, 1.1), true),
    body: smooth(boil(GUY_BODY, GX, GY, 1, f, 1.6), true),
    arm: smooth(arm, false),
  };
}

// Idle-breathing rAF loop, refs only (D6 — React never re-renders per
// frame). Reduced motion paints a single static frame and never starts it.
function useDoodleEngine(active: boolean, reduced: boolean, doodleMap: Map<string, SVGPathElement>) {
  useEffect(() => {
    if (!active) return;
    const paint = (t: number) => {
      const strokes = doodleStrokes(t);
      doodleMap.forEach((el, id) => el.setAttribute("d", strokes[id as DoodleId]));
    };
    paint(0);
    if (reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      paint((now - t0) / 1000);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, doodleMap]);
}

function ProjectCard({ project, absolute }: { project: ProjectDef; absolute: boolean }) {
  const { t } = useI18n();
  return (
    <article className="projects__card" data-blob data-project={absolute ? project.id : undefined}>
      {project.flagship && <span className="projects__badge" data-blob aria-hidden="true">{t("projects.badge")}</span>}
      <div className="projects__photo" data-blob>
        <img src={project.photo} alt={t(project.altKey)} />
      </div>
      <div className="projects__meta" aria-hidden="true">
        <span>{project.n}</span>
        <span>{t(project.roleKey)}</span>
      </div>
      <h3 className="projects__title">{t(project.titleKey)}</h3>
      <span className="projects__caption">{t(project.captionKey)}</span>
      <p className="projects__desc">{t(project.descKey)}</p>
      <ul className="projects__tags">
        {project.tags.map((tag) => (
          <li key={tag} className="projects__tag" data-blob>{tag}</li>
        ))}
      </ul>
      {project.repoHref ? (
        <a
          className="projects__repo"
          data-blob
          href={project.repoHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`${t("projects.repo.cta")} — ${t(project.titleKey)}`}
        >
          {t("projects.repo.cta")} ↗
        </a>
      ) : (
        <span className="projects__repo projects__repo--private">
          {t("projects.repo.private")}
          <span className="projects__repo-rule" aria-hidden="true" />
        </span>
      )}
    </article>
  );
}

// D4/D8/D13 port of Projects Section v2. Scaled mode reproduces the
// mockup's staggered off-grid collage (positions in CSS, D2's morph tokens
// for the rounded surfaces); reflow (<1100px) stacks the same cards as a
// real flow list — the headline/guy doodle are decorative and don't reflow.
export function ProjectsSection() {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const { stageRef, mode, scale } = useStageScale();
  const scaled = mode === "scaled";

  const doodleMap = useRef(new Map<string, SVGPathElement>()).current;
  const doodleRef = (id: string) => (el: SVGPathElement | null) => {
    if (el) doodleMap.set(id, el);
    else doodleMap.delete(id);
  };
  useDoodleEngine(scaled, reduced, doodleMap);

  return (
    <section className="projects" ref={stageRef} aria-label={t("projects.heading")}>
      <h2 className="projects__visually-hidden">{t("projects.heading")}</h2>

      {scaled ? (
        // D8: the mockup's fixed-1440 collage scaled down to fit, not
        // reflowed — `scale` comes from useStageScale, applied here since
        // no earlier batch actually wired it (audit task 4.1 caught it).
        // Eyebrow lives inside the stage (audit task 4.1): outside it, it
        // adds flow height on top of the fixed 900px stage and overflows.
        <div className="projects__stage" style={{ transform: `scale(${scale})` }}>
          <div className="projects__eyebrow" aria-hidden="true">{t("projects.eyebrow")}</div>
          <ProjectsHeadline />
          <div className="projects__grid" data-scaled>
            {PROJECTS.map((project) => (
              <ProjectCard key={project.id} project={project} absolute />
            ))}
          </div>
          <svg className="projects__doodle" data-motion={motionAttr(reduced)} viewBox="0 0 1440 900" aria-hidden="true">
            {DOODLE_IDS.map((id) => (
              <path key={id} ref={doodleRef(id)} fill="none" stroke="#586a30" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>
        </div>
      ) : (
        <div className="projects__reflow">
          <div className="projects__eyebrow" aria-hidden="true">{t("projects.eyebrow")}</div>
          {PROJECTS.map((project) => (
            <ProjectCard key={project.id} project={project} absolute={false} />
          ))}
        </div>
      )}
    </section>
  );
}
