import { useRef, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCamera } from './hooks/useCamera'
import { useSegmentation } from './hooks/useSegmentation'
import { useVision } from './hooks/useVision'
import ProjectionCanvas from './components/ProjectionCanvas'
import VideoFeed from './components/VideoFeed'
import VisionPanel from './components/VisionPanel'

const queryClient = new QueryClient()

function Cave() {
  const canvasRef = useRef(null)
  const { videoRef, isActive, toggle } = useCamera()
  const maskRef = useSegmentation(videoRef, isActive)

  const captureFrame = useCallback(() => {
    return canvasRef.current?.captureFrame() ?? null
  }, [])

  const { status, result, error } = useVision(captureFrame)

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <ProjectionCanvas ref={canvasRef} maskRef={maskRef} isActive={isActive} />
      <VideoFeed videoRef={videoRef} />

      <button
        onClick={toggle}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          padding: '8px 16px',
          background: isActive ? '#aa3bff' : 'rgba(8,6,13,0.6)',
          color: '#e8e0f5',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6,
          fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
          transition: 'background 0.2s',
          zIndex: 20,
        }}
      >
        {isActive ? 'Shadow On' : 'Enable Shadow'}
      </button>

      <VisionPanel status={status} result={error ? `Error: ${error.message}` : result} />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Cave />
    </QueryClientProvider>
  )
}
