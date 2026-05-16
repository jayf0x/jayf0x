import { useMemo } from "react";
import { createPortal, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Video } from "./components/Video";
import { ProjectText } from "./components/ProjectText";
import { VideoCam } from "./components/VideoCam";


export function ProjectedSurface({ target, videoRef, isActive }) {
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
      <Video />
      <ProjectText title="Phantom Lens" description="A privacy-first camera tool that redacts faces in real time before footage leaves the device." />
      <VideoCam videoRef={videoRef} isActive={isActive} />
    </>,
    scene,
  );
}
