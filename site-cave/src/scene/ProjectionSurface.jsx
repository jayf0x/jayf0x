import { useMemo, useEffect, useRef } from "react";
import { createPortal, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildGoboCanvas } from "./utils/textCanvas";
import { VideoShadow } from "./VideoShadow";

/**
 * ProjectionSurface — composites layers into `target` for the spotlight gobo.
 *
 * Layers (rendered in an offscreen scene via createPortal):
 *   0  mp4 video    — looping video, base layer (hidden until first frame plays)
 *   1  text         — white text on black, AdditiveBlending (adds brightness)
 *   2  shadow       — luma-threshold silhouette, NormalBlending (blocks light where dark)
 *
 * Scene background is near-black (#151515) rather than pure black so there is a
 * faint base everywhere in the spotlight cone — this makes the shadow silhouette
 * visible even outside the video/text areas.
 *
 * Everything is projected onto the wall via the spotlight gobo — no floating planes.
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

export function ProjectionSurface({ target, videoRef, isActive }) {
  const [scene, camera] = useMemo(() => {
    const s = new THREE.Scene();
    // Near-black instead of pure black — provides a faint base glow across the
    // entire spotlight cone so the shadow silhouette is visible outside text/video.
    s.background = new THREE.Color(0x151515);
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
      <VideoShadow videoRef={videoRef} isActive={isActive} />
    </>,
    scene,
  );
}
