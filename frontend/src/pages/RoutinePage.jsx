import { useState } from "react";
import HandTracking from "../components/HandTracking";
import RoutineTracker from "../components/RoutineTracker";
import VoiceAssistant from "../components/VoiceAssistant";

export default function Routine() {
  // -----------------------------
  // Routine state
  // -----------------------------
  const [routineStarted, setRoutineStarted] = useState(false);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  // -----------------------------
  // Start routine
  // -----------------------------
  const handleRoutineStart = ({
    steps: routineSteps,
    currentStep: stepIndex,
  }) => {
    console.log("Routine started:", routineSteps);

    setSteps(routineSteps || []);
    setCurrentStep(stepIndex || 0);
    setRoutineStarted(true);
  };

  // -----------------------------
  // Receive routine steps
  // from RoutineTracker
  // -----------------------------
  const handleStepsLoaded = (routineSteps) => {
    console.log("Routine steps loaded:", routineSteps);

    if (routineSteps && routineSteps.length > 0) {
      setSteps(routineSteps);
    }
  };

  // -----------------------------
  // Complete current step
  // -----------------------------
  const handleCompleteStep = (step) => {
    console.log("Voice requested completion:", step);

    if (!step) {
      console.log("No current step available");
      return;
    }

    setCurrentStep((previousStep) => {
      const nextStep = previousStep + 1;

      // Last step completed
      if (nextStep >= steps.length) {
        setRoutineStarted(false);
        return previousStep;
      }

      return nextStep;
    });
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="relative min-h-screen">
      {/* Main routine area */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Routine tracker */}
        <RoutineTracker
          routineStarted={routineStarted}
          onRoutineStart={handleRoutineStart}
          onStepsLoaded={handleStepsLoaded}
        />

        {/* Hand tracking */}
        <HandTracking
          steps={steps}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          routineStarted={routineStarted}
          setRoutineStarted={setRoutineStarted}
        />
      </div>

      {/* Voice Assistant */}
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