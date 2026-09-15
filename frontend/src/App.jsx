import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import VoiceAssistant from "./components/VoiceAssistant.jsx";
import BootOverlay from "./components/BootOverlay.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SkinAnalysisPage from "./pages/SkinAnalysisPage.jsx";
import RoutinePage from "./pages/RoutinePage.jsx";
import WellnessPage from "./pages/WellnessPage.jsx";
import InsightsPage from "./pages/InsightsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";

const pages = {
  dashboard: Dashboard,
  skin: SkinAnalysisPage,
  wellness: WellnessPage,
  routine: RoutinePage,
  insights: InsightsPage,
  settings: SettingsPage,
  login: AuthPage,
  register: AuthPage,
};

const meta = {
  dashboard: { title: "Dashboard", sub: "Choose where you would like to begin" },
  skin: { title: "Skin Analysis", sub: "Visible facial features, not a diagnosis" },
  wellness: { title: "Wellness", sub: "Expression, gestures, and routine assistance" },
  routine: { title: "Skincare Routine", sub: "Today's guided steps" },
  insights: { title: "Insights", sub: "Trends across your recent sessions" },
  settings: { title: "Settings", sub: "Manage what MIRA can access" },
};

const isValidPage = (page) => page === "home" || Object.hasOwn(pages, page);

const pageFromLocation = () => {
  const page = window.location.hash.replace("#", "");
  return isValidPage(page) ? page : "home";
};

export default function App() {
  const [active, setActive] = useState(pageFromLocation);
  const [booted, setBooted] = useState(false);
  const Page = pages[active];
  const current = meta[active];
  const isAuthPage = active === "login" || active === "register";

  useEffect(() => {
    const handleBackOrForward = () => setActive(pageFromLocation());

    window.history.replaceState({ page: active }, "", active === "home" ? window.location.pathname : `#${active}`);
    window.addEventListener("popstate", handleBackOrForward);
    return () => window.removeEventListener("popstate", handleBackOrForward);
  }, [active]);

  const navigate = (page) => {
    if (!isValidPage(page) || page === active) return;

    window.history.pushState({ page }, "", page === "home" ? window.location.pathname : `#${page}`);
    setActive(page);
  };

  return (
    <div className="min-h-screen bg-base-900 bg-ambient bg-no-repeat bg-fixed font-body text-ink-50">
      {!booted && <BootOverlay onDone={() => setBooted(true)} />}

      <Header
        home={active === "home"}
        auth={isAuthPage}
        onDemoUser={() => navigate("dashboard")}
        onLogin={() => navigate("login")}
      />
      {active === "home" ? (
        <HomePage onNavigate={navigate} />
      ) : isAuthPage ? (
        <AuthPage mode={active} onNavigate={navigate} />
      ) : (
        <>
          <Sidebar active={active} onNavigate={navigate} />

          <main className="px-6 md:px-10 py-8 pb-24 sm:pb-10 max-w-[1440px] mx-auto">
            <div className="mb-7 flex items-baseline justify-between">
              <div>
                <h1 className="font-display font-semibold text-[26px] md:text-[28px] tracking-[-0.01em]">
                  {current.title}
                </h1>
                <p className="text-sm text-ink-400 mt-1">{current.sub}</p>
              </div>
            </div>
            <Page key={active} onNavigate={navigate} />
          </main>
        </>
      )}

      {active !== "home" && !isAuthPage && <VoiceAssistant />}
    </div>
  );
}
