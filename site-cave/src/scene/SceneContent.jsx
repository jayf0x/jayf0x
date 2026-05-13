import { useRef, useEffect, useMemo, useState, memo } from "react";
import { useGLTF, Preload, OrbitControls } from "@react-three/drei";
import { useControls, folder } from "leva";
import {
  EffectComposer,
  GodRays,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";
import { useCaptureFrame } from "./hooks/useCaptureFrame";
import { Dust } from "./Dust";
import { ProjectionSurface } from "./ProjectionSurface";
import { SCENE_CONFIG as C } from "./config";

useGLTF.preload("/wall.glb");

const WallMesh = memo(function WallMesh({ wallX, wallY, wallZ, wallScale, wallRotX }) {
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
    lightX, lightY, lightZ,
    lightIntensity, lightAngle, lightPenumbra,
    wallX, wallY, wallZ, wallScale, wallRotX,
    ambientIntensity, dustOpacity,
    showGodRays, bloomIntensity, fogDensity, fogColor,
    sunX, sunY, sunZ, sunSize,
    godRaysDensity, godRaysWeight, godRaysDecay, fireIntensity,
    cubeX, cubeY, cubeZ, cubeScale,
  } = useControls({
    Projector: folder({
      lightX: { value: C.lightX, min: -5, max: 5, step: 0.01 },
      lightY: { value: C.lightY, min: -5, max: 5, step: 0.01 },
      lightZ: { value: C.lightZ, min: -5, max: 5, step: 0.01 },
      lightIntensity: { value: C.lightIntensity, min: 0, max: 80, step: 0.5 },
      lightAngle: { value: C.lightAngle, min: 0.05, max: 1.2, step: 0.01 },
      lightPenumbra: { value: C.lightPenumbra, min: 0, max: 1, step: 0.01 },
    }),
    Wall: folder({
      wallX: { value: C.wallX, min: -5, max: 5, step: 0.01 },
      wallY: { value: C.wallY, min: -5, max: 5, step: 0.01 },
      wallZ: { value: C.wallZ, min: -10, max: 2, step: 0.01 },
      wallScale: { value: C.wallScale, min: 0.05, max: 5, step: 0.01 },
      wallRotX: { value: C.wallRotX, min: -Math.PI, max: Math.PI, step: 0.01 },
    }),
    Atmosphere: folder({
      ambientIntensity: { value: C.ambientIntensity, min: 0, max: 10, step: 0.01 },
      dustOpacity: { value: C.dustOpacity, min: 0, max: 1, step: 0.01 },
      fogColor: { value: C.fogColor },
      fogDensity: { value: C.fogDensity, min: 0, max: 0.5, step: 0.001 },
      bloomIntensity: { value: C.bloomIntensity, min: 0, max: 1.5, step: 0.05 },
    }),
    "God Rays": folder({
      showGodRays: { value: C.showGodRays },
      sunX: { value: C.sunX, min: -5, max: 5, step: 0.01 },
      sunY: { value: C.sunY, min: -5, max: 5, step: 0.01 },
      sunZ: { value: C.sunZ, min: -5, max: 5, step: 0.01 },
      sunSize: { value: C.sunSize, min: 0.01, max: 1, step: 0.01 },
      godRaysDensity: { value: C.godRaysDensity, min: 0, max: 1, step: 0.01 },
      godRaysWeight: { value: C.godRaysWeight, min: 0, max: 1, step: 0.01 },
      godRaysDecay: { value: C.godRaysDecay, min: 0, max: 1, step: 0.01 },
      fireIntensity: { value: C.fireIntensity, min: 0, max: 40, step: 0.5 },
    }),
    "QA Cube": folder({
      cubeX: { value: C.cubeX, min: -5, max: 5, step: 0.01 },
      cubeY: { value: C.cubeY, min: -5, max: 5, step: 0.01 },
      cubeZ: { value: C.cubeZ, min: -5, max: 5, step: 0.01 },
      cubeScale: { value: C.cubeScale, min: 0.01, max: 5, step: 0.01 },
    }),
  });

  const projTarget = useMemo(
    () => new THREE.WebGLRenderTarget(1024, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    }),
    [],
  );
  useEffect(() => () => projTarget.dispose(), [projTarget]);

  useEffect(() => {
    const spot = spotRef.current;
    const tgt = targetRef.current;
    if (!spot || !tgt) return;
    spot.target = tgt;
    tgt.updateMatrixWorld();
  }, []);

  const lightPos = useMemo(
    () => [0.8 + lightX, -2 + lightY, 4 + lightZ],
    [lightX, lightY, lightZ],
  );
  const sunPos = useMemo(() => [sunX, sunY, sunZ], [sunX, sunY, sunZ]);

  return (
    <>
      <fogExp2 attach="fog" args={[fogColor, fogDensity]} />
      <ambientLight intensity={ambientIntensity} color="#6a5a3a" />
      <group ref={targetRef} position={[0, 0, 0]} />

      <spotLight
        ref={spotRef}
        position={lightPos}
        intensity={lightIntensity}
        angle={lightAngle}
        penumbra={lightPenumbra}
        map={projTarget.texture}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.001}
        color="#fff5d6"
      />
      <OrbitControls />

      {/* <mesh ref={setSunMesh} position={sunPos}>
        <sphereGeometry args={[sunSize, 12, 12]} />
        <meshBasicMaterial color="#ff6a00" />
      </mesh> */}
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

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0805" roughness={1} metalness={0} />
      </mesh>

      <QACube x={cubeX} y={cubeY} z={cubeZ} scale={cubeScale} />

      {/* DEBUG: shows projTarget content — remove after fixing */}
      <mesh position={[0, 0, 2]}>
        <planeGeometry args={[3, 1.5]} />
        <meshBasicMaterial map={projTarget.texture} side={THREE.DoubleSide} />
      </mesh>

      {/* DEBUG: white wall to verify spotlight projection */}
      <mesh position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} />
      </mesh>

      <Dust opacity={dustOpacity} />

      <ProjectionSurface target={projTarget} videoRef={videoRef} isActive={isActive} />

      <Preload all />

      {/* multisampling={0} prevents EffectComposer from allocating extra MSAA buffers. */}
      {/* <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={bloomIntensity} />
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
      </EffectComposer> */}
    </>
  );
}
