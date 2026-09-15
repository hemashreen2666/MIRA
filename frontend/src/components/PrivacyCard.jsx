import { Lock, Check } from "lucide-react";

const points = [
  "Processing locally",
  "No facial image storage",
  "No cloud image upload",
  "Personal data stays on device",
];

export default function PrivacyCard() {
  return (
    <div className="relative rounded-3xl border border-moss-400/25 bg-gradient-to-br from-moss-400/10 via-base-900 to-base-900 p-6 md:p-7 overflow-hidden">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-moss-400/10 blur-2xl" />
      <div className="relative flex items-center gap-3 mb-4">
        <span className="h-10 w-10 rounded-xl bg-moss-400/15 border border-moss-400/30 flex items-center justify-center">
          <Lock size={16} className="text-moss-400" />
        </span>
        <p className="font-display font-semibold text-lg tracking-tight">Privacy First</p>
      </div>

      <ul className="space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm text-ink-200">
            <span className="h-4 w-4 rounded-full bg-moss-400/15 flex items-center justify-center shrink-0">
              <Check size={10} className="text-moss-400" />
            </span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
