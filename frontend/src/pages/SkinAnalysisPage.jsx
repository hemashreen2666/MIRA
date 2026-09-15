import MirrorView from "../components/MirrorView.jsx";
import SkinAnalysis from "../components/SkinAnalysis.jsx";
import ExpressionCard from "../components/ExpressionCard.jsx";
import { ArrowRight, ListChecks } from "lucide-react";

export default function SkinAnalysisPage({ onNavigate }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <MirrorView />
      </div>
      <div className="flex flex-col gap-6">
        <ExpressionCard />
      </div>
      <div className="lg:col-span-3">
        <SkinAnalysis />
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => onNavigate("routine")}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-400 transition-colors hover:bg-cyan-400/20 focus-ring"
          >
            <ListChecks size={17} />
            Go to Skincare Routine
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
