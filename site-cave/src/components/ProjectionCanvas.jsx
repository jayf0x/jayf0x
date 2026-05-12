import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

const TITLE = 'phantom-lens'
const DESC =
  'A privacy-first camera tool that redacts faces in real time before footage leaves the device.'

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? current + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// maskRef: offscreen canvas with dark silhouette on transparent bg (from useSegmentation)
const ProjectionCanvas = forwardRef(function ProjectionCanvas({ maskRef, isActive }, ref) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  const captureFrame = useCallback(() => {
    return canvasRef.current?.toDataURL('image/jpeg', 0.8) ?? null
  }, [])

  useImperativeHandle(ref, () => ({ captureFrame }), [captureFrame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.width
      const h = canvas.height

      ctx.fillStyle = '#f5f0e8'
      ctx.fillRect(0, 0, w, h)

      // Vignette — simulate projector light
      const vignette = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
      vignette.addColorStop(0, 'rgba(255,255,255,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.18)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)

      // Projected text
      ctx.save()
      ctx.filter = 'blur(0.6px)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const titleSize = Math.max(36, Math.min(72, w * 0.07))
      ctx.font = `900 ${titleSize}px system-ui, sans-serif`
      ctx.fillStyle = '#0a0a0a'
      ctx.fillText(TITLE, w / 2, h / 2 - titleSize * 0.9)

      const descSize = Math.max(14, Math.min(22, w * 0.022))
      ctx.font = `400 ${descSize}px system-ui, sans-serif`
      ctx.fillStyle = '#1a1a1a'
      const maxW = Math.min(w * 0.65, 640)
      const lines = wrapText(ctx, DESC, maxW)
      lines.forEach((line, i) => {
        ctx.fillText(line, w / 2, h / 2 + titleSize * 0.4 + i * (descSize * 1.5))
      })
      ctx.restore()

      // Shadow layer — segmentation silhouette only (no raw camera)
      if (isActive && maskRef?.current) {
        const mask = maskRef.current
        if (mask.width > 0 && mask.height > 0) {
          const scale = Math.min(w / mask.width, h / mask.height)
          const dw = mask.width * scale
          const dh = mask.height * scale
          const dx = (w - dw) / 2
          const dy = (h - dh) / 2

          ctx.save()
          ctx.translate(dx + dw, dy)
          ctx.scale(-1, 1) // mirror
          ctx.drawImage(mask, 0, 0, dw, dh)
          ctx.restore()
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [maskRef, isActive])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100vw', height: '100vh', position: 'fixed', inset: 0 }}
    />
  )
})

export default ProjectionCanvas
