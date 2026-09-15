import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { Hand, Play } from "lucide-react";
import { completeRoutineStep } from "../services/mira.js";

const MEDIAPIPE_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";

const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export default function HandTracking({
  steps = [],
  currentStep = 0,
  setCurrentStep,
  routineStarted = false,
  setRoutineStarted,
  onStepComplete,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  const lastVideoTimeRef = useRef(-1);
  const lastGestureRef = useRef("");
  const lastGestureTimeRef = useRef(0);
  const processingGestureRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [gesture, setGesture] = useState("No hand");
  const [error, setError] = useState("");

  const currentRoutineStep = steps[currentStep];

  /*
   * Stop camera when component is removed.
   */
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  /*
   * Create MediaPipe Hand Landmarker.
   */
  async function initializeHandTracker() {
    if (landmarkerRef.current) {
      return;
    }

    console.log("Loading MediaPipe...");

    const vision = await FilesetResolver.forVisionTasks(
      MEDIAPIPE_WASM
    );

    landmarkerRef.current =
      await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_MODEL,
          delegate: "CPU",
        },

        runningMode: "VIDEO",

        numHands: 1,

        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

    console.log("MediaPipe loaded successfully");
  }

  /*
   * Start webcam and hand tracking.
   */
  async function startTracking() {
    try {
      setLoading(true);
      setError("");

      await initializeHandTracker();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Your browser does not support camera access."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });

      streamRef.current = stream;

      const video = videoRef.current;

      video.srcObject = stream;

      await video.play();

      setCameraReady(true);
      setRoutineStarted?.(true);

      lastVideoTimeRef.current = -1;

      animationRef.current =
        requestAnimationFrame(detectHands);

    } catch (err) {
      console.error(
        "HAND TRACKING ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to start hand tracking."
      );

      setCameraReady(false);
    } finally {
      setLoading(false);
    }
  }

  /*
   * Stop webcam and MediaPipe loop.
   */
  function stopTracking() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setHandDetected(false);
    setGesture("No hand");

    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
  }

  /*
   * Calculate distance between two landmarks.
   */
  function distance(a, b) {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2) +
        Math.pow(a.z - b.z, 2)
    );
  }

  /*
   * Determine whether a finger is extended.
   */
  function fingerIsExtended(
    landmarks,
    tip,
    pip
  ) {
    return (
      landmarks[tip].y <
      landmarks[pip].y
    );
  }

  /*
   * Detect simple gestures.
   *
   * OPEN_PALM  = ✋
   * NEXT       = ✌️
   * THUMBS_UP  = 👍
   * FIST       = ✊
   */
  function detectGesture(landmarks) {
    const index = fingerIsExtended(
      landmarks,
      8,
      6
    );

    const middle = fingerIsExtended(
      landmarks,
      12,
      10
    );

    const ring = fingerIsExtended(
      landmarks,
      16,
      14
    );

    const pinky = fingerIsExtended(
      landmarks,
      20,
      18
    );

    const thumb =
      distance(
        landmarks[4],
        landmarks[17]
      ) >
      distance(
        landmarks[3],
        landmarks[17]
      );

    const extendedCount =
      Number(index) +
      Number(middle) +
      Number(ring) +
      Number(pinky);

    /*
     * Open palm
     */
    if (extendedCount >= 4) {
      return "OPEN_PALM";
    }

    /*
     * Two fingers
     */
    if (
      index &&
      middle &&
      !ring &&
      !pinky
    ) {
      return "NEXT";
    }

    /*
     * Thumbs up
     */
    if (
      thumb &&
      extendedCount === 0
    ) {
      return "THUMBS_UP";
    }

    /*
     * Closed fist
     */
    if (extendedCount === 0) {
      return "FIST";
    }

    return "TRACKING";
  }

  /*
   * Prevent the same gesture from firing repeatedly.
   */
  function canProcessGesture(newGesture) {
    const now = Date.now();

    if (
      newGesture ===
        lastGestureRef.current &&
      now -
        lastGestureTimeRef.current <
        1500
    ) {
      return false;
    }

    lastGestureRef.current =
      newGesture;

    lastGestureTimeRef.current =
      now;

    return true;
  }

  /*
   * Perform action based on gesture.
   */
  async function processGesture(
    newGesture
  ) {
    if (!canProcessGesture(newGesture)) {
      return;
    }

    if (processingGestureRef.current) {
      return;
    }

    /*
     * 👍 Complete current step
     */
    if (
      newGesture === "THUMBS_UP"
    ) {
      setGesture("👍 Complete step");

      const step =
        steps[currentStep];

      if (!step) {
        return;
      }

      if (!step.complete) {
        try {
          processingGestureRef.current =
            true;

          await completeRoutineStep(
            step.id,
            true
          );

          onStepComplete?.(
            step.id
          );

          /*
           * Move to next step.
           */
          if (
            currentStep <
            steps.length - 1
          ) {
            setTimeout(() => {
              setCurrentStep(
                (prev) => prev + 1
              );
            }, 700);
          }
        } catch (err) {
          console.error(
            "Unable to complete routine step:",
            err
          );

          setGesture(
            "Unable to save step"
          );
        } finally {
          processingGestureRef.current =
            false;
        }
      }

      return;
    }

    /*
     * ✌️ Next step
     */
    if (
      newGesture === "NEXT"
    ) {
      setGesture("✌️ Next step");

      if (
        currentStep <
        steps.length - 1
      ) {
        setCurrentStep(
          (prev) => prev + 1
        );
      }

      return;
    }

    /*
     * ✋ Pause
     */
    if (
      newGesture === "OPEN_PALM"
    ) {
      setGesture("✋ Pause");

      setRoutineStarted?.(
        false
      );

      return;
    }

    /*
     * ✊ Resume
     */
    if (
      newGesture === "FIST"
    ) {
      setGesture("✊ Resume");

      setRoutineStarted?.(
        true
      );

      return;
    }

    setGesture("Tracking");
  }

  /*
   * Draw MediaPipe landmarks.
   */
  function drawLandmarks(
    landmarks
  ) {
    const canvas =
      canvasRef.current;

    const video =
      videoRef.current;

    if (!canvas || !video) {
      return;
    }

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const ctx =
      canvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],

      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],

      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12],

      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16],

      [13, 17],
      [17, 18],
      [18, 19],
      [19, 20],

      [0, 17],
    ];

    /*
     * Draw bones.
     */
    ctx.strokeStyle =
      "#5FE3E0";

    ctx.lineWidth = 3;

    connections.forEach(
      ([a, b]) => {
        ctx.beginPath();

        ctx.moveTo(
          landmarks[a].x *
            canvas.width,
          landmarks[a].y *
            canvas.height
        );

        ctx.lineTo(
          landmarks[b].x *
            canvas.width,
          landmarks[b].y *
            canvas.height
        );

        ctx.stroke();
      }
    );

    /*
     * Draw points.
     */
    landmarks.forEach(
      (point) => {
        ctx.beginPath();

        ctx.arc(
          point.x *
            canvas.width,
          point.y *
            canvas.height,
          5,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "#5FE3E0";

        ctx.fill();
      }
    );
  }

  /*
   * Detect hands from webcam video.
   */
  function detectHands() {
    const video =
      videoRef.current;

    const landmarker =
      landmarkerRef.current;

    if (
      !video ||
      !landmarker ||
      video.readyState < 2
    ) {
      animationRef.current =
        requestAnimationFrame(
          detectHands
        );

      return;
    }

    /*
     * Only process a new video frame.
     */
    if (
      video.currentTime !==
      lastVideoTimeRef.current
    ) {
      lastVideoTimeRef.current =
        video.currentTime;

      try {
        const result =
          landmarker.detectForVideo(
            video,
            performance.now()
          );

        if (
          result.landmarks &&
          result.landmarks.length > 0
        ) {
          const landmarks =
            result.landmarks[0];

          setHandDetected(true);

          drawLandmarks(
            landmarks
          );

          const detectedGesture =
            detectGesture(
              landmarks
            );

          processGesture(
            detectedGesture
          );
        } else {
          setHandDetected(false);
          setGesture("No hand");

          const canvas =
            canvasRef.current;

          if (canvas) {
            const ctx =
              canvas.getContext(
                "2d"
              );

            ctx.clearRect(
              0,
              0,
              canvas.width,
              canvas.height
            );
          }
        }
      } catch (err) {
        console.error(
          "MediaPipe detection error:",
          err
        );
      }
    }

    animationRef.current =
      requestAnimationFrame(
        detectHands
      );
  }

  return (
    <div className="rounded-3xl panel-quiet shadow-quiet p-6 md:p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-display font-semibold text-lg tracking-tight">
            Hand Tracking
          </p>

          <p className="text-xs text-ink-400 mt-1">
            Control your skincare routine
            with gestures
          </p>
        </div>

        <span
          className={`text-xs ${
            handDetected
              ? "text-moss-400"
              : "text-ink-500"
          }`}
        >
          {handDetected
            ? "Hand Detected"
            : "No Hand"}
        </span>
      </div>

      {/* Camera */}
      <div className="rounded-2xl bg-base-950 border border-line relative overflow-hidden aspect-video">
        {!cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <Hand
              size={42}
              className="text-cyan-300 mb-3"
            />

            <p className="text-sm text-ink-300">
              Start the routine to activate
              hand tracking
            </p>
          </div>
        )}

        <video
          ref={videoRef}
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover ${
            cameraReady
              ? "block"
              : "hidden"
          }`}
          style={{
            transform:
              "scaleX(-1)",
          }}
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full ${
            cameraReady
              ? "block"
              : "hidden"
          }`}
          style={{
            transform:
              "scaleX(-1)",
          }}
        />

        {cameraReady &&
          handDetected && (
            <div className="absolute top-3 left-3 rounded-lg bg-base-950/80 border border-cyan-400/30 px-3 py-1.5">
              <span className="text-xs text-cyan-300">
                {gesture}
              </span>
            </div>
          )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3">
          <p className="text-xs text-red-300">
            {error}
          </p>

          <p className="text-[11px] text-red-300/70 mt-1">
            Open F12 → Console for additional
            details.
          </p>
        </div>
      )}

      {/* Status */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl bg-base-900/60 border border-line px-3 py-3">
          <p className="text-[10.5px] text-ink-500">
            Gesture Status
          </p>

          <p className="text-sm font-medium text-cyan-300 mt-1">
            {gesture}
          </p>
        </div>

        <div className="rounded-xl bg-base-900/60 border border-line px-3 py-3">
          <p className="text-[10.5px] text-ink-500">
            Current Step
          </p>

          <p className="text-sm font-medium text-moss-400 mt-1">
            {currentRoutineStep?.title ||
              "Complete"}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-ink-400 leading-relaxed">
        <p className="font-medium text-ink-300 mb-1">
          Gestures
        </p>

        <p>
          👍 Thumbs up — complete current
          step
        </p>

        <p>
          ✌️ Two fingers — next step
        </p>

        <p>
          ✋ Open palm — pause
        </p>

        <p>
          ✊ Fist — resume
        </p>
      </div>

      {/* Camera button */}
      {!cameraReady && (
        <button
          onClick={startTracking}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-azure-500 text-base-950 text-sm font-medium py-2.5 focus-ring flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Play size={16} />

          {loading
            ? "Starting Hand Tracking..."
            : "Start Hand Tracking"}
        </button>
      )}

      {cameraReady && (
        <button
          onClick={stopTracking}
          className="mt-5 w-full rounded-xl bg-base-800 border border-line text-sm font-medium py-2.5 focus-ring"
        >
          Stop Tracking
        </button>
      )}
    </div>
  );
}