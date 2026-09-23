import MirrorView from "../components/MirrorView.jsx";
import SkinAnalysis from "../components/SkinAnalysis.jsx";
import ExpressionCard from "../components/ExpressionCard.jsx";
import { ArrowRight, ListChecks } from "lucide-react";

export default function SkinAnalysisPage({ onNavigate, demo = false }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <MirrorView demo={demo} />
      </div>
      <div className="flex flex-col gap-6">
        {!demo && <ExpressionCard />}
      </div>
      <div className="lg:col-span-3">
        <SkinAnalysis demo={demo} />
        <div className="mt-5 flex justify-end">
          {!demo && <button
            type="button"
            onClick={() => onNavigate("routine")}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-400 transition-colors hover:bg-cyan-400/20 focus-ring"
          >
            <ListChecks size={17} />
            Go to Skincare Routine
            <ArrowRight size={16} />
          </button>}
          <a
            href="#products"
            onClick={() => onNavigate("products")}
            className="relative z-[60] ml-3 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-200 focus-ring"
          >
            View Product Recommendations <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
