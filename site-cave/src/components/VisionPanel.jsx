import { useEffect, useRef, useState } from 'react'

export default function VisionPanel({ status, result }) {
  const [displayed, setDisplayed] = useState('')
  const [typing, setTyping] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!result) return
    clearInterval(timerRef.current)
    setTyping(true)
    let i = 0
    setDisplayed('')
    timerRef.current = setInterval(() => {
      i++
      setDisplayed(result.slice(0, i))
      if (i >= result.length) {
        clearInterval(timerRef.current)
        setTyping(false)
      }
    }, 18)
    return () => clearInterval(timerRef.current)
  }, [result])

  const statusLabel = status === 'analyzing' ? 'Consulting the oracle…' : null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px 28px 24px',
        background: 'rgba(8, 6, 13, 0.72)',
        backdropFilter: 'blur(8px)',
        color: '#e8e0f5',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 8 }}>
        The cave perceives:
      </div>
      {statusLabel && (
        <div style={{ fontSize: 13, opacity: 0.6, fontStyle: 'italic', marginBottom: 6 }}>
          {statusLabel}
        </div>
      )}
      {displayed && (
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            maxWidth: 720,
            opacity: typing ? 0.9 : 1,
            transition: 'opacity 0.3s',
          }}
        >
          {displayed}
          {typing && <span style={{ opacity: 0.5 }}>▍</span>}
        </div>
      )}
    </div>
  )
}
