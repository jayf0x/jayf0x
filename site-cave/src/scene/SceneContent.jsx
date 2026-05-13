import { useRef, useEffect, useMemo, useState } from "react";
import { useGLTF, Preload, OrbitControls } from "@react-three/drei";
import { useControls, folder } from "leva";
import { EffectComposer, GodRays, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { buildGoboCanvas } from "./utils/textCanvas";
import { VideoShadow } from "./VideoShadow";
import { useCaptureFrame } from "./hooks/useCaptureFrame";
import { Dust } from "./Dust";

useGLTF.preload("/wall.glb");

function WallMesh({ controls }) {
  const { scene } = useGLTF("/wall.glb");

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      position={[controls.wallX, -1 + controls.wallY, -2 + controls.wallZ]}
      scale={0.25 + controls.wallScale}
      rotation={[controls.wallRotX, Math.PI + 0, 0]}
    />
  );
}

export default function SceneContent({ videoRef, isActive, captureRef }) {
  const spotRef = useRef();
  const targetRef = useRef();
  const [sunMesh, setSunMesh] = useState(null);

  useCaptureFrame(captureRef);

  const {
    lightX,
    lightY,
    lightZ,
    lightIntensity,
    lightAngle,
    lightPenumbra,
    wallX,
    wallY,
    wallZ,
    wallScale,
    wallRotX,
    ambientIntensity,
    dustOpacity,
    showGodRays,
    bloomIntensity,
  } = useControls({
    Projector: folder({
      lightX: { value: 0, min: -4, max: 4, step: 0.05 },
      lightY: { value: 0.5, min: -4, max: 4, step: 0.05 },
      lightZ: { value: 3.5, min: 0.5, max: 10, step: 0.05 },
      lightIntensity: { value: 18, min: 0, max: 80, step: 0.5 },
      lightAngle: { value: 0.45, min: 0.05, max: 1.2, step: 0.01 },
      lightPenumbra: { value: 0.35, min: 0, max: 1, step: 0.01 },
    }),
    Wall: folder({
      wallX: { value: 0, min: -5, max: 5, step: 0.05 },
      wallY: { value: 0, min: -5, max: 5, step: 0.05 },
      wallZ: { value: 0, min: -8, max: 2, step: 0.05 },
      wallScale: { value: 0, min: 0.05, max: 5, step: 0.05 },
      wallRotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    }),
    Atmosphere: folder({
      ambientIntensity: { value: 0.06, min: 0, max: 10.5, step: 0.01 },
      dustOpacity: { value: 0.35, min: 0, max: 1, step: 0.01 },
      showGodRays: { value: true },
      bloomIntensity: { value: 0.6, min: 0, max: 3, step: 0.05 },
    }),
  });

  // Build gobo texture once
  const goboTex = useMemo(() => {
    const canvas = buildGoboCanvas();
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => goboTex.dispose(), [goboTex]);

  // Wire SpotLight target after mount
  useEffect(() => {
    const spot = spotRef.current;
    const target = targetRef.current;
    if (!spot || !target) return;
    spot.target = target;
    target.updateMatrixWorld();
  }, []);

  const lightPos = [0.8 + lightX, -2 + lightY, 4 + lightZ];

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#6a5a3a" />

      {/* SpotLight target anchor at scene centre */}
      <group ref={targetRef} position={[0, 0, 0]} />

      {/* Projector spotlight with text gobo */}
      <spotLight
        ref={spotRef}
        position={lightPos}
        intensity={lightIntensity}
        angle={lightAngle}
        penumbra={lightPenumbra}
        map={goboTex}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.001}
        color="#fff5d6"
      />
      <OrbitControls />

      {/* Tiny bright sphere at light position — used as GodRays sun */}
      <mesh ref={setSunMesh} position={lightPos}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#fff8e0" />
      </mesh>

      <WallMesh controls={{ wallX, wallY, wallZ, wallScale, wallRotX }} />

      {/* <Dust opacity={dustOpacity} /> */}

      {/* <VideoShadow videoRef={videoRef} isActive={isActive} /> */}

      <Preload all />

      <EffectComposer>
        {showGodRays && sunMesh ? (
          <GodRays
            sun={sunMesh}
            samples={60}
            density={0.85}
            decay={0.9}
            weight={0.4}
            exposure={0.6}
            clampMax={1}
            blur
          />
        ) : null}
        <Bloom
          luminanceThreshold={0.25}
          luminanceSmoothing={0.3}
          intensity={bloomIntensity}
        />
      </EffectComposer>
    </>
  );
}
