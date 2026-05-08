import { useEffect, useRef, useState } from "react";
import { createProjectionScene } from "@/lib/html2canvas";
import { ProjectionScene } from "@/lib/html2canvas/types";
import { useMotionValue, useSpring } from "framer-motion";
import { devLog } from "@/utils/logger";

const DEG2RAD = Math.PI / 180;

const CONFIG = {
  model: {
    rotation: { x: 100 * DEG2RAD, y: -180 * DEG2RAD, z: 90 * DEG2RAD },
    position: { x: 0, y: -40, z: 6.5 },
    scale: 3,
    fitSize: 20,
  },
  camera: {
    fov: 65,
    position: { x: -8, y: -30, z: 90 },
  },
} as const;

// ── QA test pattern ───────────────────────────────────────────────────────────
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
      <div style={{ position: "absolute", top: 0, left: 0, width: half, height: half, background: "#00cc44" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: half, height: half, background: "#ff2200" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: half, height: half, background: "#0055ff" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: half, height: half, background: "#ffcc00" }} />

      <div style={{ position: "absolute", top: half, left: 0, right: 0, height: 3, marginTop: -1, background: "white", opacity: 0.7 }} />
      <div style={{ position: "absolute", left: half, top: 0, bottom: 0, width: 3, marginLeft: -1, background: "white", opacity: 0.7 }} />

      <div style={label("8px", "8px")}>TL GREEN</div>
      <div style={label("8px", "55%")}>TR RED</div>
      <div style={label("55%", "8px")}>BL BLUE</div>
      <div style={label("55%", "55%")}>BR YELLOW</div>

      <div style={{ position: "absolute", top: half, left: half, width: 18, height: 18, marginTop: -9, marginLeft: -9, background: "white", borderRadius: "50%" }} />
    </div>
  );
}

export const Info = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [scene, setScene] = useState<ProjectionScene | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) setDims({ w: el.clientWidth, h: el.clientHeight });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const page = pageRef.current;
    if (!container || !page || !dims.w) return;

    let mounted = true;
    let _scene: typeof scene = null;

    createProjectionScene({
      pageElement: page,
      modelUrl: `${import.meta.env.BASE_URL}model.glb`,
      container,
      cssString: "",
      modelScale: CONFIG.model.scale,
      modelFitSize: CONFIG.model.fitSize,
      modelPosition: CONFIG.model.position,
      modelRotation: CONFIG.model.rotation,
      cameraFov: CONFIG.camera.fov,
      cameraPosition: CONFIG.camera.position,
    })
      .then((res) => {
        if (!mounted) return;
        setScene(res);
        _scene = res;
      })
      .catch((err) => devLog("Projection scene failed:", err));

    return () => {
      mounted = false;
      _scene?.dispose?.();
      setScene(null);
    };
  }, [dims]);

  const cursorX = useMotionValue(0);
  const smoothCursorX = useSpring(cursorX, { stiffness: 20 });

  useEffect(() => {
    const container = containerRef.current;
    const handlePointerMove = (e: PointerEvent) => {
      cursorX.set((e.clientX / window.innerWidth) * 2 - 1);
    };
    container?.addEventListener("pointermove", handlePointerMove);
    return () => container?.removeEventListener("pointermove", handlePointerMove);
  }, [cursorX]);

  useEffect(() => {
    let frameId: number;
    const loop = () => {
      if (scene) scene.cursorState.x = smoothCursorX.get() * 50;
      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [scene, smoothCursorX]);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      {dims.w > 0 && (
        <div ref={pageRef} style={{ width: dims.w, height: dims.h, position: "relative" }}>
          <TestPattern width={dims.w} height={dims.h} />
        </div>
      )}
      {!scene && (
        <div className="absolute inset-0 flex items-center justify-center text-(--muted) text-sm z-10 pointer-events-none">
          Loading 3D scene…
        </div>
      )}
    </div>
  );
};
