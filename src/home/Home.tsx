import { LanguageToggle } from "@/i18n/LanguageToggle";
import { InkFlowBackground } from "@/sections/ink-flow/InkFlowBackground";
import "./home.css";
import { ModuleNav } from "./ModuleNav";

// Masthead carries name/role as real markup (spec: accessible independent of
// the decorative canvas), so nothing here depends on InkFlow or a future
// collage layer to be legible to assistive tech.
//
// D7: the wordmark's visual "KEVIN." abbreviation is aria-hidden — the <h1>'s
// one accessible name comes from the visually-hidden full-name span instead
// (mirrors .projects__visually-hidden's clip-rect pattern, not promoted to a
// shared utility).
export function Home() {
  return (
    <div className="home">
      <InkFlowBackground />
      <header className="home__masthead">
        <h1 className="home__wordmark">
          <span aria-hidden="true">
            Kevin<span className="home__wordmark-dot">.</span>
          </span>
          <span className="home__visually-hidden">Kevin Sebastián Frías García</span>
        </h1>
        <p>Software developer</p>
        <LanguageToggle />
      </header>
      <ModuleNav />
    </div>
  );
}
