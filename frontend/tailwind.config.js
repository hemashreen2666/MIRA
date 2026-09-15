/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      colors: {
        base: {
          950: "#070B10",
          900: "#0B1119",
          850: "#0F1620",
          800: "#141C28",
          700: "#1C2632",
          600: "#2A3644",
        },
        line: "rgba(255,255,255,0.08)",
        cyan: {
          400: "#5FE3E0",
          500: "#2FD1CE",
          600: "#1BA6A6",
        },
        azure: {
          400: "#5B9CF6",
          500: "#3B7DE8",
        },
        amber: {
          400: "#F2B872",
          500: "#E39F4C",
        },
        moss: {
          400: "#7FD9A8",
          500: "#4FBD84",
        },
        coral: {
          400: "#F2897A",
        },
        ink: {
          50: "#F4F7FA",
          200: "#C6D0DC",
          400: "#8895A7",
          500: "#65748A",
        },
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
        quiet: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 24px -16px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(95,227,224,0.15), 0 0 32px -4px rgba(95,227,224,0.25)",
        glowStrong: "0 0 0 1px rgba(95,227,224,0.22), 0 0 60px -8px rgba(95,227,224,0.35), 0 30px 60px -30px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at 50% 0%, rgba(95,227,224,0.08), transparent 60%)",
        "ambient": "radial-gradient(60% 50% at 15% -10%, rgba(59,125,232,0.16), transparent 60%), radial-gradient(50% 40% at 90% 0%, rgba(95,227,224,0.10), transparent 60%)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-4%)" },
          "50%": { transform: "translateY(104%)" },
          "100%": { transform: "translateY(-4%)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.35 },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        drift: {
          "0%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(6px,-6px)" },
          "100%": { transform: "translate(0,0)" },
        },
        ringSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        bootFade: {
          "0%": { opacity: 1 },
          "70%": { opacity: 1 },
          "100%": { opacity: 0, visibility: "hidden" },
        },
        riseIn: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        scan: "scan 3.2s ease-in-out infinite",
        pulseDot: "pulseDot 2s ease-in-out infinite",
        wave: "wave 1s ease-in-out infinite",
        drift: "drift 9s ease-in-out infinite",
        ringSpin: "ringSpin 14s linear infinite",
        bootFade: "bootFade 1.8s ease forwards",
        riseIn: "riseIn 0.5s ease forwards",
      },
    },
  },
  plugins: [],
};
