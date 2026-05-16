import { useEffect, useMemo } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Luma threshold → opaque dark patch where subject is dark, transparent where bright.
// Renders inside ProjectionSurface's portal scene as a gobo layer.
// In the gobo: dark patches block spotlight → shadow on wall.
// uThreshold: luma cutoff (lower = more of the image becomes shadow)
// uSoftness:  smoothstep half-width (higher = softer shadow edges)
const fragmentShader = `
uniform sampler2D uVideo;
uniform float uThreshold;
uniform float uSoftness;
varying vec2 vUv;

void main() {
  vec4 col = texture2D(uVideo, vUv);
  float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  float shadow = 1.0 - smoothstep(uThreshold - uSoftness, uThreshold + uSoftness, luma);
  if (shadow < 0.01) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, shadow * 0.95);
}
`;

/**
 * ProjectedVideoCam — luma-threshold shadow layer for the ProjectionSurface gobo.
 *
 * Designed to run inside ProjectionSurface's createPortal scene (same coordinate
 * space as Mp4Mesh / TextMesh). Geometry fills the orthographic camera view.
 *
 * When isActive (webcam on): uses the live webcam feed, mirrored left-right.
 * Otherwise: falls back to /video.mp4 through the same shader.
 *
 * Dark source pixels → opaque black patch in the gobo → spotlight blocked → shadow on wall.
 * Light source pixels → discarded → gobo unchanged → light passes through.
 *
 * Use at renderOrder=2 so it paints on top of Mp4Mesh (0) and TextMesh (1).
 */
export const VideoCam = ({ videoRef, isActive }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uVideo: { value: null },
          uThreshold: { value: 0.5 },
          uSoftness: { value: 0.18 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    if (isActive && videoRef?.current) {
      const tex = new THREE.VideoTexture(videoRef.current);
      tex.minFilter = THREE.LinearFilter;
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.set(-1, 1);
      tex.offset.set(1, 0);
      mat.uniforms.uVideo.value = tex;
      return () => {
        tex.dispose();
        mat.uniforms.uVideo.value = null;
      };
    }

    const vid = document.createElement("video");
    vid.src = "/video.mp4";
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.crossOrigin = "anonymous";
    const tex = new THREE.VideoTexture(vid);
    tex.minFilter = THREE.LinearFilter;
    mat.uniforms.uVideo.value = tex;
    vid.play().catch(console.error);

    return () => {
      tex.dispose();
      vid.pause();
      vid.src = "";
      mat.uniforms.uVideo.value = null;
    };
  }, [isActive, videoRef, mat]);

  return (
    <mesh renderOrder={2}>
      <planeGeometry args={[2, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};
