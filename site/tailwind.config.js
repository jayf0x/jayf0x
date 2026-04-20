import plugin from "tailwindcss/plugin"

/** All color tokens defined here — single source of truth */
const tokens = {
  light: {
    "--background": "#f7f7f8",
    "--foreground": "#0f0f10",
    "--primary": "#2563eb",
    "--primary-hover": "#1d4ed8",
    "--muted": "#6b7280",
    "--surface": "rgba(255,255,255,0.70)",
    "--border": "rgba(0,0,0,0.08)",
  },
  dark: {
    "--background": "#09090b",
    "--foreground": "#f1f1f3",
    "--primary": "#3b82f6",
    "--primary-hover": "#60a5fa",
    "--muted": "#9ca3af",
    "--surface": "rgba(255,255,255,0.04)",
    "--border": "rgba(255,255,255,0.08)",
  },
}

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
        },
        muted: "var(--muted)",
        surface: "var(--surface)",
        border: "var(--border)",
      },
      animation: {
        blink: "blink 1s step-start infinite",
        typing: "typing 0.8s steps(40, end)",
        slowPan: "pan 8s alternate infinite",
        blob: "blob 7s infinite",
        arrow: "arrowPan 1s alternate infinite",
      },
      keyframes: {
        blink: {
          "50%": { opacity: "0" },
        },
        typing: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        pan: {
          "0%": { transform: "translate(0, 0) scale(1.0)" },
          "100%": { transform: "translate(-12px, -12px) scale(1.05)" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(20px, -30px) scale(1.05)" },
          "66%": { transform: "translate(-15px, 15px) scale(0.97)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        arrowPan: {
          "0%": { transform: "translate(0px, -2px) scale(0.98)" },
          "100%": { transform: "translate(0px, 7px) scale(1.5)" },
        },
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": tokens.light,
        ".dark": tokens.dark,
      })
    }),
  ],
}
