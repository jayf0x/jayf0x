import { useEffect, useRef, useState } from "react";
import { createProjectionScene } from "@/lib/html2canvas";

// ── Scene config — tweak while dev server is running ─────────────────────────
// modelFitSize: auto-scales the skull so its longest axis = this many world units
// modelScale:   multiplier on top of auto-fit (> 1 = bigger)
// modelRotation: Euler XYZ in radians (Math.PI = 180°, Math.PI/2 = 90°)
// cameraPosition/cameraLookAt: world-space, Z+ is toward you
const degRad = (i: number) => i * (Math.PI / 180);

const CFG = {
  modelScale: 2,
  modelFitSize: 5,
  modelPosition: { x: 0, y: 0, z: 0 },
  // modelRotation: { x: 0, y: 0, z: 0 },
  modelRotation: { x: 0, y: degRad(90), z: 0 },

  cameraFov: 45,
  // cameraPosition: { x: 0, y: 0, z: 8 },
  cameraPosition: {
    x: -0.3093573213067368,
    y: -16.592985856922276,
    z: -10.08697472836774,
  },
  // cameraLookAt: { x: 0, y: 0, z: 0 },
  cameraLookAt: {
    x: -0.30935845005601864,
    y: -8.770618930884208,
    z: -10.08698247272932,
  },
};

// ── QA test pattern ───────────────────────────────────────────────────────────
// Four solid-colour quadrants with labels. No flexbox or transforms — only
// position/size properties that serialise cleanly through SVG foreignObject.
// Green=top-left  Red=top-right  Blue=bottom-left  Yellow=bottom-right
function TestPattern({ width, height }: { width: number; height: number }) {
  const half = "50%";
  const label = (top: string, left: string): React.CSSProperties => ({
    position: "absolute",
    top,
    left,
    margin: 0,
    padding: "6px 10px",
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
    background: "rgba(0,0,0,0.45)",
    lineHeight: 1.2,
  });

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* Quadrants */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: half,
          height: half,
          background: "#00cc44",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: half,
          height: half,
          background: "#ff2200",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: half,
          height: half,
          background: "#0055ff",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: half,
          height: half,
          background: "#ffcc00",
        }}
      />

      {/* Centre crosshair */}
      <div
        style={{
          position: "absolute",
          top: half,
          left: 0,
          right: 0,
          height: 3,
          marginTop: -1,
          background: "white",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: half,
          top: 0,
          bottom: 0,
          width: 3,
          marginLeft: -1,
          background: "white",
          opacity: 0.7,
        }}
      />

      {/* Corner labels */}
      <div style={label("8px", "8px")}>TL GREEN</div>
      <div style={label("8px", "55%")}>TR RED</div>
      <div style={label("55%", "8px")}>BL BLUE</div>
      <div style={label("55%", "55%")}>BR YELLOW</div>

      {/* Centre dot */}
      <div
        style={{
          position: "absolute",
          top: half,
          left: half,
          width: 18,
          height: 18,
          marginTop: -9,
          marginLeft: -9,
          background: "white",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

export const Info = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setDims({ w: el.clientWidth, h: el.clientHeight });
  }, []);

  useEffect(() => {
    if (dims.w === 0 || dims.h === 0) return;
    const container = containerRef.current;
    const page = pageRef.current;
    if (!container || !page) return;

    let disposed = false;
    let cleanupFn: (() => void) | null = null;

    createProjectionScene({
      pageElement: page,
      modelUrl: `${import.meta.env.BASE_URL}model.glb`,
      container,
      cssString: "", // test pattern uses only inline styles — skip CSS collection
      ...CFG,
    })
      .then(({ dispose }) => {
        if (disposed) {
          dispose();
          return;
        }
        setLoading(false);
        cleanupFn = dispose;
      })
      .catch((err) => {
        console.error("[Info] projection scene failed:", err);
        setLoading(false);
      });

    return () => {
      disposed = true;
      cleanupFn?.();
    };
  }, [dims]);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
    >
      {/* Projection source — plain block element with explicit pixel dimensions.
          No position:absolute / inset so nothing offscreen-ish gets serialised.
          Covered by the Three.js canvas (z-index:1) once loaded. */}
      {dims.w > 0 && (
        <div
          ref={pageRef}
          style={{ width: dims.w, height: dims.h, position: "relative" }}
        >
          <TestPattern width={dims.w} height={dims.h} />
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)] text-sm z-10 pointer-events-none">
          Loading 3D scene…
        </div>
      )}
    </div>
  );
};
