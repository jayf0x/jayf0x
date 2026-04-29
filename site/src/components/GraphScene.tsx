// Canvas imported from the WebGPU entry — uses WebGPURenderer, no WebGL deprecation warning.
// postprocessing@6 needs WebGLRenderer.getContext() which WebGPURenderer doesn't expose,
// so bloom is disabled. Re-enable when postprocessing v7 clears the three@0.184 peer range.
import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Line2Props, OrbitControls } from "@react-three/drei"
import { useRegistryStore } from "../store/registryStore"
import { SLABS } from "../layout/slabs"
import { SlabVolume } from "./SlabVolume"
import { NodeMesh } from "./NodeMesh"
import { EdgeLine } from "./EdgeLine"
import { ThreadLine } from "./ThreadLine"

function SceneContent() {
  const nodes = useRegistryStore((s) => s.nodes)
  const edges = useRegistryStore((s) => s.edges)

  const nodeList = Object.values(nodes)

  const intraEdges = edges.filter((e) => {
    const src = nodes[e.sourceId]
    const tgt = nodes[e.targetId]
    return src && tgt && src.slab === tgt.slab
  })

  const crossEdges = edges.filter((e) => {
    const src = nodes[e.sourceId]
    const tgt = nodes[e.targetId]
    return src && tgt && src.slab !== tgt.slab
  })

  const slabList = Object.values(SLABS)
  const lineRefs = useRef<Line2Props[]>([])

  useFrame((_, delta) => {
    for (const line of lineRefs.current) {
      if (line?.material) {
        line.material.dashOffset -= delta * 0.2
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 6, 6]} intensity={0.4} />

      {slabList.map((slab) => (
        <SlabVolume key={slab.id} slab={slab} />
      ))}

      {nodeList.map((node) => (
        <NodeMesh key={node.id} node={node} />
      ))}

      {intraEdges.map((e) => {
        const src = nodes[e.sourceId]
        const tgt = nodes[e.targetId]
        return <EdgeLine key={`${e.sourceId}-${e.targetId}`} source={src} target={tgt} />
      })}

      {crossEdges.map((e, index) => {
        const src = nodes[e.sourceId]
        const tgt = nodes[e.targetId]
        return (
          <ThreadLine
            key={`${e.sourceId}-${e.targetId}`}
            ref={(elm) => { lineRefs.current[index] = elm }}
            source={src}
            target={tgt}
          />
        )
      })}
    </>
  )
}

export function GraphScene() {
  return (
    <div className="relative w-full h-full">
      <span className="absolute top-4 left-0 right-0 text-center text-xs text-white/30 z-10 pointer-events-none tracking-widest uppercase">
        What&apos;s Actually Happening
      </span>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 50 }}
      >
        <color attach="background" args={["#0a0a0a"]} />
        <SceneContent />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          makeDefault
        />
      </Canvas>
    </div>
  )
}
