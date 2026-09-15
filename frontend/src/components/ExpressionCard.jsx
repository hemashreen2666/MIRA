import { useCallback, useEffect, useState } from "react";
import { getFacialExpression } from "../services/mira.js";
import { useAnalysisComplete } from "../lib/analysisBus.js";

const faces = {
  Happy: (
    <>
      <path d="M9 15c1.2 1.4 2.8 2 4 2s2.8-.6 4-2" strokeLinecap="round" />
      <circle cx="9.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  Neutral: (
    <>
      <path d="M9 15.5h6" strokeLinecap="round" />
      <circle cx="9.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  Sad: (
    <>
      <path d="M9 16.5c1.2-1.4 2.8-2 4-2s2.8.6 4 2" strokeLinecap="round" />
      <circle cx="9.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  Tired: (
    <>
      <path d="M9 15.5h6" strokeLinecap="round" />
      <path d="M8 9.5h3M13 9.5h3" strokeLinecap="round" />
    </>
  ),
};

export default function ExpressionCard() {
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    getFacialExpression()
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useAnalysisComplete(load);

  if (!data) return null;

  return (
    <div className="rounded-3xl panel-quiet shadow-quiet p-6 md:p-7 flex flex-col">
      <p className="font-display font-semibold text-lg tracking-tight mb-4">Current Expression</p>

      <div className="flex items-center gap-4">
        <svg viewBox="0 0 24 24" className="h-14 w-14 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="12" cy="12" r="9.2" stroke="rgba(95,227,224,0.3)" />
          {faces[data.current]}
        </svg>
        <div>
          <p className="font-display font-semibold text-xl">{data.current}</p>
          <p className="text-xs text-ink-400 mt-0.5">
            {Math.round(data.confidence * 100)}% confidence
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        {data.states.map((s) => (
          <span
            key={s}
            className={`flex-1 text-center text-[11px] py-1.5 rounded-lg border ${
              s === data.current
                ? "border-cyan-400/40 text-cyan-300 bg-cyan-400/10"
                : "border-line text-ink-500"
            }`}
          >
            {s}
          </span>
        ))}
      </div>

      <p className="text-[10.5px] text-ink-500 mt-4 leading-relaxed">
        Expression estimation is based on visible facial features.
      </p>
    </div>
  );
}
