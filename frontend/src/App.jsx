import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import VoiceAssistant from "./components/VoiceAssistant.jsx";
import BootOverlay from "./components/BootOverlay.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SkinAnalysisPage from "./pages/SkinAnalysisPage.jsx";
import RoutinePage from "./pages/RoutinePage.jsx";
import InsightsPage from "./pages/InsightsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import { getCurrentSession, startDemoSession } from "./services/mira.js";

const pages = {
  dashboard: Dashboard,
  skin: SkinAnalysisPage,
  routine: RoutinePage,
  insights: InsightsPage,
  settings: SettingsPage,
  login: AuthPage,
  register: AuthPage,
  history: HistoryPage,
  products: ProductsPage,
};

const meta = {
  dashboard: { title: "Dashboard", sub: "Choose where you would like to begin" },
  skin: { title: "Skin Analysis", sub: "Visible facial features, not a diagnosis" },
  routine: { title: "Skincare Routine", sub: "Today's guided steps" },
  insights: { title: "Insights", sub: "Trends across your recent sessions" },
  settings: { title: "Settings", sub: "Manage what MIRA can access" },
  history: { title: "History", sub: "Your saved analysis sessions" },
  products: { title: "Product Recommendations", sub: "Cosmetic information from Open Beauty Facts" },
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
  const [authenticated, setAuthenticated] = useState(() => Boolean(getCurrentSession()?.token));
  const demo = !authenticated && active !== "home" && !isAuthPage;
  const demoPages = new Set(["dashboard", "skin", "routine", "products"]);

  useEffect(() => {
    const handleBackOrForward = () => setActive(pageFromLocation());

    window.history.replaceState({ page: active }, "", active === "home" ? window.location.pathname : `#${active}`);
    window.addEventListener("popstate", handleBackOrForward);
    window.addEventListener("hashchange", handleBackOrForward);
    return () => {
      window.removeEventListener("popstate", handleBackOrForward);
      window.removeEventListener("hashchange", handleBackOrForward);
    };
  }, [active]);

  useEffect(() => {
    if (!authenticated && !isAuthPage && active !== "home" && !demoPages.has(active)) {
      window.history.replaceState({ page: "login" }, "", "#login");
      setActive("login");
    }
  }, [active, authenticated, isAuthPage]);

  const navigate = (page) => {
    if (!authenticated && !isAuthPage && page !== "home" && !demoPages.has(page)) {
      page = "login";
    }
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
        demo={demo}
        onDemoUser={() => { startDemoSession(); setAuthenticated(false); navigate("dashboard"); }}
        onLogin={() => navigate("login")}
      />
      {active === "home" ? (
        <HomePage onNavigate={navigate} />
      ) : isAuthPage ? (
        <AuthPage mode={active} onNavigate={(page) => { if (page === "dashboard") setAuthenticated(true); navigate(page); }} />
      ) : (
        <>
          <Sidebar active={active} onNavigate={navigate} demo={demo} />

          <main className="px-6 md:px-10 py-8 pb-24 sm:pb-10 max-w-[1440px] mx-auto">
            <div className="mb-7 flex items-baseline justify-between">
              <div>
                <h1 className="font-display font-semibold text-[26px] md:text-[28px] tracking-[-0.01em]">
                  {current.title}
                </h1>
                <p className="text-sm text-ink-400 mt-1">{demo ? "You're exploring MIRA as a guest. No personal data is being used." : current.sub}</p>
              </div>
            </div>
            <Page key={active} onNavigate={navigate} demo={demo} />
          </main>
        </>
      )}

      {active !== "home" && !isAuthPage && !demo && <VoiceAssistant />}
    </div>
  );
}
