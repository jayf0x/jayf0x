import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

const COUNT = 300;

export function Dust({ opacity = 0.35 }) {
  const pointsRef = useRef();

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.0015;
      velocities[i * 3 + 1] = Math.random() * 0.0008 + 0.0001;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0008;
    }
    return { positions, velocities };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const attr = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      attr.array[i * 3 + 0] += velocities[i * 3 + 0];
      attr.array[i * 3 + 1] += velocities[i * 3 + 1];
      attr.array[i * 3 + 2] += velocities[i * 3 + 2];
      if (attr.array[i * 3 + 1] > 2.5) attr.array[i * 3 + 1] = -2.5;
      if (Math.abs(attr.array[i * 3 + 0]) > 4) velocities[i * 3 + 0] *= -1;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#c4a87a"
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
