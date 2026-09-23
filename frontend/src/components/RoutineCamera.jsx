import { useEffect, useRef } from "react";

// One-shot capture bridge for MIRA's existing /skin-analysis/analyze pipeline.
// It releases its stream before hand tracking becomes available.
export default function RoutineCamera({ active = false, onCapture, onError }) {
  const streamRef = useRef(null);
  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    const stop = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; };
    const capture = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: false });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
        stop();
        if (!frame) throw new Error("Could not capture a camera frame.");
        if (!cancelled) onCapture?.(frame);
      } catch (error) {
        stop();
        if (!cancelled) onError?.(error?.name === "NotAllowedError" ? "Camera permission is required for post-cleansing analysis." : "Unable to start the camera for post-cleansing analysis.");
      }
    };
    capture();
    return () => { cancelled = true; stop(); };
  }, [active, onCapture, onError]);
  return null;
}
