import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
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
 * VideoShadow — renders the webcam silhouette as a dark overlay on the wall.
 * Must be a child of ProjectionSurface so it shares the wall's coordinate origin.
 *
 * planeSize: [width, height] in world units covering the projection area.
 *   Computed in SceneContent from the camera frustum at wall depth.
 */
export function VideoShadow({ videoRef, isActive, planeSize }) {
  const meshRef = useRef();
  const { size } = useThree();
  const aspect = size.width / size.height;

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uVideo: { value: null }, uThreshold: { value: 0.5 } },
        vertexShader,
        fragmentShader,
        transparent: false,
      }),
    [],
  );

  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    if (!isActive || !videoRef.current) return;

    const tex = new THREE.VideoTexture(videoRef.current);
    tex.minFilter = THREE.LinearFilter;
    // Mirror horizontally so the silhouette matches the user's perceived reflection
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(-1, 1);
    tex.offset.set(1, 0);
    mat.uniforms.uVideo.value = tex;

    return () => {
      tex.dispose();
      mat.uniforms.uVideo.value = null;
    };
  }, [isActive, videoRef, mat]);

  // Default: cover the projection area with a 16:9-ish plane
  const [pw, ph] = planeSize ?? [14 * aspect, 14];

  return (
    <mesh ref={meshRef} visible={isActive}>
      <planeGeometry args={[pw, ph]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
