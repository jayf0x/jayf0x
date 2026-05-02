import { useEffect, useRef } from 'react'
import { ck, unck, conwayStep, type CK } from '../../lib/conway/conway'

const CELL = 22
const BUFFER = 2
const STEP_MS = 140

// Blue palette by neighbor count (0 = dim navy, 3 = brightest sky-blue, 8 = deep navy)
const BLUES = [
  'rgb(15,25,80)',    // 0 lonely
  'rgb(25,50,130)',   // 1
  'rgb(45,95,185)',   // 2 stable
  'rgb(85,175,255)',  // 3 thriving — peak brightness
  'rgb(65,150,235)',  // 4
  'rgb(48,115,200)',  // 5
  'rgb(34,80,165)',   // 6
  'rgb(22,58,140)',   // 7
  'rgb(14,38,110)',   // 8 max neighbors
] as const

const DEATH_COLOR = 'rgba(40,85,160,0.25)'

export const Resume = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d', { alpha: false })!

    let alive = new Set<CK>()
    let neighborCounts = new Map<CK, number>()
    let justDied = new Set<CK>()   // cells that died last step — one-frame ghost
    let paused = false
    let hovered: CK | null = null
    let lastStep = 0
    let raf = 0

    // Cached on resize — avoid recomputing every frame
    let cols = 0, rows = 0
    let minX = 0, maxX = 0, minY = 0, maxY = 0

    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cols = Math.ceil(canvas.width / CELL)
      rows = Math.ceil(canvas.height / CELL)
      minX = -BUFFER; maxX = cols + BUFFER
      minY = -BUFFER; maxY = rows + BUFFER
    }
    onResize()
    const ro = new ResizeObserver(onResize)
    ro.observe(document.body)

    const seed = () => {
      for (let i = 0; i < Math.floor(cols * rows * 0.12); i++) {
        alive.add(ck(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)))
      }
    }
    seed()

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); paused = !paused }
    }
    window.addEventListener('keydown', onKey)

    // offsetX/Y are relative to the canvas element — no getBoundingClientRect needed
    const onMove = (e: MouseEvent) => {
      hovered = ck(Math.floor(e.offsetX / CELL), Math.floor(e.offsetY / CELL))
    }
    const onLeave = () => { hovered = null }
    const onDown = (e: MouseEvent) => {
      const cx = canvas.width / 2, cy = canvas.height / 2
      const dx = e.offsetX - cx, dy = e.offsetY - cy
      if (dx * dx + dy * dy < 60 * 60) return
      const k = ck(Math.floor(e.offsetX / CELL), Math.floor(e.offsetY / CELL))
      alive.add(k)
      justDied.delete(k)
    }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('mousedown', onDown)

    // Reusable bucket arrays — cleared by setting .length = 0 (no GC)
    const buckets: number[][] = Array.from({ length: 9 }, () => [])

    const loop = (now: number) => {
      if (!paused && now - lastStep > STEP_MS) {
        lastStep = now

        const { next, counts } = conwayStep(alive, minX, maxX, minY, maxY)

        justDied = new Set<CK>()
        for (const k of alive) {
          if (!next.has(k)) justDied.add(k)
        }

        alive = next
        neighborCounts = counts
      }

      // ── render ────────────────────────────────────────────────────────────

      // alpha:false context — fillRect is the fast clear
      ctx.fillStyle = '#060608'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // one-frame ghost for cells that just died
      if (justDied.size > 0) {
        ctx.fillStyle = DEATH_COLOR
        for (const k of justDied) {
          const [x, y] = unck(k)
          if (x >= 0 && x < cols && y >= 0 && y < rows)
            ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2)
        }
      }

      // bucket alive cells by neighbor count, then batch-draw each color
      for (const k of alive) {
        const [x, y] = unck(k)
        if (x < 0 || x >= cols || y < 0 || y >= rows) continue
        const nc = neighborCounts.get(k) ?? 0
        const b = buckets[nc < 9 ? nc : 8]
        b.push(x, y)
      }

      for (let ci = 0; ci < 9; ci++) {
        const b = buckets[ci]
        if (b.length === 0) continue
        ctx.fillStyle = BLUES[ci]
        for (let i = 0; i < b.length; i += 2)
          ctx.fillRect(b[i] * CELL + 1, b[i + 1] * CELL + 1, CELL - 2, CELL - 2)
        b.length = 0
      }

      // hover
      if (hovered) {
        const [x, y] = unck(hovered)
        if (x >= 0 && x < cols && y >= 0 && y < rows && !alive.has(hovered)) {
          ctx.fillStyle = 'rgba(200,220,255,0.12)'
          ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2)
        }
      }

      if (paused) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        ctx.font = '12px monospace'
        ctx.fillText('PAUSED  ·  space to resume', 16, canvas.height - 16)
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('mousedown', onDown)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#060608' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12, pointerEvents: 'none',
      }}>
        <span className="resume-label">The red button</span>
        <div className="ad-float" style={{ pointerEvents: 'auto' }}>
          <a
            href="https://raw.githubusercontent.com/jayf0x/jayf0x/main/assets/Jonatan-Verstraete-resume-2026.pdf"
            download
            style={{ textDecoration: 'none' }}
          >
            <button className="red-button" aria-label="Download resume" />
          </a>
        </div>
      </div>
    </div>
  )
}
