import { useEffect, useRef, useState } from "react";
import { useControls, folder, button, Leva } from "leva";
import { createProjectionScene } from "@/lib/html2canvas";
import { ProjectionScene } from "@/lib/html2canvas/types";
import { useMotionValue, useSpring } from "framer-motion";
import { devLog } from "@/utils/logger";

const DEG2RAD = Math.PI / 180;

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

  const ctrl = useControls({
    Model: folder({
      modelRotX:   { label: "Rot X (deg)", value: 100,  min: -360, max: 360, step: 5 },
      modelRotY:   { label: "Rot Y (deg)", value: 180,  min: -360, max: 360, step: 5 },
      modelRotZ:   { label: "Rot Z (deg)", value: 90, min: -360, max: 360, step: 5 },
      modelPosX:   { label: "Pos X",       value: 0,  min: -20,  max: 20,  step: 0.5 },
      modelPosY:   { label: "Pos Y",       value: -1.0,  min: -20,  max: 20,  step: 0.5 },
      modelPosZ:   { label: "Pos Z",       value: -4.5,  min: -20,  max: 20,  step: 0.5 },
      modelScale:  { label: "Scale",       value: 0.1,  min: 0.1,  max: 10,  step: 0.1 },
      modelFitSize:{ label: "Fit Size",    value: 5,  min: 0.5,  max: 20,  step: 0.5 },
    }),
    Camera: folder({
      cameraFov:  { label: "FOV",   value: 65, min: 10,  max: 150, step: 1 },
      cameraPosX: { label: "Pos X", value: 0,  min: -30, max: 30,  step: 0.5 },
      cameraPosY: { label: "Pos Y", value: 0,  min: -30, max: 30,  step: 0.5 },
      cameraPosZ: { label: "Pos Z", value: 0,  min: -90, max: 90,  step: 0.5 },
    }),
    "Log config": button(() => {
      if (!scene) return;
      const { position, fov } = scene.camera;
      const model = scene.gltf.scene;
      console.log(JSON.stringify({
        modelRotation: {
          x: +(model.rotation.x / DEG2RAD).toFixed(1),
          y: +(model.rotation.y / DEG2RAD).toFixed(1),
          z: +(model.rotation.z / DEG2RAD).toFixed(1),
        },
        modelPosition: { x: +model.position.x.toFixed(3), y: +model.position.y.toFixed(3), z: +model.position.z.toFixed(3) },
        modelScale: +model.scale.x.toFixed(3),
        cameraFov: fov,
        cameraPosition: { x: +position.x.toFixed(3), y: +position.y.toFixed(3), z: +position.z.toFixed(3) },
      }, null, 2));
    }),
  });

  // Apply control changes to live scene
  useEffect(() => {
    if (!scene) return;
    const model = scene.gltf.scene;
    model.rotation.set(
      ctrl.modelRotX * DEG2RAD,
      ctrl.modelRotY * DEG2RAD,
      ctrl.modelRotZ * DEG2RAD,
    );
    model.position.set(ctrl.modelPosX, ctrl.modelPosY, ctrl.modelPosZ);
    model.scale.setScalar(ctrl.modelScale);
    scene.camera.fov = ctrl.cameraFov;
    scene.camera.position.set(ctrl.cameraPosX, ctrl.cameraPosY, ctrl.cameraPosZ);
    scene.camera.updateProjectionMatrix();
  }, [scene,
      ctrl.modelRotX, ctrl.modelRotY, ctrl.modelRotZ,
      ctrl.modelPosX, ctrl.modelPosY, ctrl.modelPosZ, ctrl.modelScale,
      ctrl.cameraFov, ctrl.cameraPosX, ctrl.cameraPosY, ctrl.cameraPosZ]);

  useSceneRotation(scene);

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
      modelScale: ctrl.modelScale,
      modelFitSize: ctrl.modelFitSize,
      modelPosition: { x: ctrl.modelPosX, y: ctrl.modelPosY, z: ctrl.modelPosZ },
      modelRotation: {
        x: ctrl.modelRotX * DEG2RAD,
        y: ctrl.modelRotY * DEG2RAD,
        z: ctrl.modelRotZ * DEG2RAD,
      },
      cameraFov: ctrl.cameraFov,
      cameraPosition: { x: ctrl.cameraPosX, y: ctrl.cameraPosY, z: ctrl.cameraPosZ },
    })
      .then((res) => {
        if (!mounted) return;
        setScene(res);
        _scene = res;
      })
      .catch((err) => {
        devLog("Projection scene failed:", err);
      });

    return () => {
      mounted = false;
      _scene?.dispose?.();
      setScene(null);
    };
  }, [dims]);

  const isLoading = !scene;

  return (
    <>
      <Leva collapsed={false} />
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {dims.w > 0 && (
          <div ref={pageRef} style={{ width: dims.w, height: dims.h, position: "relative" }}>
            <TestPattern width={dims.w} height={dims.h} />
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-(--muted) text-sm z-10 pointer-events-none">
            Loading 3D scene…
          </div>
        )}
      </div>
    </>
  );
};

// stiffness: 120,
    // damping: 20,
const useSceneRotation = (projectedScene: ProjectionScene | null) => {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0)
  const smoothCursorX = useSpring(cursorX);
  const smoothCursorY = useSpring(cursorY);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      cursorX.set((e.clientX / window.innerWidth) * 2 - 1);
      cursorY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [cursorX, cursorY]);



   useEffect(() => {
    let frameId: number;
    window.scene = projectedScene
    console.log(projectedScene?.gltf.animations)
    const loop = () => {
      if (projectedScene) {
        const x = smoothCursorX.get();
        const y = smoothCursorY.get();
        projectedScene.camera.rotation.z = x * 0.15;
        projectedScene.camera.rotation.y = y * 0.15;

        
        // const rot = new Vector3(x, y, 0)
        // scene.scene.setRotationFromAxisAngle(rot, 0) // (degRad(x))
        // window.scene = scene


        // scene.camera.rotation.z = x;
        // scene.camera.rotation.y = y;
      }

      frameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(frameId);
  }, [projectedScene, smoothCursorX, smoothCursorY]);


};
