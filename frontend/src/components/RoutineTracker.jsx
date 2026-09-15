import { useEffect, useState } from "react";
import {
  Check,
  Droplet,
  Sparkles,
  Sun,
  Waves,
  Play,
} from "lucide-react";

import {
  getRoutineProgress,
  completeRoutineStep,
} from "../services/mira.js";

const icons = {
  Cleanse: Waves,
  Hydrate: Droplet,
  Moisturize: Sparkles,
  "Sun Protection": Sun,
};

export default function RoutineTracker({
  routineStarted = false,
  onRoutineStart,
  onStepsLoaded,
}) {
  const [data, setData] = useState(null);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    loadRoutine();
  }, []);

  async function loadRoutine() {
    try {
      const res =
        await getRoutineProgress();

      const routineSteps =
        res.steps || [];

      setData(res);
      setSteps(routineSteps);

      onStepsLoaded?.(
        routineSteps
      );
    } catch (err) {
      console.error(
        "Unable to load routine:",
        err
      );
    }
  }

  async function toggleStep(id) {
    const target =
      steps.find(
        (s) => s.id === id
      );

    if (!target) return;

    const nextComplete =
      !target.complete;

    /*
     * Optimistic update.
     */
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id
          ? {
              ...step,
              complete:
                nextComplete,
            }
          : step
      )
    );

    try {
      await completeRoutineStep(
        id,
        nextComplete
      );

      onStepsLoaded?.(
        steps.map((step) =>
          step.id === id
            ? {
                ...step,
                complete:
                  nextComplete,
              }
            : step
        )
      );
    } catch (err) {
      console.error(
        "Unable to update routine step:",
        err
      );

      /*
       * Revert if API fails.
       */
      setSteps((prev) =>
        prev.map((step) =>
          step.id === id
            ? {
                ...step,
                complete:
                  !nextComplete,
              }
            : step
        )
      );
    }
  }

  function startRoutine() {
    if (!steps.length) {
      return;
    }

    /*
     * Find first incomplete step.
     */
    const firstIncomplete =
      steps.findIndex(
        (step) =>
          !step.complete
      );

    const startingStep =
      firstIncomplete >= 0
        ? firstIncomplete
        : 0;

    onRoutineStart?.({
      steps,
      currentStep:
        startingStep,
    });
  }

  const completeCount =
    steps.filter(
      (step) => step.complete
    ).length;

  const percent =
    steps.length > 0
      ? Math.round(
          (completeCount /
            steps.length) *
            100
        )
      : 0;

  if (!data) {
    return (
      <div className="rounded-3xl panel-quiet shadow-quiet p-6 md:p-7">
        <p className="text-sm text-ink-400">
          Loading skincare routine...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl panel-quiet shadow-quiet p-6 md:p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="font-display font-semibold text-lg tracking-tight">
          Today's Skincare Routine
        </p>

        <span className="font-mono text-sm text-cyan-300">
          {percent}%
        </span>
      </div>

      <p className="text-xs text-ink-400 mb-5">
        Routine Progress
      </p>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-base-700 overflow-hidden mb-6">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-azure-500 transition-all duration-500"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      {/* Steps */}
      {steps.length === 0 ? (
        <div className="rounded-xl border border-line bg-base-900/50 p-4">
          <p className="text-sm text-ink-300">
            No skincare routine steps
            are available.
          </p>
        </div>
      ) : (
        <ol className="space-y-1">
          {steps.map(
            (step, i) => {
              const Icon =
                icons[
                  step.title
                ] ?? Sparkles;

              const isLast =
                i ===
                steps.length - 1;

              return (
                <li
                  key={step.id}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  {!isLast && (
                    <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" />
                  )}

                  {/* Complete button */}
                  <button
                    onClick={() =>
                      toggleStep(
                        step.id
                      )
                    }
                    className={`relative z-10 h-8 w-8 shrink-0 rounded-full border flex items-center justify-center transition-colors focus-ring ${
                      step.complete
                        ? "bg-moss-400/15 border-moss-400/40 text-moss-400"
                        : "bg-base-800 border-line text-ink-400"
                    }`}
                    aria-label={`Mark ${
                      step.title
                    } ${
                      step.complete
                        ? "incomplete"
                        : "complete"
                    }`}
                  >
                    {step.complete ? (
                      <Check
                        size={14}
                      />
                    ) : (
                      <Icon
                        size={14}
                      />
                    )}
                  </button>

                  {/* Step information */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        <span className="font-mono text-ink-500 mr-2">
                          {String(
                            step.id
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        {step.title}
                      </p>

                      <span className="text-[11px] text-ink-500 font-mono">
                        {
                          step.duration
                        }
                      </span>
                    </div>

                    <p className="text-xs text-ink-400 mt-1 leading-relaxed">
                      {
                        step.description
                      }
                    </p>
                  </div>
                </li>
              );
            }
          )}
        </ol>
      )}

      {/* Start Routine */}
      <button
        onClick={startRoutine}
        disabled={
          routineStarted ||
          steps.length === 0
        }
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-azure-500 text-base-950 text-sm font-medium py-2.5 focus-ring flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play size={16} />

        {routineStarted
          ? "Routine Running..."
          : "Start Routine"}
      </button>

      {routineStarted && (
        <p className="text-center text-xs text-cyan-300 mt-3">
          Hand tracking is active. Use
          gestures to control your routine.
        </p>
      )}
    </div>
  );
}