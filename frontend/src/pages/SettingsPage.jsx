import { useState } from "react";
import { settingsToggles } from "../data/mockData.js";

export default function SettingsPage() {
  const [toggles, setToggles] = useState(settingsToggles);

  const flip = (id) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  return (
    <div className="max-w-2xl">
      <div className="rounded-3xl panel-quiet shadow-quiet p-6 md:p-7">
        <p className="font-display font-semibold text-lg tracking-tight mb-1">Settings</p>
        <p className="text-xs text-ink-400 mb-6">
          Control what MIRA can access on this device.
        </p>

        <div className="divide-y divide-line">
          {toggles.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="pr-4">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-ink-400 mt-0.5">{t.description}</p>
              </div>
              <button
                onClick={() => flip(t.id)}
                role="switch"
                aria-checked={t.enabled}
                aria-label={t.label}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-ring ${
                  t.enabled ? "bg-cyan-500" : "bg-base-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full transition-transform ${
                    t.enabled ? "translate-x-[22px] bg-white" : "translate-x-0.5 bg-ink-200"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
