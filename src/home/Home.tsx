import { LanguageToggle } from "@/i18n/LanguageToggle";
import { InkFlowBackground } from "@/sections/ink-flow/InkFlowBackground";
import { ModuleNav } from "./ModuleNav";

// Masthead carries name/role as real markup (spec: accessible independent of
// the decorative canvas), so nothing here depends on InkFlow or a future
// collage layer to be legible to assistive tech.
export function Home() {
  return (
    <div className="home">
      <InkFlowBackground />
      <header className="home__masthead">
        <h1>Kevin Sebastián Frías García</h1>
        <p>Software developer</p>
        <LanguageToggle />
      </header>
      <ModuleNav />
    </div>
  );
}
