import {
  LayoutGrid,
  ScanFace,
  HeartPulse,
  ListChecks,
  LineChart,
  Settings,
} from "lucide-react";
import { navItems } from "../data/mockData.js";

const icons = {
  dashboard: LayoutGrid,
  skin: ScanFace,
  wellness: HeartPulse,
  routine: ListChecks,
  insights: LineChart,
  settings: Settings,
};

// Skin Analysis and Skincare Routine are intentionally opened from the
// dashboard launch cards, keeping the persistent navigation uncluttered.
const visibleNavItems = navItems.filter((item) => item.id !== "skin" && item.id !== "routine");

export default function Sidebar({ active, onNavigate }) {
  return (
    <>
      {/* Desktop / tablet: horizontal tab strip with an underline indicator */}
      <nav className="hidden sm:flex items-center gap-1 px-6 md:px-10 border-b border-line overflow-x-auto">
        {visibleNavItems.map((item) => {
          const Icon = icons[item.id];
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex items-center gap-2 px-3.5 py-3.5 text-sm transition-colors focus-ring whitespace-nowrap ${
                isActive ? "text-ink-50" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              <Icon size={15} className={isActive ? "text-cyan-400" : ""} />
              {item.label}
              <span
                className={`absolute left-3.5 right-3.5 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-cyan-400 to-azure-500 transition-opacity ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Mobile: fixed bottom navigation */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-line px-2 py-2 flex justify-between">
        {visibleNavItems.map((item) => {
          const Icon = icons[item.id];
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] flex-1 focus-ring ${
                isActive ? "text-cyan-400" : "text-ink-400"
              }`}
            >
              <Icon size={17} />
              <span className="leading-none">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
