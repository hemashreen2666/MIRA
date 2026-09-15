import WellnessInsights from "../components/WellnessInsights.jsx";
import SkinAnalysis from "../components/SkinAnalysis.jsx";

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <WellnessInsights />
      <SkinAnalysis />
    </div>
  );
}
