import { useState, useRef, useCallback } from 'react'
import Camera from '../Camera'
import VolumeBar from '../VolumeBar'

export default function LoudnessExercise({ exercise, onComplete }) {
  const [phase, setPhase] = useState('ready')
  const [present, setPresent] = useState(false)
  const [score, setScore] = useState(null)
  const volumeBarRef = useRef(null)
  const timerRef = useRef(null)

  const handlePresence = useCallback((p) => setPresent(p), [])

  function startExercise() {
    if (volumeBarRef.current) volumeBarRef.current.reset()
    setPhase('active')
    timerRef.current = setTimeout(() => {
      const s = volumeBarRef.current ? volumeBarRef.current.getScore() : 0
      setScore(s)
      setPhase('result')
    }, exercise.duration_seconds * 1000)
  }

  function handleNext() {
    onComplete({
      block_type: exercise.block_type,
      exercise_name: exercise.exercise_name,
      expected_text: exercise.target_text,
      transcript: null,
      presence_detected: present,
      metric_name: exercise.metric_name,
      metric_value: score ?? 0,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Camera onPresenceChange={handlePresence} />

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1.1 }}>
          "{exercise.target_text}"
        </p>
        <p style={{ fontSize: 18, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
          {exercise.instruction}
        </p>
      </div>

      <VolumeBar ref={volumeBarRef} active={phase === 'active'} />

      {phase === 'ready' && (
        <button
          onClick={startExercise}
          disabled={!present}
          style={{
            width: '100%', height: 56, background: present ? '#1B4965' : '#E2E2DD',
            color: present ? '#ffffff' : '#6B7280', fontSize: 17, fontWeight: 700,
            border: 'none', borderRadius: 6, cursor: present ? 'pointer' : 'not-allowed',
          }}
        >
          {present ? 'Start Speaking' : 'Face not detected — move into view'}
        </button>
      )}

      {phase === 'active' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, color: '#1B4965', fontWeight: 700, margin: 0 }}>
            Speak now — stay in the green zone
          </p>
        </div>
      )}

      {phase === 'result' && (
        <LoudnessResult score={score} onNext={handleNext} />
      )}
    </div>
  )
}

function LoudnessResult({ score, onNext }) {
  const color = score >= 75 ? '#2D6A4F' : score >= 50 ? '#BC6C25' : '#B91C1C'
  const message = score >= 75 ? 'Excellent volume control.' : score >= 50 ? 'Good effort — keep your voice steady.' : 'Try to project your voice more consistently.'

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 8 }}>
        Time in Target Volume Zone
      </p>
      <div style={{ fontSize: 80, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>
        {score}
        <span style={{ fontSize: 28, fontWeight: 500, color: '#6B7280', marginLeft: 4 }}>%</span>
      </div>
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
