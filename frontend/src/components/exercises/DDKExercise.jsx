import { useState, useCallback } from 'react'
import Camera from '../Camera'
import AudioRecorder from '../AudioRecorder'
import { transcribeAudio, scoreDDK } from '../../api/sessions'
import { useAuth } from '../../store/authStore'

export default function DDKExercise({ exercise, onComplete }) {
  const { token } = useAuth()
  const [phase, setPhase] = useState('ready')
  const [present, setPresent] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [result, setResult] = useState(null)

  const handlePresence = useCallback((p) => setPresent(p), [])

  async function handleRecordingComplete(blob) {
    setPhase('processing')
    try {
      const { transcript } = await transcribeAudio(token, blob)
      const { count } = await scoreDDK(token, transcript, exercise.target_text)
      setResult({ count, transcript })
      setPhase('result')
    } catch {
      setPhase('ready')
    }
  }

  function startCountdown() {
    setPhase('countdown')
    let remaining = 5
    setCountdown(remaining)
    const timer = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(timer)
        setPhase('recording')
      }
    }, 1000)
  }

  function handleNext() {
    const count = result?.count ?? 0
    onComplete({
      block_type: exercise.block_type,
      exercise_name: exercise.exercise_name,
      expected_text: exercise.target_text,
      transcript: result?.transcript || '',
      presence_detected: present,
      metric_name: exercise.metric_name,
      metric_value: Math.min(100, Math.round((count / 20) * 100)),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Camera onPresenceChange={handlePresence} />

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-1px' }}>
          "{exercise.target_text}"
        </p>
        <p style={{ fontSize: 18, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
          {exercise.instruction}
        </p>
      </div>

      {phase === 'ready' && (
        <button
          onClick={startCountdown}
          disabled={!present}
          style={{
            width: '100%', height: 56,
            background: present ? '#1B4965' : '#E2E2DD',
            color: present ? '#ffffff' : '#6B7280',
            fontSize: 17, fontWeight: 700, border: 'none', borderRadius: 6,
            cursor: present ? 'pointer' : 'not-allowed',
          }}
        >
          {present ? 'Get Ready' : 'Face not detected — move into view'}
        </button>
      )}

      {phase === 'countdown' && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <p style={{ fontSize: 72, fontWeight: 900, color: '#1B4965', margin: 0, lineHeight: 1 }}>
            {countdown}
          </p>
          <p style={{ fontSize: 18, color: '#6B7280', marginTop: 8 }}>Starting in…</p>
        </div>
      )}

      {phase === 'recording' && (
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          disabled={false}
          autoStart
          duration={10}
          hideStop
        />
      )}

      {phase === 'processing' && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E2E2DD', borderTopColor: '#1B4965', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>Counting repetitions…</p>
        </div>
      )}

      {phase === 'result' && result && (
        <DDKResult count={result.count} onNext={handleNext} />
      )}
    </div>
  )
}

function DDKResult({ count, onNext }) {
  const healthy = 20
  const pct = Math.round((count / healthy) * 100)
  const color = pct >= 75 ? '#2D6A4F' : pct >= 50 ? '#BC6C25' : '#B91C1C'
  const message = count >= 16 ? 'Strong coordination.' : count >= 10 ? 'Good — keep practicing.' : 'Focus on clear, fast repetitions.'

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 8 }}>
        Repetitions in 10 seconds
      </p>
      <div style={{ fontSize: 80, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>
        {count}
      </div>
      <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 4 }}>Healthy range: 20–25 reps</p>
      <p style={{ fontSize: 18, color: '#1A1A1A', marginBottom: 24 }}>{message}</p>
      <button
        onClick={onNext}
        style={{ width: '100%', height: 56, background: '#1B4965', color: '#ffffff', fontSize: 17, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        Next Exercise
      </button>
    </div>
  )
}
