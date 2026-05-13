import { useRef, useState, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isActive, setIsActive] = useState(false)

  const toggle = useCallback(async () => {
    if (isActive) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      setIsActive(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setIsActive(true)
      } catch (err) {
        console.error('Camera error:', err)
      }
    }
  }, [isActive])


  useEffect(()=>{
    const video = document.createElement('video')
    video.id = "VID_STREAM"
    video.playsInline = true
    video.muted = true
    video.style.display = 'none'

    videoRef.current = video

    return ()=>{
      video.remove()
    }
  },[])

  return { videoRef, isActive, toggle }
}
