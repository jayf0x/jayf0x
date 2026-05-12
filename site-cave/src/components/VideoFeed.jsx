export default function VideoFeed({ videoRef }) {
  return (
    <video
      ref={videoRef}
      playsInline
      muted
      style={{ display: 'none' }}
    />
  )
}
