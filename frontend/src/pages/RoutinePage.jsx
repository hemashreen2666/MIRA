import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HandTracking from "../components/HandTracking";
import RoutineCamera from "../components/RoutineCamera";
import RoutineTracker from "../components/RoutineTracker";
import VoiceAssistant from "../components/VoiceAssistant";
import { completeRoutineStep, getRoutineProgress, resetRoutine, runDemoSkinAnalysis, runSkinAnalysis } from "../services/mira.js";

const PREPARATION_SECONDS = 15;
const demoSteps = [
  { id: 1, title: "Cleanse", description: "Clean your face with a gentle cleanser and lukewarm water.", duration: "Manual", complete: false },
  { id: 2, title: "Hydrate", description: "Apply hydrating toner or essence to damp skin.", duration: "1 min", complete: false },
  { id: 3, title: "Moisturize", description: "Lock in moisture with a lightweight daily moisturizer.", duration: "2 min", complete: false },
  { id: 4, title: "Sun Protection", description: "Broad-spectrum SPF, reapply if heading outdoors.", duration: "1 min", complete: false },
];
const isCleanse = (step) => step.title.trim().toLowerCase() === "cleanse";
const durationInSeconds = (duration = "") => {
  const value = String(duration).toLowerCase(); const amount = Number.parseFloat(value) || 1;
  return Math.round(value.includes("sec") ? amount : amount * 60);
};

export default function RoutinePage({ demo = false }) {
  const [steps, setSteps] = useState([]);
  const [phase, setPhase] = useState("not_started");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [cameraCaptureRequested, setCameraCaptureRequested] = useState(false);
  const [error, setError] = useState("");
  const [sessionKey, setSessionKey] = useState(0);
  const completingRef = useRef(false);
  const phaseBeforePauseRef = useRef("running");
  const timedSteps = useMemo(() => steps.filter((step) => !isCleanse(step)), [steps]);
  const currentStep = timedSteps[currentIndex];
  const beginPreparation = useCallback((nextIndex) => { setCurrentIndex(nextIndex); setRemaining(PREPARATION_SECONDS); setPhase("preparing"); }, []);
  const pauseRoutine = useCallback(() => {
    if (phase !== "running" && phase !== "preparing") return;
    phaseBeforePauseRef.current = phase;
    setPhase("paused");
  }, [phase]);
  const resumeRoutine = useCallback(() => {
    if (phase === "paused") setPhase(phaseBeforePauseRef.current);
  }, [phase]);

  const startNewSession = useCallback(async () => {
    setError(""); setCameraCaptureRequested(false); setCurrentIndex(0); setRemaining(0); completingRef.current = false;
    try {
      const fresh = demo ? { steps: demoSteps.map((step) => ({ ...step })) } : await resetRoutine();
      setSteps(fresh.steps || []); setSessionKey((value) => value + 1); setPhase("cleansing");
    } catch (requestError) { setError(requestError.message || "Unable to start a new routine session."); }
  }, [demo]);

  useEffect(() => {
    if (demo) setSteps(demoSteps.map((step) => ({ ...step })));
    else getRoutineProgress().then((result) => setSteps(result.steps || [])).catch(() => setSteps([]));
  }, [demo]);

  const completeCurrentStep = useCallback(async () => {
    if (!currentStep || phase !== "running" || completingRef.current) return;
    completingRef.current = true;
    try {
      if (!demo) await completeRoutineStep(currentStep.id, true);
      setSteps((previous) => previous.map((step) => step.id === currentStep.id ? { ...step, complete: true } : step));
      if (currentIndex + 1 < timedSteps.length) beginPreparation(currentIndex + 1); else setPhase("complete");
    } catch (requestError) { setError(requestError.message || "Unable to save the completed step."); }
    finally { completingRef.current = false; }
  }, [beginPreparation, currentIndex, currentStep, demo, phase, timedSteps.length]);

  useEffect(() => {
    if ((phase !== "preparing" && phase !== "running") || remaining <= 0) return undefined;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, remaining]);
  useEffect(() => {
    if (remaining !== 0) return;
    if (phase === "preparing" && currentStep) { setRemaining(durationInSeconds(currentStep.duration)); setPhase("running"); }
    else if (phase === "running") completeCurrentStep();
  }, [completeCurrentStep, currentStep, phase, remaining]);

  const confirmCleansing = () => { setError(""); setPhase("analyzing"); setCameraCaptureRequested(true); };
  const handleAnalysisFrame = async (frame) => {
    try {
      await (demo ? runDemoSkinAnalysis(frame) : runSkinAnalysis(frame));
      const next = timedSteps.findIndex((step) => !step.complete);
      if (next < 0) setPhase("complete"); else beginPreparation(next);
    } catch (requestError) { setError(requestError.message || "Post-cleansing analysis could not be completed."); setPhase("cleansing"); }
    finally { setCameraCaptureRequested(false); }
  };

  return <div className="relative min-h-screen"><div className="grid gap-6 lg:grid-cols-2">
    <RoutineTracker steps={steps} phase={phase} currentStep={currentStep} remaining={remaining} onConfirmCleansing={confirmCleansing} onStartSession={startNewSession} />
    <HandTracking key={sessionKey} steps={timedSteps} currentStep={currentIndex} enabled={phase === "running" || phase === "preparing" || phase === "paused"} paused={phase === "paused"} onPause={pauseRoutine} onCompleteCurrent={completeCurrentStep} onNextStep={completeCurrentStep} onStartResume={resumeRoutine} />
  </div><RoutineCamera active={cameraCaptureRequested} onCapture={handleAnalysisFrame} onError={(message) => { setError(message); setPhase("cleansing"); setCameraCaptureRequested(false); }} />
  <VoiceAssistant key={`voice-${sessionKey}`} steps={timedSteps} currentStep={currentIndex} routineStarted={phase === "running"} setRoutineStarted={() => {}} setCurrentStep={() => {}} onCompleteStep={completeCurrentStep} onNextStep={completeCurrentStep} onStartResume={() => {}} />
  {error && <p className="mt-4 text-center text-sm text-amber-400">{error}</p>}</div>;
}
