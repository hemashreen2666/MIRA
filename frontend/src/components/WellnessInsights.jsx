import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { getWellnessInsights } from "../services/mira.js";
import { useAnalysisComplete } from "../lib/analysisBus.js";

const tooltipStyle = {
  background: "#0F1620",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  fontSize: 12,
  color: "#F4F7FA",
};

export default function WellnessInsights({ compact = false }) {
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    getWellnessInsights()
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useAnalysisComplete(load);

  if (!data) return null;

  return (
    <div className="rounded-3xl panel-quiet shadow-quiet p-6 md:p-7">
      <p className="font-display font-semibold text-lg tracking-tight mb-1">Wellness Insights</p>
      <p className="text-xs text-ink-400 mb-5">
        Trends from your routine activity — not a medical measurement.
      </p>

      <div className={`grid gap-6 ${compact ? "grid-cols-1" : "xl:grid-cols-2"}`}>
        <div>
          <p className="text-xs text-ink-400 mb-2">Consistency &amp; brightness trend</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#65748A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#65748A" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="consistency"
                  stroke="#5FE3E0"
                  strokeWidth={2}
                  dot={false}
                  name="Consistency"
                />
                <Line
                  type="monotone"
                  dataKey="brightness"
                  stroke="#5B9CF6"
                  strokeWidth={2}
                  dot={false}
                  name="Brightness"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 text-[11px] text-ink-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Consistency
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-azure-400" /> Brightness
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-ink-400 mb-2">Routine completion by step</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.completion} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#65748A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#65748A" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#5FE3E0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
