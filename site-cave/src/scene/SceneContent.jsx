import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Preload } from "@react-three/drei";
import * as THREE from "three";
import { buildTextCanvas } from "./utils/textCanvas";
import { VideoShadow } from "./VideoShadow";
import { useCaptureFrame } from "./hooks/useCaptureFrame";

export default function SceneContent({ videoRef, isActive, captureRef }) {
  const { viewport } = useThree();
  const wallRef = useRef();

  useCaptureFrame(captureRef);

  useEffect(() => {
    const canvas = buildTextCanvas();
    const tex = new THREE.CanvasTexture(canvas);
    const mat = wallRef.current?.material;
    if (mat) {
      mat.map = tex;
      mat.needsUpdate = true;
    }
    return () => tex.dispose();
  }, []);

  return (
    <>
      <mesh ref={wallRef} scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial />
      </mesh>

      <Preload all />

      <VideoShadow videoRef={videoRef} isActive={isActive} />
      <OrbitControls />
    </>
  );
}
