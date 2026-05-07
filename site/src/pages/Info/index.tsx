import { useEffect, useRef } from "react";
import { createProjectionScene } from "../../lib/html2canvas";

// Content projected as a texture onto the 3D model.
// Inline styles only — no class-based CSS needed for the effect.
function ProjectionContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0d1117",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Courier New', Courier, monospace",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "560px",
          padding: "40px",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#ff4757",
            color: "white",
            padding: "28px 32px",
            borderRadius: "16px",
          }}
        >
          <div
            style={{ fontSize: "56px", fontWeight: 900, lineHeight: 1, letterSpacing: "-2px" }}
          >
            INFO
          </div>
          <div style={{ fontSize: "13px", marginTop: "8px", opacity: 0.75, letterSpacing: "3px", textTransform: "uppercase" }}>
            jonatan verstraete
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ background: "#1c2333", color: "#ffa502", padding: "20px", borderRadius: "10px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.5, marginBottom: "8px" }}>role</div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#ffa502" }}>Creative Dev</div>
          </div>
          <div style={{ background: "#1c2333", color: "#70a1ff", padding: "20px", borderRadius: "10px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.5, marginBottom: "8px" }}>stack</div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#70a1ff" }}>Three.js + React</div>
          </div>
          <div style={{ background: "#1c2333", color: "#7bed9f", padding: "20px", borderRadius: "10px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.5, marginBottom: "8px" }}>status</div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#7bed9f" }}>Building Worlds</div>
          </div>
          <div style={{ background: "#ff4757", color: "white", padding: "20px", borderRadius: "10px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.7, marginBottom: "8px" }}>vibe</div>
            <div style={{ fontSize: "17px", fontWeight: 700 }}>Creative Chaos</div>
          </div>
        </div>

        {/* Footer line */}
        <div
          style={{
            background: "#161b27",
            color: "#4a5568",
            padding: "16px 20px",
            borderRadius: "10px",
            fontSize: "12px",
            letterSpacing: "2px",
            textAlign: "center",
          }}
        >
          pixels → polygons → feelings
        </div>
      </div>
    </div>
  );
}

export const Info = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    let disposed = false;
    let cleanupFn: (() => void) | null = null;

    const modelUrl = `${import.meta.env.BASE_URL}model.glb`;

    createProjectionScene({ pageElement: el, modelUrl })
      .then(({ dispose }) => {
        if (disposed) {
          dispose();
        } else {
          cleanupFn = dispose;
        }
      })
      .catch((err) => {
        console.error("[Info] projection scene failed:", err);
      });

    return () => {
      disposed = true;
      cleanupFn?.();
    };
  }, []);

  return (
    <>
      {/* Source element for projection — hidden offscreen */}
      <div
        ref={pageRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: `${window.innerWidth}px`,
          height: `${window.innerHeight}px`,
          pointerEvents: "none",
        }}
      >
        <ProjectionContent />
      </div>

      {/* Fallback text visible under the Three.js canvas */}
      <div className="flex-1 flex items-center justify-center text-[var(--muted)] text-sm">
        Loading 3D scene…
      </div>
    </>
  );
};
