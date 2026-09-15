export default function StatusIndicator({ label, tone = "cyan", pulse = true }) {
  const toneMap = {
    cyan: "bg-cyan-400 shadow-[0_0_10px_2px_rgba(95,227,224,0.6)]",
    moss: "bg-moss-400 shadow-[0_0_10px_2px_rgba(127,217,168,0.6)]",
    amber: "bg-amber-400 shadow-[0_0_10px_2px_rgba(242,184,114,0.6)]",
    ink: "bg-ink-400",
  };

  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink-200">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${toneMap[tone]} ${
            pulse ? "animate-pulseDot" : ""
          }`}
        />
      </span>
      {label}
    </span>
  );
}
