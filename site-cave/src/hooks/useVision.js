import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

const PROMPT =
  'You are a philosopher in Plato\'s cave, observing shadows on a cave wall. ' +
  'A project called "phantom-lens" is projected as light: ' +
  '"A privacy-first camera tool that redacts faces in real time before footage leaves the device." ' +
  'Describe what deeper truths or ideas you perceive in the shadows before you — ' +
  'not the literal shapes. Be poetic and interpretive. 2–3 sentences.'

export function useVision(captureFrame) {
  const captureRef = useRef(captureFrame)
  captureRef.current = captureFrame

  const mutation = useMutation({
    mutationFn: async (dataUrl) => {
      const { data } = await axios.post('http://127.0.0.1:8042/analyze', {
        image: dataUrl,
        prompt: PROMPT,
      })
      return data.result
    },
  })

  const mutateRef = useRef(mutation.mutate)
  mutateRef.current = mutation.mutate

  useEffect(() => {
    const id = setInterval(() => {
      const dataUrl = captureRef.current?.()
      if (dataUrl) mutateRef.current(dataUrl)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return {
    status: mutation.isPending ? 'analyzing' : 'ready',
    result: mutation.data ?? '',
    error: mutation.error,
  }
}
