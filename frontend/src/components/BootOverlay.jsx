import { useEffect, useState } from "react";

const lines = ["Waking display", "Calibrating sensors", "Loading local models"];

export default function BootOverlay({ onDone }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 450);
    const t2 = setTimeout(() => setStep(2), 900);
    const t3 = setTimeout(() => setStep(3), 1350);
    const done = setTimeout(onDone, 1900);
    return () => [t1, t2, t3, done].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 bg-base-950 flex flex-col items-center justify-center animate-bootFade"
      style={{ animationDuration: "1.9s" }}
      aria-hidden="true"
    >
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-azure-500 flex items-center justify-center mb-5">
        <span className="font-display font-semibold text-base-950 text-xl">M</span>
      </div>
      <p className="font-display font-semibold text-lg tracking-tight mb-6">MIRA</p>

      <div className="w-52 h-px bg-base-700 overflow-hidden rounded-full mb-4">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-azure-500 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(step, 3) * 33.4}%` }}
        />
      </div>

      <p className="text-[11px] font-mono text-ink-500 tabular">
        {lines[Math.min(step, lines.length - 1)]}…
      </p>
    </div>
  );
}
