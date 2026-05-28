import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'

const TARGET_MIN = 0.15
const TARGET_MAX = 0.75

const VolumeBar = forwardRef(function VolumeBar({ active }, ref) {
  const [level, setLevel] = useState(0)
  const inTargetRef = useRef(0)
  const totalRef = useRef(0)
  const animRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const contextRef = useRef(null)

  useImperativeHandle(ref, () => ({
    getScore: () => {
      if (totalRef.current === 0) return 0
      return Math.round((inTargetRef.current / totalRef.current) * 100)
    },
    reset: () => {
      inTargetRef.current = 0
      totalRef.current = 0
      setLevel(0)
    },
  }))

  useEffect(() => {
    if (!active) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (contextRef.current) contextRef.current.close()
      return
    }

    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const context = new AudioContext()
        contextRef.current = context
        const source = context.createMediaStreamSource(stream)
        const analyser = context.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser

        const data = new Uint8Array(analyser.frequencyBinCount)

        function tick() {
          if (cancelled) return
          analyser.getByteFrequencyData(data)
          const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length) / 128
          const normalized = Math.min(1, rms)
          setLevel(normalized)
          totalRef.current += 1
          if (normalized >= TARGET_MIN && normalized <= TARGET_MAX) {
            inTargetRef.current += 1
          }
          animRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch {
        // mic permission denied
      }
    }

    start()
    return () => {
      cancelled = true
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (contextRef.current) contextRef.current.close()
    }
  }, [active])

  const inTarget = level >= TARGET_MIN && level <= TARGET_MAX
  const tooLoud = level > TARGET_MAX

  const barColor = inTarget ? '#2D6A4F' : tooLoud ? '#B91C1C' : '#BC6C25'
  const targetStart = `${TARGET_MIN * 100}%`
  const targetWidth = `${(TARGET_MAX - TARGET_MIN) * 100}%`

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>Volume</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: barColor }}>
          {inTarget ? 'Good — stay here' : tooLoud ? 'Too loud' : 'Speak louder'}
        </span>
      </div>

      <div style={{ position: 'relative', height: 28, borderRadius: 4, background: '#E2E2DD', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          left: targetStart,
          width: targetWidth,
          height: '100%',
          background: 'rgba(45, 106, 79, 0.15)',
          borderLeft: '2px solid #2D6A4F',
          borderRight: '2px solid #2D6A4F',
        }} />
        <div style={{
          position: 'absolute',
          left: 0,
          width: `${level * 100}%`,
          height: '100%',
          background: barColor,
          borderRadius: 4,
          transition: 'width 0.05s, background 0.2s',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 12, color: '#6B7280' }}>Quiet</span>
        <span style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600 }}>Target zone</span>
        <span style={{ fontSize: 12, color: '#6B7280' }}>Loud</span>
      </div>
    </div>
  )
})

export default VolumeBar
