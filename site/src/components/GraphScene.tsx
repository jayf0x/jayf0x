import { useRef, useEffect } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { Line2Props, OrbitControls } from "@react-three/drei"
import { EffectComposer as PostComposer, RenderPass, EffectPass, BloomEffect } from "postprocessing"
import { useControls } from "leva"
import { useRegistryStore } from "../store/registryStore"
import { SLABS } from "../layout/slabs"
import { SlabVolume } from "./SlabVolume"
import { NodeMesh } from "./NodeMesh"
import { EdgeLine } from "./EdgeLine"
import { ThreadLine } from "./ThreadLine"

// Drive postprocessing directly to avoid @react-three/postprocessing's
// __r3f.objects traversal which broke in R3F v9.
function PostFX() {
  const { gl, scene, camera, size } = useThree()
  const composerRef = useRef<PostComposer | null>(null)

  const { intensity, threshold, smoothing } = useControls("Bloom", {
    intensity: { value: 1.2, min: 0, max: 5, step: 0.1 },
    threshold: { value: 0.1, min: 0, max: 1, step: 0.01 },
    smoothing: { value: 0.9, min: 0, max: 1, step: 0.05 },
  })

  // Recreate composer whenever renderer / scene / camera changes
  useEffect(() => {
    const bloom = new BloomEffect({
      intensity,
      luminanceThreshold: threshold,
      luminanceSmoothing: smoothing,
    })
    const composer = new PostComposer(gl)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(new EffectPass(camera, bloom))
    composer.setSize(size.width, size.height)
    composerRef.current = composer

    return () => {
      composer.dispose()
      composerRef.current = null
    }
    // Intentionally excludes bloom params — those are updated via the second effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera])

  // Sync size
  useEffect(() => {
    composerRef.current?.setSize(size.width, size.height)
  }, [size])

  // Render after R3F's default pass (priority 1 > default 0)
  useFrame((_, delta) => {
    composerRef.current?.render(delta)
  }, 1)

  return null
}

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
        // lineRef.current.material.dashOffset += delta * 2
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
            ref={(elm) => {
              lineRefs.current[index] = elm
            }}
            source={src}
            target={tgt}
          />
        )
      })}

      <PostFX />
    </>
  )
}

export function GraphScene() {
  return (
    <div className="relative w-full h-full">
      <span className="absolute top-4 left-0 right-0 text-center text-xs text-white/30 z-10 pointer-events-none tracking-widest uppercase">
        What&apos;s Actually Happening
      </span>
      <Canvas camera={{ position: [0, 3, 8], fov: 50 }} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={["#0a0a0a"]} />
        <SceneContent />
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.4}
          enableDamping
          dampingFactor={0.08}
          makeDefault
        />
      </Canvas>
    </div>
  )
}
