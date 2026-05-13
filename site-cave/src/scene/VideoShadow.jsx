/* eslint-disable react-hooks/immutability */
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

export function VideoShadow({ videoRef, isActive }) {
  const { viewport } = useThree();
  const meshRef = useRef();

  // Create material once imperatively — prevents R3F prop reconciliation from
  // overwriting uniforms.uVideo back to null on every parent re-render.
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uVideo: { value: null }, uThreshold: { value: 0.6 } },
        vertexShader,
        fragmentShader,
        transparent: true,
      }),
    [],
  );

  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    if (!isActive || !videoRef.current) return;

    const tex = new THREE.VideoTexture(videoRef.current);
    tex.minFilter = THREE.LinearFilter;
    mat.uniforms.uVideo.value = tex;

    return () => {
      tex.dispose();
      mat.uniforms.uVideo.value = null;
    };
  }, [isActive, videoRef, mat]);

  return (
    <mesh
      ref={meshRef}
      visible={isActive}
      scale={[-viewport.width, viewport.height, 1]}
      position={[0, 0, 0.01]}
    >
      <planeGeometry args={[1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
