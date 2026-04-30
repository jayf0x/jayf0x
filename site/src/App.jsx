import { Canvas } from '@react-three/fiber'
import { HexSurface } from './components/HexSurface'

export const App = () => {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#faf8f2' }}>
      <Canvas
        camera={{ fov: 28, near: 1, far: 20000 }}
        gl={{ antialias: true, toneMapping: 0 }}
        style={{ width: '100%', height: '100%' }}
      >
        <HexSurface />
      </Canvas>
    </div>
  )
}
