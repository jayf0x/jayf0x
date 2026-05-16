import { useMemo, useEffect, useRef } from "react";
import { createPortal, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildGoboCanvas } from "./utils/textCanvas";

/**
 * ProjectionSurface — composites layers into `target` for the spotlight gobo.
 *
 * Layers (rendered in an offscreen scene via createPortal):
 *   0  mp4 video    — looping video, base layer (hidden until first frame plays)
 *   1  text         — white text on black, AdditiveBlending (adds brightness on top)
 *   2  webcam       — user silhouette, MultiplyBlending (dims where person is dark)
 *
 * Everything is projected onto the wall via the spotlight — no floating planes.
 */

function Mp4Mesh() {
  const meshRef = useRef();
  const matRef = useRef();

  useEffect(() => {
    const vid = document.createElement("video");
    vid.src = "/video.mp4";
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.crossOrigin = "anonymous";

    const tex = new THREE.VideoTexture(vid);
    tex.minFilter = THREE.LinearFilter;

    const mat = matRef.current;
    if (mat) { mat.map = tex; mat.needsUpdate = true; }

    const onPlaying = () => { if (meshRef.current) meshRef.current.visible = true; };
    vid.addEventListener("playing", onPlaying);
    vid.play().catch(console.error);

    return () => {
      vid.removeEventListener("playing", onPlaying);
      vid.pause();
      vid.src = "";
      tex.dispose();
      if (mat) { mat.map = null; mat.needsUpdate = true; }
    };
  }, []);

  return (
    <mesh ref={meshRef} renderOrder={0} visible={false}>
      <planeGeometry args={[2, 1]} />
      <meshBasicMaterial ref={matRef} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

function TextMesh() {
  const texture = useMemo(
    () => new THREE.CanvasTexture(buildGoboCanvas()),
    [],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh renderOrder={1}>
      <planeGeometry args={[2, 1]} />
      <meshBasicMaterial
        map={texture}
        blending={THREE.AdditiveBlending}
        depthTest={false}
        depthWrite={false}
        transparent
      />
    </mesh>
  );
}

function WebcamMesh({ videoRef }) {
  const matRef = useRef();

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const tex = new THREE.VideoTexture(vid);
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(-1, 1);
    tex.offset.set(1, 0);

    const mat = matRef.current;
    if (mat) { mat.map = tex; mat.needsUpdate = true; }

    return () => {
      tex.dispose();
      if (mat) { mat.map = null; mat.needsUpdate = true; }
    };
  }, [videoRef]);

  return (
    <mesh renderOrder={2}>
      <planeGeometry args={[2, 1]} />
      <meshBasicMaterial
        ref={matRef}
        blending={THREE.MultiplyBlending}
        depthTest={false}
        depthWrite={false}
        transparent
      />
    </mesh>
  );
}

export function ProjectionSurface({ target, videoRef, isActive }) {
  const [scene, camera] = useMemo(() => {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x000000);
    const cam = new THREE.OrthographicCamera(-1, 1, 0.5, -0.5, 0.1, 10);
    cam.position.set(0, 0, 5);
    return [s, cam];
  }, []);

  useFrame(({ gl }) => {
    const prev = gl.autoClear;
    gl.autoClear = true;
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.autoClear = prev;
  });

  return createPortal(
    <>
      <Mp4Mesh />
      <TextMesh />
      {isActive && videoRef?.current && <WebcamMesh videoRef={videoRef} />}
    </>,
    scene,
  );
}
