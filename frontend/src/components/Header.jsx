import { useEffect, useState } from "react";
import { ShieldCheck, Video, User } from "lucide-react";

export default function Header({ home = false, auth = false, demo = false, onDemoUser, onLogin }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  const clock = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = time.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <header className="flex items-center justify-between gap-4 px-6 md:px-10 py-6 border-b border-line">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-azure-500 flex items-center justify-center shrink-0">
          <span className="font-display font-semibold text-base-950 text-base">M</span>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-moss-400 ring-2 ring-base-900" />
        </div>
        <div className="leading-tight">
          <p className="font-display font-semibold text-lg tracking-tight">MIRA</p>
          <p className="text-[11px] text-ink-400 hidden sm:block">
            Mirror Intelligent Routine Assistant
          </p>
        </div>
      </div>

      {/* Glanceable clock — the thing you'd actually read from across a room */}
      <div className="hidden md:flex flex-col items-center leading-none select-none">
        <p className="font-display font-medium text-3xl tracking-tight tabular text-ink-50">
          {clock}
        </p>
        <p className="text-[11px] text-ink-500 mt-1.5">{date}</p>
      </div>

      {home ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onDemoUser}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-azure-500 px-4 py-2 text-xs font-semibold text-base-950 transition-opacity hover:opacity-90 focus-ring"
          >
            Demo User
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink-100 transition-colors hover:bg-base-800 focus-ring"
          >
            Login
          </button>
        </div>
      ) : auth ? null : (
      <div className="flex items-center gap-3 md:gap-5">
        {demo && <button type="button" onClick={onLogin} className="rounded-full border border-cyan-400/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 focus-ring">Demo Mode · Login</button>}
        <div
          className="hidden md:flex items-center gap-2 rounded-full border border-line px-3 py-1.5 glass"
          title="Your data stays on this device."
        >
          <ShieldCheck size={13} className="text-moss-400" />
          <p className="text-[11px] font-medium text-moss-400 whitespace-nowrap">Local Processing</p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-ink-200 text-xs">
          <Video size={14} className="text-cyan-400" />
          <span className="whitespace-nowrap">Camera active</span>
        </div>

        <p className="md:hidden font-mono text-sm text-ink-200 tabular">{clock}</p>

        {!demo && <button
          className="h-8 w-8 rounded-full bg-base-800 border border-line flex items-center justify-center focus-ring shrink-0"
          aria-label="Profile"
        >
          <User size={15} className="text-ink-200" />
        </button>}
      </div>
      )}
    </header>
  );
}
