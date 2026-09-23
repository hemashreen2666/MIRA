import { useState } from "react";

import { loginUser, registerUser } from "../services/mira.js";

export default function AuthPage({ mode, onNavigate }) {
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fields = isRegister
    ? [
        { id: "name", label: "Name", type: "text", autoComplete: "name" },
        { id: "username", label: "Username", type: "text", autoComplete: "username" },
        { id: "email", label: "Email", type: "email", autoComplete: "email" },
        { id: "password", label: "Password", type: "password", autoComplete: "new-password" },
      ]
    : [
        { id: "username", label: "Username", type: "text", autoComplete: "username" },
        { id: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      if (isRegister) {
        await registerUser(payload);
      } else {
        await loginUser(payload);
      }
      onNavigate("dashboard");
    } catch (err) {
      setError(err?.message || "Unable to continue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-105px)] max-w-[1440px] items-center justify-center px-6 py-14 md:px-10">
      <section className="w-full max-w-md rounded-[28px] border border-line bg-base-850 p-7 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-9">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">MIRA account</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-50">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-400">
          {isRegister ? "Set up your private MIRA profile." : "Sign in to continue to your mirror."}
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <label key={field.id} className="block text-sm font-medium text-ink-200">
              {field.label}
              <input
                required
                name={field.id}
                type={field.type}
                autoComplete={field.autoComplete}
                className="mt-2 h-11 w-full rounded-xl border border-line bg-base-900 px-3 text-sm text-ink-50 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>
          ))}

          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-azure-500 text-sm font-semibold text-base-950 transition-opacity hover:opacity-90 disabled:opacity-60 focus-ring">
            {submitting ? "Please wait..." : isRegister ? "Create account" : "Login"}
          </button>
        </form>


        <p className="mt-6 text-center text-sm text-ink-400">
          {isRegister ? "Already have an account?" : "New to MIRA?"}{" "}
          <button type="button" onClick={() => onNavigate(isRegister ? "login" : "register")} className="font-semibold text-cyan-400 hover:text-cyan-300 focus-ring">
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </section>
    </main>
  );
}
