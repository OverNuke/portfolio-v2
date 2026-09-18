import { BrowserRouter, Route, Routes } from "react-router";
import { Home } from "@/home/Home";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ContactDock } from "@/sections/contact/ContactDock";
import { DistinctionSection } from "@/sections/distinction/DistinctionSection";
import { ProfileSection } from "@/sections/profile/ProfileSection";
import { ProjectsSection } from "@/sections/projects/ProjectsSection";
import { AppShell } from "@/shell/AppShell";
import { TurnProvider } from "@/turn/TurnProvider";

function AppContent() {
  return (
    <TurnProvider>
      <AppShell
        home={<Home />}
        page={
          <Routes>
            <Route path="/profile" element={<ProfileSection />} />
            <Route path="/certifications" element={<DistinctionSection />} />
            <Route path="/projects" element={<ProjectsSection />} />
            <Route path="/contact" element={<ContactDock />} />
          </Routes>
        }
      />
    </TurnProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </BrowserRouter>
  );
}
