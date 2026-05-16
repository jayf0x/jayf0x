import { useEffect, useMemo } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Dark pixels → shadow, light pixels → transparent.
// smoothstep gives soft edges for a more natural silhouette.
const fragmentShader = `
uniform sampler2D uVideo;
uniform float uThreshold;
varying vec2 vUv;
void main() {
  vec4 col = texture2D(uVideo, vUv);
  float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  float shadow = 1.0 - smoothstep(uThreshold - 0.15, uThreshold + 0.15, luma);
  if (shadow < 0.01) discard;
  gl_FragColor = vec4(0.05, 0.04, 0.06, shadow * 0.9);
}
`;

/**
 * VideoShadow — dark silhouette overlay on the wall.
 *
 * When `isActive` (webcam on): uses the live webcam feed, mirrored.
 * Otherwise: loops /video.mp4 through the same shadow shader.
 * Both paths produce a luma-based dark overlay — dark source areas cast shadow,
 * light areas are transparent.
 */
export function VideoShadow({ videoRef, isActive }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uVideo: { value: null },
          uThreshold: { value: 0.5 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => () => mat.dispose(), [mat]);

  // eslint-disable-next-line react-hooks/immutability
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
    <mesh position={[0, 0, 1]}>
      <planeGeometry args={[16, 10]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
