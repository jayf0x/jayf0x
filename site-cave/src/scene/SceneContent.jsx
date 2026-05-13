import { useRef, useEffect, useMemo, useState, memo } from "react";
import { useGLTF, Preload, OrbitControls } from "@react-three/drei";
import { useControls, folder } from "leva";
import {
  EffectComposer,
  GodRays,
  Bloom,
  DepthOfField,
  Noise,
  Vignette,
  Glitch,
} from "@react-three/postprocessing";
import * as THREE from "three";
import { buildGoboCanvas } from "./utils/textCanvas";
// import { VideoShadow } from "./VideoShadow";
import { useCaptureFrame } from "./hooks/useCaptureFrame";
import { Dust } from "./Dust";

useGLTF.preload("/wall.glb");

const WallMesh = memo(function WallMesh({
  wallX,
  wallY,
  wallZ,
  wallScale,
  wallRotX,
}) {
  const { scene } = useGLTF("/wall.glb");

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
        if (child.material) {
          child.material.depthTest = true;
          child.material.depthWrite = true;
        }
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      position={[wallX, -1 + wallY, -2 + wallZ]}
      scale={0.25 + wallScale}
      rotation={[wallRotX, Math.PI, 0]}
    />
  );
});

// Small QA cube — visible in leva, casts shadow on wall
const QACube = memo(function QACube({ x, y, z, scale }) {
  return (
    <mesh position={[x, y, z]} scale={scale} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#5a4020" roughness={0.85} metalness={0.05} />
    </mesh>
  );
});

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
    fogDensity,
    fogColor,
    // god-rays origin (decoupled from spotlight — must stay within camera frustum)
    sunX,
    sunY,
    sunZ,
    sunSize,
    godRaysDensity,
    godRaysWeight,
    godRaysDecay,
    fireIntensity,
    // QA
    cubeX,
    cubeY,
    cubeZ,
    cubeScale,
  } = useControls({
    Projector: folder({
      lightX: { value: 0, min: -5, max: 5, step: 0.01 },
      lightY: { value: 0.5, min: -5, max: 5, step: 0.01 },
      lightZ: { value: 3.5, min: -5, max: 5, step: 0.01 },
      lightIntensity: { value: 18, min: 0, max: 80, step: 0.5 },
      lightAngle: { value: 0.45, min: 0.05, max: 1.2, step: 0.01 },
      lightPenumbra: { value: 0.35, min: 0, max: 1, step: 0.01 },
    }),
    Wall: folder({
      wallX: { value: 0, min: -5, max: 5, step: 0.01 },
      wallY: { value: 0, min: -5, max: 5, step: 0.01 },
      wallZ: { value: 0, min: -10, max: 2, step: 0.01 },
      wallScale: { value: 0, min: 0.05, max: 5, step: 0.01 },
      wallRotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    }),
    Atmosphere: folder({
      ambientIntensity: { value: 3, min: 0, max: 10, step: 0.01 },
      dustOpacity: { value: 0.35, min: 0, max: 1, step: 0.01 },
      fogColor: { value: "#000" },
      fogDensity: { value: 0.09, min: 0, max: 0.5, step: 0.001 },
      bloomIntensity: { value: 0.6, min: 0, max: 3, step: 0.05 },
    }),
    "God Rays": folder({
      showGodRays: { value: true },
      // position independently — must be in camera frustum (z < 5 when camera is at z=5)
      sunX: { value: 0, min: -5, max: 5, step: 0.01 },
      sunY: { value: 0, min: -5, max: 5, step: 0.01 },
      sunZ: { value: 1.9, min: -5, max: 5, step: 0.01 },
      sunSize: { value: 0.3, min: 0.01, max: 1, step: 0.01 },
      godRaysDensity: { value: 0.96, min: 0, max: 1, step: 0.01 },
      godRaysWeight: { value: 0.6, min: 0, max: 1, step: 0.01 },
      godRaysDecay: { value: 0.93, min: 0, max: 1, step: 0.01 },
      fireIntensity: { value: 8, min: 0, max: 40, step: 0.5 },
    }),
    "QA Cube": folder({
      cubeX: { value: 0, min: -5, max: 5, step: 0.01 },
      cubeY: { value: 0, min: -5, max: 5, step: 0.01 },
      cubeZ: { value: 2, min: -5, max: 5, step: 0.01 },
      cubeScale: { value: 0.4, min: 0.01, max: 5, step: 0.01 },
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

  // Spotlight (projector behind viewer — does NOT need to be in frustum)
  const lightPos = useMemo(
    () => [0.8 + lightX, -2 + lightY, 4 + lightZ],
    [lightX, lightY, lightZ],
  );

  // Sun must be BEHIND the cube from the camera's perspective (sun.z < cube.z)
  const sunPos = useMemo(() => [sunX, sunY, sunZ], [sunX, sunY, sunZ]);

  return (
    <>
      {/* Cave atmosphere fog — exponential, dark warm shadow */}
      <fogExp2 attach="fog" args={[fogColor, fogDensity]} />

      <ambientLight intensity={ambientIntensity} color="#6a5a3a" />

      {/* SpotLight target anchor at scene centre */}
      <group ref={targetRef} position={[0, 0, 0]} />

      {/* Projector spotlight — casts gobo text light onto wall + shadows */}
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

      {/* GodRays source — mesh required by GodRays effect; pointLight adds real fire illumination */}
      <mesh ref={setSunMesh} position={sunPos}>
        <sphereGeometry args={[sunSize, 12, 12]} />
        <meshBasicMaterial color="#ff6a00" />
      </mesh>
      <pointLight
        position={sunPos}
        intensity={fireIntensity}
        color="#ff6a00"
        distance={8}
        decay={2}
        castShadow
        shadow-mapSize={[512, 512]}
      />

      <WallMesh {...{ wallX, wallY, wallZ, wallScale, wallRotX }} />

      <QACube x={cubeX} y={cubeY} z={cubeZ} scale={cubeScale} />

      {/* <Dust opacity={dustOpacity} /> */}
      {/* <VideoShadow videoRef={videoRef} isActive={isActive} /> */}

      <Preload all />

      {/* depth worlds:
          - scene geometry uses renderer depthBuffer (managed by Canvas shadows prop)
          - GodRays reads depth internally via needsDepthTexture (handled by postprocessing)
          - Bloom operates on color only
          - stencilBuffer={false} prevents depth/stencil sharing → kills blit error */}
      <EffectComposer
      // multisampling={1}
      // depthBuffer={true}
      // stencilBuffer={false}
      >
        {/* {showGodRays && sunMesh ? (
          <GodRays
            sun={sunMesh}
            samples={60}
            density={godRaysDensity}
            decay={godRaysDecay}
            weight={godRaysWeight}
            exposure={0.6}
            clampMax={1}
            blur
          />
        ) : null}
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.4}
          intensity={bloomIntensity}
        /> */}

        {/* <DepthOfField
          focusDistance={0}
          focalLength={10.102}
          height={window.height}
        /> */}
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        {/* <Noise opacity={0.02} /> */}
        <Vignette eskil={false} offset={0.1} darkness={0.8} />

        {showGodRays && sunMesh && (
          <GodRays
            sun={sunMesh}
            samples={60}
            density={godRaysDensity}
            decay={godRaysDecay}
            weight={godRaysWeight}
            exposure={0.6}
            clampMax={1}
            width={800}
            height={800}
            blur
          />
        )}
      </EffectComposer>
    </>
  );
}
