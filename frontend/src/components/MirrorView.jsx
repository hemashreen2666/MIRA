import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Square, Radio, CameraOff, Loader2 } from "lucide-react";
import { runSkinAnalysis, runExpressionEstimate } from "../services/mira.js";
import { emitAnalysisComplete } from "../lib/analysisBus.js";

// How often a frame is captured and sent to the local backend while
// analysis is running. Frames are drawn to an offscreen canvas, POSTed to
// the on-device API, and discarded — never stored.
const CAPTURE_INTERVAL_MS = 6000;

// A hand-authored abstract reticle, shown only when there is no live camera
// feed. It's a stylised stand-in, not a real face mesh.
const landmarks = [
  [150, 92], [178, 84], [206, 92],
  [128, 130], [150, 118], [172, 122], [196, 130],
  [104, 150], [230, 150],
  [150, 150], [150, 178], [150, 200],
  [128, 224], [150, 232], [172, 224],
  [112, 200], [188, 200],
  [150, 258],
];

const mesh = [
  [3, 4], [4, 5], [5, 6], [10, 11], [11, 12],
  [12, 13], [13, 14], [15, 10], [16, 12],
];

// Average of the "concern" metrics (everything except brightness, where
// higher is good), inverted so a higher number means clearer skin.
function skinScore(metrics = []) {
  const concern = metrics.filter((m) => m.id !== "brightness");
  if (!concern.length) return null;
  const avg = concern.reduce((sum, m) => sum + m.level, 0) / concern.length;
  return Math.round(100 - avg);
}

function timeAgo(date) {
  if (!date) return "—";
  const secs = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  return `${mins}m ago`;
}

export default function MirrorView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const busyRef = useRef(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | starting | live | scanning
  const [cameraError, setCameraError] = useState(null);
  const [result, setResult] = useState(null); // { score, brightness, at }
  const [scans, setScans] = useState(0);
  const [, forceTick] = useState(0);

  // keep "x seconds ago" fresh
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const teardown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || busyRef.current) return;
    if (video.readyState < 2 || !video.videoWidth) return;

    busyRef.current = true;
    setPhase("scanning");
    try {
      const width = 480;
      const height = Math.round((video.videoHeight / video.videoWidth) * width) || 360;
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(video, 0, 0, width, height);

      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.8));
      if (!blob) return;

      const analysis = await runSkinAnalysis(blob);
      runExpressionEstimate().catch(() => {}); // best-effort, keeps the card live
      emitAnalysisComplete(analysis);

      const metrics = analysis.metrics || [];
      setResult({
        score: skinScore(metrics),
        brightness: metrics.find((m) => m.id === "brightness")?.level ?? null,
        at: new Date(), // the scan just completed on this device
      });
      setScans((n) => n + 1);
      setCameraError(null);
    } catch (err) {
      setCameraError(err?.message || "Analysis request failed.");
    } finally {
      busyRef.current = false;
      setPhase((p) => (p === "scanning" ? "live" : p));
    }
  }, []);

  const start = useCallback(async () => {
    setCameraError(null);
    setIsAnalyzing(true);
    setPhase("starting");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access needs HTTPS or localhost in this browser.");
      setIsAnalyzing(false);
      setPhase("idle");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});
      setPhase("live");

      const kick = () => captureAndAnalyze();
      if (video.readyState >= 2) kick();
      else video.addEventListener("loadeddata", kick, { once: true });

      timerRef.current = setInterval(captureAndAnalyze, CAPTURE_INTERVAL_MS);
    } catch (err) {
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera permission denied — allow it in your browser to run live analysis."
          : "No camera found. Connect a USB webcam and try again.",
      );
      setIsAnalyzing(false);
      setPhase("idle");
      teardown();
    }
  }, [captureAndAnalyze, teardown]);

  const stop = useCallback(() => {
    setIsAnalyzing(false);
    setPhase("idle");
    teardown();
  }, [teardown]);

  useEffect(() => () => teardown(), [teardown]);

  const live = isAnalyzing && (phase === "live" || phase === "scanning");
  const scanning = phase === "scanning";

  return (
    <div className="rounded-3xl panel-primary shadow-glowStrong overflow-hidden">
      <div className="flex items-start justify-between px-7 pt-7">
        <div>
          <p className="font-display font-semibold text-xl tracking-tight">Live AI Analysis</p>
          <p className="text-xs text-ink-400 mt-1">
            Camera frames analyzed on this device — never uploaded or saved
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10.5px] font-mono text-ink-500 border border-line rounded-full px-2.5 py-1">
          <Radio size={11} className={live ? "text-cyan-400" : "text-ink-500"} />
          {live ? "camera · on-device" : "camera · idle"}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_180px] gap-4 mx-5 md:mx-7 mt-5 mb-2">
        {/* Camera / face panel */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-2xl bg-base-950 border border-line overflow-hidden">
          <div className="absolute inset-0 bg-grid-fade" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(95,227,224,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(95,227,224,0.5) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Live webcam feed (mirrored like a real mirror). Hidden until a
              stream is attached so the stylised view shows through. */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              live ? "opacity-100" : "opacity-0"
            }`}
            style={{ transform: "scaleX(-1)", filter: "saturate(0.9) brightness(0.92)" }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {scanning && (
            <div className="absolute inset-x-0 top-0 h-1/2 pointer-events-none animate-scan">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_2px_rgba(95,227,224,0.6)]" />
            </div>
          )}

          <svg viewBox="0 0 300 320" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
            {scanning && (
              <circle
                cx="150" cy="172" r="118"
                fill="none" stroke="rgba(95,227,224,0.14)" strokeWidth="1"
                strokeDasharray="2 10" strokeLinecap="round"
                style={{ transformOrigin: "150px 172px" }}
                className="animate-[ringSpin_14s_linear_infinite]"
              />
            )}

            <ellipse
              cx="150" cy="170" rx="82" ry="108"
              fill="none"
              stroke={live ? "rgba(95,227,224,0.35)" : "rgba(95,227,224,0.3)"}
              strokeWidth="1.3" strokeDasharray="3 5"
            />

            {/* stylised reticle only when there's no real feed */}
            {!live && (
              <>
                {landmarks.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 2.6 : 1.8} fill="#65748A" opacity={0.5} />
                ))}
                {mesh.map(([a, b], i) => (
                  <line
                    key={i}
                    x1={landmarks[a][0]} y1={landmarks[a][1]}
                    x2={landmarks[b][0]} y2={landmarks[b][1]}
                    stroke="rgba(101,116,138,0.25)" strokeWidth="1"
                  />
                ))}
              </>
            )}

            {[
              "M60,60 h20 M60,60 v20",
              "M240,60 h-20 M240,60 v20",
              "M60,280 h20 M60,280 v-20",
              "M240,280 h-20 M240,280 v-20",
            ].map((d, i) => (
              <path key={i} d={d} stroke="rgba(91,156,246,0.55)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            ))}
          </svg>

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <Chip active={live} text={live ? "Camera Live" : "Camera Off"} />
            <Chip active={scanning} text={scanning ? "Analyzing Frame…" : "Skin Analysis Idle"} />
          </div>
          <div className="absolute top-3 right-3">
            <Chip active text="Local Only" />
          </div>

          {/* error / permission state */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-base-950/70 backdrop-blur-sm">
              <div className="max-w-xs text-center">
                <CameraOff size={22} className="mx-auto text-ink-400" />
                <p className="text-xs text-ink-300 mt-2 leading-relaxed">{cameraError}</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-ink-400">
            <span>
              {phase === "starting"
                ? "Requesting camera…"
                : live
                  ? "AI Vision Active"
                  : "AI Vision Paused"}
            </span>
            <span className="flex items-center gap-1.5 tabular">
              <span
                className={`h-1.5 w-1.5 rounded-full ${live ? "bg-cyan-400 animate-pulseDot" : "bg-ink-500"}`}
              />
              {live ? `scan ${scans}` : "idle"}
            </span>
          </div>
        </div>

        {/* HUD readout — real values from the last on-device analysis */}
        <div className="hidden lg:flex flex-col gap-2.5">
          <HudStat
            label="Skin score"
            value={result?.score != null ? `${result.score} / 100` : "—"}
            tone="cyan"
            active={live}
          />
          <HudStat
            label="Brightness"
            value={result?.brightness != null ? `${result.brightness}%` : "—"}
            tone="azure"
            active={live}
          />
          <HudStat label="Last scan" value={live ? timeAgo(result?.at) : "—"} tone="moss" active={live} />
          <HudStat label="Model" value="on-device" tone="ink" active />
        </div>
      </div>

      <div className="flex items-center gap-3 px-7 pb-7 pt-4">
        <button
          onClick={start}
          disabled={isAnalyzing}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus-ring ${
            isAnalyzing
              ? "bg-gradient-to-r from-cyan-500 to-azure-500 text-base-950 shadow-glow"
              : "bg-base-800 border border-line text-ink-200 hover:text-ink-50"
          }`}
        >
          {phase === "starting" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {isAnalyzing ? "Analysis Running" : "Start Analysis"}
        </button>
        <button
          onClick={stop}
          disabled={!isAnalyzing}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-ring ${
            !isAnalyzing
              ? "bg-base-800 border border-line text-ink-500"
              : "bg-base-800 border border-line text-ink-200 hover:text-ink-50"
          }`}
        >
          <Square size={13} />
          Stop
        </button>
      </div>
    </div>
  );
}

function Chip({ text, active }) {
  return (
    <span
      className={`text-[10.5px] font-mono px-2 py-1 rounded-md border backdrop-blur-sm ${
        active
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
          : "border-line bg-base-900/60 text-ink-500"
      }`}
    >
      {text}
    </span>
  );
}

function HudStat({ label, value, tone, active }) {
  const dot = {
    cyan: "bg-cyan-400",
    azure: "bg-azure-400",
    moss: "bg-moss-400",
    ink: "bg-ink-500",
  }[tone];

  return (
    <div className="rounded-xl border border-line bg-base-900/50 px-3.5 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot} ${active ? "animate-pulseDot" : ""}`} />
        <p className="text-[10px] text-ink-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="font-mono text-sm text-ink-100 tabular">{value}</p>
    </div>
  );
}
