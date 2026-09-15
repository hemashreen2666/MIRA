import { useState } from "react";
import {
  ArrowRight,
  ListChecks,
  ScanFace,
} from "lucide-react";

import VoiceAssistant from "../components/VoiceAssistant";

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

export default function Dashboard({ onNavigate }) {

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

      <div className="grid min-h-[420px] grid-cols-1 gap-6 lg:grid-cols-2">

        {launchCards.map(
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