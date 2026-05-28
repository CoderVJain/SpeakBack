import { useEffect, useRef, useState } from 'react'
import { checkPresence } from '../api/sessions'
import { useAuth } from '../store/authStore'

export default function Camera({ onPresenceChange }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [present, setPresent] = useState(false)
  const [error, setError] = useState('')
  const { token } = useAuth()

  useEffect(() => {
    let stream = null
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        setError('Camera access denied. Please allow camera permission and reload.')
      }
    }
    startCamera()
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = 320
      canvas.height = 240
      ctx.drawImage(videoRef.current, 0, 0, 320, 240)
      const b64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
      try {
        const result = await checkPresence(token, b64)
        setPresent(result.present)
        onPresenceChange(result.present)
      } catch {
        // ignore transient errors
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [token, onPresenceChange])

  if (error) {
    return (
      <div style={{
        width: '100%',
        padding: '32px 24px',
        background: '#fef2f2',
        border: '1px solid #E2E2DD',
        borderRadius: 8,
        textAlign: 'center',
        color: '#B91C1C',
        fontSize: 16,
        fontWeight: 500,
      }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: `4px solid ${present ? '#2D6A4F' : '#B91C1C'}`,
        transition: 'border-color 0.3s',
      }}>
        <video ref={videoRef} autoPlay muted style={{ width: '100%', display: 'block' }} />
      </div>

      <div style={{
        marginTop: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: present ? '#2D6A4F' : '#B91C1C',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 15,
          fontWeight: 500,
          color: present ? '#2D6A4F' : '#B91C1C',
        }}>
          {present ? 'Ready — face detected' : 'Move into view'}
        </span>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
