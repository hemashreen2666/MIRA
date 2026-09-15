import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

export default function VoiceAssistant({
  steps = [],
  currentStep = 0,
  routineStarted = false,
  setRoutineStarted,
  setCurrentStep,
  onCompleteStep,
}) {
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("Click the microphone and speak");

  const recognitionRef = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) {
      setMessage("Voice recognition is not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("VOICE: listening started");
      setListening(true);
      setMessage("Listening...");
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();

      console.log("VOICE COMMAND:", text);

      setMessage(`Heard: "${text}"`);

      handleCommand(text);
    };

    recognition.onerror = (event) => {
      console.error("VOICE ERROR:", event.error);

      setListening(false);

      if (event.error === "not-allowed") {
        setMessage("Please allow microphone permission");
      } else if (event.error === "no-speech") {
        setMessage("I didn't hear anything");
      } else {
        setMessage(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log("VOICE: listening stopped");
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
  };

  const handleCommand = (command) => {
    // START ROUTINE
    if (
      command.includes("start routine") ||
      command.includes("start") ||
      command.includes("begin routine")
    ) {
      if (steps.length === 0) {
        setMessage("Please load the routine first");
        speak("Please load the routine first");
        return;
      }

      setRoutineStarted(true);
      setCurrentStep(0);

      setMessage("Routine started");
      speak("Routine started");

      return;
    }

    // NEXT STEP
    if (
      command.includes("next step") ||
      command.includes("next")
    ) {
      if (steps.length === 0) {
        speak("No routine steps are available");
        return;
      }

      setCurrentStep((prev) => {
        const next = prev + 1;

        if (next >= steps.length) {
          speak("This is the last step");
          return prev;
        }

        speak(`Moving to step ${next + 1}`);
        return next;
      });

      return;
    }

    // COMPLETE STEP
    if (
      command.includes("complete step") ||
      command.includes("complete") ||
      command.includes("done")
    ) {
      if (!steps.length) {
        speak("No routine is loaded");
        return;
      }

      const current = steps[currentStep];

      if (current) {
        console.log("Completing step:", current);

        if (onCompleteStep) {
          onCompleteStep(current);
        }

        speak("Step completed");

        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          setRoutineStarted(false);
          speak("Routine completed");
        }
      }

      return;
    }

    // PAUSE
    if (
      command.includes("pause") ||
      command.includes("stop routine")
    ) {
      setRoutineStarted(false);
      setMessage("Routine paused");
      speak("Routine paused");
      return;
    }

    // RESUME
    if (command.includes("resume")) {
      setRoutineStarted(true);
      setMessage("Routine resumed");
      speak("Routine resumed");
      return;
    }

    // CURRENT STEP
    if (
      command.includes("current step") ||
      command.includes("what step")
    ) {
      const current = steps[currentStep];

      if (current) {
        const name =
          current.name ||
          current.title ||
          current.product ||
          `Step ${currentStep + 1}`;

        setMessage(`Current step: ${name}`);
        speak(`Your current step is ${name}`);
      } else {
        speak("No current step available");
      }

      return;
    }

    // HELP
    if (command.includes("help")) {
      speak(
        "You can say start routine, next step, complete step, pause routine, resume routine, or current step"
      );

      return;
    }

    setMessage("Command not recognized");
    speak("Sorry, I didn't understand that command");
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      setMessage(
        "Your browser does not support voice recognition. Use Chrome or Edge."
      );
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.log("Recognition already running");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Status */}
      <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-2 text-sm text-white shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <Volume2 size={16} />
          <span>{message}</span>
        </div>
      </div>

      {/* Voice Button */}
      <button
        onClick={startListening}
        className={`flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all ${
          listening
            ? "scale-110 bg-red-500 animate-pulse"
            : "bg-purple-600 hover:scale-110 hover:bg-purple-700"
        }`}
        title="Voice Assistant"
      >
        {listening ? (
          <MicOff size={30} color="white" />
        ) : (
          <Mic size={30} color="white" />
        )}
      </button>

      {/* Label */}
      <div className="rounded-full bg-black/70 px-3 py-1 text-xs text-white">
        {listening ? "Listening..." : "Voice Assistant"}
      </div>
    </div>
  );
}