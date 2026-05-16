import { useEffect, useRef } from "react";
import * as THREE from "three";

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

export const Video = () => {
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
    if (mat) {
      mat.map = tex;
      mat.needsUpdate = true;
    }

    const onPlaying = () => {
      if (meshRef.current) meshRef.current.visible = true;
    };
    vid.addEventListener("playing", onPlaying);
    vid.play().catch(console.error);

    return () => {
      vid.removeEventListener("playing", onPlaying);
      vid.pause();
      vid.src = "";
      tex.dispose();
      if (mat) {
        mat.map = null;
        mat.needsUpdate = true;
      }
    };
  }, []);

  return (
    <mesh ref={meshRef} renderOrder={0} visible={false}>
      <planeGeometry args={[2, 1]} />
      <meshBasicMaterial ref={matRef} depthTest={false} depthWrite={false} />
    </mesh>
  );
};
