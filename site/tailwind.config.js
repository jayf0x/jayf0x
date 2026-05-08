export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
};
