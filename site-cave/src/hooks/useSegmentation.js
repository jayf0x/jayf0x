import { useRef, useEffect } from 'react'
import { devLog } from '../utils';

const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.crossOrigin = 'anonymous'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

export function useSegmentation(videoRef, isActive) {
  // Persistent offscreen canvas — always the same element, just may be stale when inactive
  const maskCanvasRef = useRef(null)
  if (!maskCanvasRef.current) maskCanvasRef.current = document.createElement('canvas')

  const activeRef = useRef(false)

  useEffect(() => {
    if (!isActive) {
      activeRef.current = false
      // Clear mask when camera off
      const c = maskCanvasRef.current
      c.getContext('2d').clearRect(0, 0, c.width, c.height)
      return
    }

    activeRef.current = true
    let rafId

    loadScript(`${CDN}/selfie_segmentation.js`).then(() => {
      if (!activeRef.current) return

      const seg = new window.SelfieSegmentation({
        locateFile: (file) => {
          devLog('Load segment file:', file)
          return `${CDN}/${file}`
        },
      })
      seg.setOptions({ modelSelection: 1 })

      seg.onResults((results) => {
        const canvas = maskCanvasRef.current
        const video = videoRef.current
        if (!canvas || !video || !results.segmentationMask) return

        const w = video.videoWidth || 640
        const h = video.videoHeight || 480
        if (canvas.width !== w) canvas.width = w
        if (canvas.height !== h) canvas.height = h

        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, w, h)

        // Draw segmentation mask: white=person, dark=background
        // source-in fills only the person area with our shadow colour
        ctx.drawImage(results.segmentationMask, 0, 0, w, h)
        ctx.globalCompositeOperation = 'source-in'
        ctx.fillStyle = 'rgba(12, 6, 20, 0.82)'
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'source-over'
      })

      const loop = async () => {
        if (!activeRef.current) return
        if (videoRef.current?.readyState >= 2) {
          await seg.send({ image: videoRef.current })
        }
        rafId = requestAnimationFrame(loop)
      }
      rafId = requestAnimationFrame(loop)
    })

    return () => {
      activeRef.current = false
      cancelAnimationFrame(rafId)
    }
  }, [isActive, videoRef])

  return maskCanvasRef
}
