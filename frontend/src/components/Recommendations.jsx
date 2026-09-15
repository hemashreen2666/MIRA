import { useCallback, useEffect, useState } from "react";
import { Droplets, Sun, Sparkles, Moon, Check, Plus } from "lucide-react";
import { getRecommendations, addRecommendationToRoutine } from "../services/mira.js";
import { useAnalysisComplete } from "../lib/analysisBus.js";

const icons = {
  hydration: Droplets,
  sun: Sun,
  cleanse: Sparkles,
  sleep: Moon,
};

const priorityTone = {
  High: "text-coral-400 border-coral-400/30 bg-coral-400/10",
  Medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  Low: "text-ink-400 border-line bg-base-800",
};

export default function Recommendations() {
  const [items, setItems] = useState([]);

  const load = useCallback(() => {
    getRecommendations()
      .then(setItems)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useAnalysisComplete(load);

  const toggle = (id) => {
    const target = items.find((r) => r.id === id);
    const next = target ? !target.addedToRoutine : true;

    // Optimistic update, then persist. The backend only records "added",
    // so we only call it when turning the flag on.
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, addedToRoutine: next } : r))
    );

    if (next) {
      addRecommendationToRoutine(id).catch(() => {
        setItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, addedToRoutine: false } : r))
        );
      });
    }
  };

  return (
    <div className="rounded-3xl panel-quiet shadow-quiet p-6 md:p-7">
      <p className="font-display font-semibold text-lg tracking-tight mb-5">AI-Powered Recommendations</p>

      <div className="grid gap-3 xl:grid-cols-2">
        {items.map((r) => {
          const Icon = icons[r.id] ?? Sparkles;
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-line bg-base-900/60 p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <span className="h-8 w-8 rounded-lg bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
                  <Icon size={15} />
                </span>
                <span className={`text-[10.5px] px-2 py-0.5 rounded-full border ${priorityTone[r.priority]}`}>
                  {r.priority}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-ink-400 mt-1 leading-relaxed">{r.body}</p>
              </div>
              <button
                onClick={() => toggle(r.id)}
                className={`mt-1 inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-ring ${
                  r.addedToRoutine
                    ? "bg-moss-400/10 text-moss-400 border border-moss-400/30"
                    : "bg-base-800 border border-line text-ink-200 hover:text-ink-50"
                }`}
              >
                {r.addedToRoutine ? <Check size={13} /> : <Plus size={13} />}
                {r.addedToRoutine ? "Added to routine" : "Add to Routine"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
