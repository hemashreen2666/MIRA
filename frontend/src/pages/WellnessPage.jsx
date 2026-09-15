import ExpressionCard from "../components/ExpressionCard.jsx";
import HandTracking from "../components/HandTracking.jsx";
import PrivacyCard from "../components/PrivacyCard.jsx";
import Recommendations from "../components/Recommendations.jsx";

export default function WellnessPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="flex flex-col gap-6">
        <ExpressionCard />
      </div>
      <div className="flex flex-col gap-6">
        <HandTracking />
      </div>
      <div className="flex flex-col gap-6">
        <PrivacyCard />
      </div>
      <div className="lg:col-span-3">
        <Recommendations />
      </div>
    </div>
  );
}
