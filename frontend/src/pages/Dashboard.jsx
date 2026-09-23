import { useEffect, useState } from "react";
import {
  ArrowRight,
  ListChecks,
  ScanFace,
} from "lucide-react";

import VoiceAssistant from "../components/VoiceAssistant";
import { getPersonalizedSkinInsights } from "../services/mira.js";

const launchCards = [
  {
    id: "skin",
    title: "Skin Analysis",
    description:
      "Check visible skin features with a focused camera scan.",
    Icon: ScanFace,
    accent:
      "from-cyan-400/20 via-cyan-400/5 to-transparent",
    icon:
      "from-cyan-400 to-azure-500",
  },
  {
    id: "routine",
    title: "Skincare Routine",
    description:
      "Follow your simple, personalised routine one step at a time.",
    Icon: ListChecks,
    accent:
      "from-azure-500/20 via-violet-400/5 to-transparent",
    icon:
      "from-azure-500 to-violet-400",
  },
];

export default function Dashboard({ onNavigate, demo = false }) {

  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!demo) getPersonalizedSkinInsights().then(setInsights).catch(() => setInsights(null));
  }, [demo]);

  // -----------------------------------
  // Routine state
  // -----------------------------------
  const [routineStarted, setRoutineStarted] = useState(false);

  const [steps, setSteps] = useState([]);

  const [currentStep, setCurrentStep] = useState(0);


  // -----------------------------------
  // Routine start handler
  // -----------------------------------
  const handleRoutineStart = ({
    steps: routineSteps,
    currentStep: stepIndex,
  }) => {
    console.log("Dashboard - Routine started:", routineSteps);

    setSteps(routineSteps || []);

    setCurrentStep(stepIndex || 0);

    setRoutineStarted(true);
  };


  // -----------------------------------
  // Routine steps loaded
  // -----------------------------------
  const handleStepsLoaded = (routineSteps) => {
    console.log(
      "Dashboard - Routine steps loaded:",
      routineSteps
    );

    if (
      routineSteps &&
      routineSteps.length > 0
    ) {
      setSteps(routineSteps);
    }
  };


  // -----------------------------------
  // Complete routine step
  // -----------------------------------
  const handleCompleteStep = (step) => {
    console.log(
      "Dashboard - Voice completed step:",
      step
    );

    if (!step) {
      return;
    }

    setCurrentStep((previousStep) => {

      const nextStep = previousStep + 1;

      // Last step
      if (nextStep >= steps.length) {

        setRoutineStarted(false);

        return previousStep;
      }

      return nextStep;
    });
  };


  // -----------------------------------
  // Render Dashboard
  // -----------------------------------
  return (
    <div className="relative min-h-screen">

      {/* =====================================
          DASHBOARD CARDS
      ====================================== */}

      {demo ? (
        <section className="mb-6 rounded-[28px] border border-cyan-400/20 bg-cyan-400/5 p-6 md:p-8">
          <p className="font-display text-2xl font-semibold text-ink-50">Welcome to MIRA 👋</p>
          <p className="mt-2 text-sm text-ink-400">Try MIRA's AI Skin Analysis. Your demo scan is temporary and is not saved to an account.</p>
          <button type="button" onClick={() => onNavigate("skin")} className="mt-5 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-base-950 focus-ring">Start Demo Scan</button>
        </section>
      ) : insights && (
        <section className="mb-6 rounded-[28px] border border-line bg-base-850 p-6 md:p-8">
          <p className="font-display text-2xl font-semibold text-ink-50">{insights.greeting}</p>
          <p className="mt-1 text-sm text-ink-400">{insights.welcome}</p>
          {!insights.has_analysis ? (
            <div className="mt-5 rounded-2xl border border-line bg-base-900/50 p-4 text-sm text-ink-300">{insights.progress_message}</div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <h2 className="font-display text-lg font-semibold">My Skin Progress</h2>
                <p className="mt-1 text-xs text-ink-400">{insights.progress_message}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {insights.metrics.map((metric) => (
                    <div key={metric.id} className="rounded-xl border border-line bg-base-900/50 p-3">
                      <p className="text-xs text-ink-400">{metric.label}</p>
                      <p className="mt-1 text-sm font-semibold text-ink-100">Current: {metric.current}</p>
                      <p className="text-xs text-ink-400">{metric.previous === null ? "Trend: Not enough data" : `Previous: ${metric.previous} · ${metric.trend.replaceAll("_", " ")}`}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                <h2 className="font-display text-lg font-semibold">Today's Reminder</h2>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-ink-200">
                  {insights.reminders.map((reminder) => <li key={`${reminder.type}-${reminder.routine_step}`}>{reminder.message}</li>)}
                </ul>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => onNavigate("routine")} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-base-950 focus-ring">Start My Skincare Routine</button>
                  <button type="button" onClick={() => onNavigate("history")} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-200 focus-ring">View My History</button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="grid min-h-[420px] grid-cols-1 gap-6 lg:grid-cols-2">

        {(demo ? launchCards.filter((card) => card.id === "skin") : launchCards).map(
          ({
            id,
            title,
            description,
            Icon,
            accent,
            icon,
          }) => (

            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="
                group
                relative
                min-h-[280px]
                overflow-hidden
                rounded-[28px]
                border
                border-line
                bg-base-850
                p-8
                text-left
                transition
                duration-300
                hover:-translate-y-1
                hover:border-cyan-400/50
                hover:shadow-[0_24px_70px_rgba(39,207,207,0.12)]
                focus-ring
                md:p-10
              "
            >

              {/* Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${accent}`}
              />

              {/* Decorative circles */}
              <div
                className="
                  absolute
                  -right-12
                  -top-12
                  h-48
                  w-48
                  rounded-full
                  border
                  border-cyan-300/10
                "
              />

              <div
                className="
                  absolute
                  -right-4
                  -top-4
                  h-32
                  w-32
                  rounded-full
                  border
                  border-cyan-300/10
                "
              />

              {/* Content */}
              <div
                className="
                  relative
                  flex
                  h-full
                  flex-col
                  items-start
                "
              >

                {/* Icon */}
                <span
                  className={`
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    ${icon}
                    text-base-950
                    shadow-lg
                  `}
                >
                  <Icon
                    size={26}
                    strokeWidth={2.2}
                  />
                </span>


                {/* Text */}
                <div className="mt-auto pt-16">

                  <p
                    className="
                      font-display
                      text-3xl
                      font-semibold
                      tracking-tight
                      text-ink-50
                    "
                  >
                    {title}
                  </p>

                  <p
                    className="
                      mt-3
                      max-w-sm
                      text-sm
                      leading-6
                      text-ink-400
                    "
                  >
                    {description}
                  </p>

                  <span
                    className="
                      mt-7
                      inline-flex
                      items-center
                      gap-2
                      text-sm
                      font-semibold
                      text-cyan-400
                    "
                  >
                    Open {title}

                    <ArrowRight
                      size={17}
                      className="
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    />
                  </span>

                </div>
              </div>
            </button>
          )
        )}

      </div>


      {/* =====================================
          VOICE ASSISTANT
      ====================================== */}

      <VoiceAssistant
        steps={steps}
        currentStep={currentStep}
        routineStarted={routineStarted}
        setRoutineStarted={setRoutineStarted}
        setCurrentStep={setCurrentStep}
        onCompleteStep={handleCompleteStep}
      />

    </div>
  );
}
