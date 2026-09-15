import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2 } from "lucide-react";

export default function RoutineCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("requesting");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setError("Camera access needs HTTPS or localhost in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus("live");
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        setError(
          err?.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access in your browser to start the routine."
            : "No camera was found. Connect a camera and try again.",
        );
      }
    };

    startCamera();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-3xl panel-quiet shadow-quiet">
      <div className="flex items-center justify-between px-6 pb-4 pt-6">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">Routine Camera</p>
          <p className="mt-1 text-xs text-ink-400">Use the live view while you follow each step.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status === "live" ? "text-moss-400" : "text-ink-400"}`}>
          {status === "requesting" ? <Loader2 size={14} className="animate-spin" /> : status === "live" ? <Camera size={14} /> : <CameraOff size={14} />}
          {status === "live" ? "Camera on" : status === "requesting" ? "Opening…" : "Camera off"}
        </span>
      </div>

      <div className="relative mx-5 mb-5 aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-base-950">
        <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full object-cover transition-opacity ${status === "live" ? "opacity-100" : "opacity-0"}`} style={{ transform: "scaleX(-1)" }} />
        {status !== "live" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            {status === "requesting" ? <Loader2 size={22} className="animate-spin text-cyan-400" /> : <CameraOff size={22} className="text-ink-400" />}
            <p className="mt-3 text-xs leading-relaxed text-ink-400">{error || "Opening your camera…"}</p>
          </div>
        )}
      </div>
    </section>
  );
}
