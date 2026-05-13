import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 250;

// Fire source — sparks rise from this world position
const ORIGIN = { x: 0, y: -1.5, z: 1.5 };

function spawnParticle(i, pos, vel, ages, maxAges) {
  pos[i * 3 + 0] = ORIGIN.x + (Math.random() - 0.5) * 0.4;
  pos[i * 3 + 1] = ORIGIN.y + Math.random() * 0.15;
  pos[i * 3 + 2] = ORIGIN.z + (Math.random() - 0.5) * 0.25;

  vel[i * 3 + 0] = (Math.random() - 0.5) * 0.008;
  vel[i * 3 + 1] = Math.random() * 0.018 + 0.005; // upward
  vel[i * 3 + 2] = (Math.random() - 0.5) * 0.005;

  maxAges[i] = Math.random() * 2.0 + 0.8; // 0.8 – 2.8 s
  // stagger initial ages so particles don't all die at the same frame
  ages[i] = Math.random() * maxAges[i];
}

export function Dust({ opacity = 0.35 }) {
  const meshRef = useRef();

  const { pos, vel, ages, maxAges, dummy, color } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const ages = new Float32Array(COUNT);
    const maxAges = new Float32Array(COUNT);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      spawnParticle(i, pos, vel, ages, maxAges);
    }

    return { pos, vel, ages, maxAges, dummy, color };
  }, []);

  // Seed initial matrices to avoid all instances starting at world origin
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < COUNT; i++) {
      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      dummy.scale.setScalar(0.01);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, pos]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < COUNT; i++) {
      ages[i] -= delta;

      if (ages[i] <= 0) {
        spawnParticle(i, pos, vel, ages, maxAges);
      }

      const t = Math.max(0, ages[i] / maxAges[i]); // 1 = fresh, 0 = dying

      pos[i * 3 + 0] += vel[i * 3 + 0];
      pos[i * 3 + 1] += vel[i * 3 + 1];
      pos[i * 3 + 2] += vel[i * 3 + 2];

      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      // Shrink as they age; tiny random jitter prevents perfectly uniform size
      dummy.scale.setScalar((0.007 * t + 0.002) * (0.9 + Math.random() * 0.2));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // young: white/yellow → mid: orange → dying: deep red, fading out
      color.setHSL(0.07 - t * 0.07, 1.0, 0.35 + t * 0.45);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        transparent
        opacity={opacity}
        depthWrite={false}
        vertexColors
      />
    </instancedMesh>
  );
}
