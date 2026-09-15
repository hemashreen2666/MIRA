import { useCallback, useEffect, useState } from "react";
import {
  Droplets,
  Flame,
  Moon,
  Palette,
  Sun,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { getSkinAnalysis } from "../services/mira.js";
import { useAnalysisComplete } from "../lib/analysisBus.js";

const icons = {
  acne: Sparkles,
  redness: Flame,
  darkCircles: Moon,
  unevenTone: Palette,
  brightness: Sun,
  oily: Droplets,
};

const toneMap = {
  High: { text: "text-amber-400", ring: "#E39F4C" },
  Moderate: { text: "text-azure-400", ring: "#3B7DE8" },
  Low: { text: "text-moss-400", ring: "#4FBD84" },
};

export default function SkinAnalysis({ compact = false }) {
  const [metrics, setMetrics] = useState([]);

  const load = useCallback(() => {
    getSkinAnalysis()
      .then(setMetrics)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useAnalysisComplete(load);

  return (
    <div className="rounded-3xl panel-quiet shadow-quiet p-6 md:p-7">
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="font-display font-semibold text-lg tracking-tight">Visible Skin Analysis</p>
      </div>
      <p className="text-xs text-ink-400 mb-6 max-w-md leading-relaxed">
        Analysis is based on visible facial features and is not a medical diagnosis.
      </p>

      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}>
        {metrics.map((m) => {
          const Icon = icons[m.id];
          const tone = toneMap[m.value];

          return (
            <div
              key={m.id}
              className="rounded-2xl border border-line bg-base-900/50 p-4 flex items-center gap-3.5"
            >
              <RadialGauge percent={m.level} color={tone.ring}>
                <Icon size={14} className={tone.text} />
              </RadialGauge>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-400 truncate">{m.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={`font-display font-semibold text-[15px] ${tone.text}`}>{m.value}</p>
                  <TrendBadge value={m.trend} />
                </div>
                <p className="text-[10px] font-mono text-ink-500 mt-1">{m.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadialGauge({ percent, color, children }) {
  const size = 44;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function TrendBadge({ value }) {
  if (value > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
        <TrendingUp size={10} /> {value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-moss-400">
        <TrendingDown size={10} /> {Math.abs(value)}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-ink-500">
      <Minus size={10} /> 0%
    </span>
  );
}
