import { TypeAnimation } from "react-type-animation";

export default function VisionPanel({ status, result }) {
  const statusLabel = status === "analyzing" ? "Consulting the oracle…" : null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "20px 28px 24px",
        background: "rgba(8, 6, 13, 0.72)",
        backdropFilter: "blur(8px)",
        color: "#e8e0f5",
        fontFamily: "system-ui, sans-serif",
        zIndex: 10,
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.5,
          marginBottom: 8,
        }}
      >
        The cave perceives:
      </div>
      {statusLabel && (
        <div
          style={{
            fontSize: 13,
            opacity: 0.6,
            fontStyle: "italic",
            marginBottom: 6,
          }}
        >
          {statusLabel}
        </div>
      )}

      <TypeAnimation
        key={result}
        sequence={[result, 5000]}
        wrapper="div"
        speed={65}
      />
    </div>
  );
}
