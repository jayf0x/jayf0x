import { forwardRef, useRef, useImperativeHandle } from "react";
import { Canvas } from "@react-three/fiber";
import SceneContent from "./SceneContent";

const CaveScene = forwardRef(function CaveScene({ videoRef, isActive }, ref) {
  const captureRef = useRef(null);

  useImperativeHandle(ref, () => ({
    captureFrame: (quality) =>
      captureRef.current?.(quality) ?? Promise.resolve(null),
  }));

  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true }}
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{
        display: "block",
        width: "100vw",
        height: "100vh",
        position: "fixed",
        inset: 0,
      }}
    >
      <color attach="background" args={["#f5f0e8"]} />
      <SceneContent
        videoRef={videoRef}
        isActive={isActive}
        captureRef={captureRef}
      />
    </Canvas>
  );
});

export default CaveScene;
