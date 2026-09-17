import { BrowserRouter, Route, Routes } from "react-router";
import { Home } from "@/home/Home";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ContactDock } from "@/sections/contact/ContactDock";
import { ProfileSection } from "@/sections/profile/ProfileSection";
import { AppShell } from "@/shell/AppShell";
import { TurnProvider } from "@/turn/TurnProvider";

// Placeholder page elements until each section lands (Phase 2, tasks 2.1-2.5).
function Placeholder({ title }: { title: string }) {
  return <div className="page-placeholder">{title}</div>;
}

function AppContent() {
  return (
    <TurnProvider>
      <AppShell
        home={<Home />}
        page={
          <Routes>
            <Route path="/profile" element={<ProfileSection />} />
            <Route path="/certifications" element={<Placeholder title="Distinctions" />} />
            <Route path="/projects" element={<Placeholder title="Projects" />} />
            <Route path="/contact" element={<ContactDock />} />
          </Routes>
        }
      />
    </TurnProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </BrowserRouter>
  );
}
