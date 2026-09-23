import { useEffect, useState } from "react";
import { ClipboardList, UserRound } from "lucide-react";
import { getCurrentSession, getMySkinAnalysisHistory } from "../services/mira.js";

const metricIds = ["acne", "redness", "darkCircles", "unevenTone", "brightness", "fatigue", "oily"];

function skinScore(metrics = []) {
  const concerns = metrics.filter((metric) => metric.id !== "brightness");
  if (!concerns.length) return "—";
  return `${Math.round(100 - concerns.reduce((sum, metric) => sum + metric.level, 0) / concerns.length)}/100`;
}

function formatIst(value) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }).format(date),
    time: new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }).format(date),
  };
}

export default function HistoryPage() {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  const session = getCurrentSession();

  useEffect(() => {
    getMySkinAnalysisHistory(1, 100)
      .then(setHistory)
      .catch((requestError) => setError(requestError.message));
  }, []);

  const items = history?.items || [];
  return (
    <section className="rounded-3xl panel-quiet shadow-quiet p-6 md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400"><ClipboardList size={20} /></span>
          <div>
            <h2 className="font-display text-xl font-semibold">Analysis History</h2>
            <p className="text-sm text-ink-400">Your saved visible-feature analysis sessions.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-line bg-base-900/50 px-3 py-2 text-xs text-ink-200">
          <UserRound size={14} className="text-cyan-400" /> {session?.name || session?.username || "Current user"}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 border-y border-line py-4">
        <span className="font-display text-2xl font-semibold text-cyan-400">{history?.total ?? "—"}</span>
        <span className="text-sm text-ink-400">saved analyses</span>
      </div>

      {error ? <p className="mt-6 text-sm text-amber-400">{error}</p> : history && items.length === 0 ? <p className="mt-6 text-sm text-ink-400">No analysis history available yet.</p> : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
          <table className="min-w-[1180px] w-full text-left text-xs">
            <thead className="bg-base-800/80 text-ink-300"><tr>
              {["Date", "Time", "Skin Score", "Acne-like Spots", "Redness", "Dark Circles", "Uneven Skin Tone", "Facial Brightness", "Fatigue", "Oily Appearance", "Recommendation"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">{heading}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-line">
              {items.map((item) => {
                const displayed = formatIst(item.analyzed_at);
                const levels = Object.fromEntries(item.metrics.map((metric) => [metric.id, metric.level]));
                return <tr key={item.analysis_id} className="bg-base-900/30 text-ink-200">
                  <td className="whitespace-nowrap px-4 py-3">{displayed.date}</td><td className="whitespace-nowrap px-4 py-3">{displayed.time}</td><td className="px-4 py-3 font-semibold text-cyan-300">{skinScore(item.metrics)}</td>
                  {metricIds.map((id) => <td key={id} className="px-4 py-3">{levels[id] ?? "—"}</td>)}
                  <td className="max-w-xs px-4 py-3 text-ink-400">{item.recommendation || "—"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
