import { useState, useRef, useEffect } from 'react'

export default function AudioRecorder({ onRecordingComplete, onRecordingStart, disabled, autoStart, duration, hideStop }) {
  const [recording, setRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const sampleIntervalRef = useRef(null)
  const countdownRef = useRef(null)
  const amplitudeSamplesRef = useRef([])

  useEffect(() => {
    if (autoStart) startRecording()
    return () => {
      clearInterval(sampleIntervalRef.current)
      clearInterval(countdownRef.current)
    }
  }, [])

  async function startRecording() {
    chunksRef.current = []
    amplitudeSamplesRef.current = []

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    sampleIntervalRef.current = setInterval(() => {
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteTimeDomainData(data)
      const rms = Math.sqrt(data.reduce((sum, v) => sum + (v - 128) ** 2, 0) / data.length) / 128
      amplitudeSamplesRef.current.push(rms)
    }, 100)

    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = () => {
      clearInterval(sampleIntervalRef.current)
      audioContext.close()
      const samples = amplitudeSamplesRef.current
      const avgAmplitude = samples.length > 0
        ? samples.reduce((a, b) => a + b, 0) / samples.length
        : 0
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      onRecordingComplete(blob, avgAmplitude)
      stream.getTracks().forEach(t => t.stop())
    }

    mediaRecorder.start()
    if (onRecordingStart) onRecordingStart()
    setRecording(true)

    if (duration) {
      setTimeLeft(duration)
      let remaining = duration
      countdownRef.current = setInterval(() => {
        remaining -= 1
        setTimeLeft(remaining)
        if (remaining <= 0) {
          clearInterval(countdownRef.current)
          doStop(mediaRecorder)
        }
      }, 1000)
    }
  }

  function doStop(mr) {
    if (mr && mr.state !== 'inactive') {
      mr.stop()
      setRecording(false)
      setTimeLeft(null)
    }
  }

  function stopRecording() {
    clearInterval(countdownRef.current)
    doStop(mediaRecorderRef.current)
  }

  if (recording) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {duration && timeLeft !== null && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 64, fontWeight: 900, color: '#B91C1C', margin: 0, lineHeight: 1 }}>{timeLeft}</p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>seconds left — keep going</p>
          </div>
        )}
        {!hideStop && (
          <button
            onClick={stopRecording}
            style={{
              width: '100%', height: 56, background: '#B91C1C', color: '#ffffff',
              fontSize: 17, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <span style={{ width: 12, height: 12, background: '#ffffff', borderRadius: 2, flexShrink: 0 }} />
            Stop Recording
          </button>
        )}
        <p style={{ fontSize: 15, color: '#B91C1C', fontWeight: 500 }}>
          {hideStop ? 'Recording — repeat the sound clearly' : 'Recording in progress — speak clearly'}
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      style={{
        width: '100%', height: 56,
        background: disabled ? '#E2E2DD' : '#1B4965',
        color: disabled ? '#6B7280' : '#ffffff',
        fontSize: 17, fontWeight: 600, border: 'none', borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        width: 12, height: 12,
        background: disabled ? '#6B7280' : '#ffffff',
        borderRadius: '50%', flexShrink: 0,
      }} />
      Start Recording
    </button>
  )
}
