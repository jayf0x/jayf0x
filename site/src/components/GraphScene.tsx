import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import { useControls } from "leva"
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

      {crossEdges.map((e) => {
        const src = nodes[e.sourceId]
        const tgt = nodes[e.targetId]
        return <ThreadLine key={`${e.sourceId}-${e.targetId}`} source={src} target={tgt} />
      })}
    </>
  )
}

function PostFX() {
  const { intensity, threshold, smoothing } = useControls("Bloom", {
    intensity:  { value: 1.2, min: 0, max: 5,   step: 0.1 },
    threshold:  { value: 0.1, min: 0, max: 1,   step: 0.01 },
    smoothing:  { value: 0.9, min: 0, max: 1,   step: 0.05 },
  })

  return (
    <EffectComposer>
      <Bloom intensity={intensity} luminanceThreshold={threshold} luminanceSmoothing={smoothing} />
    </EffectComposer>
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
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#0a0a0a"]} />
        <SceneContent />
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.4}
          enableDamping
          dampingFactor={0.08}
          makeDefault
        />
        <PostFX />
      </Canvas>
    </div>
  )
}
