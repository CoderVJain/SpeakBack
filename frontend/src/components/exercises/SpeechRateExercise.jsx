import { useState, useRef, useCallback } from 'react'
import Camera from '../Camera'
import AudioRecorder from '../AudioRecorder'
import { transcribeAudio, scoreSpeechRate } from '../../api/sessions'
import { useAuth } from '../../store/authStore'

export default function SpeechRateExercise({ exercise, onComplete }) {
  const { token } = useAuth()
  const items = exercise.target_items || (exercise.target_text ? [exercise.target_text] : [])
  const [itemIndex, setItemIndex] = useState(0)
  const [itemResults, setItemResults] = useState([])
  const [phase, setPhase] = useState('ready')
  const [present, setPresent] = useState(false)
  const [result, setResult] = useState(null)
  const startTimeRef = useRef(null)

  const currentPhrase = items[itemIndex]
  const total = items.length

  const handlePresence = useCallback((p) => setPresent(p), [])

  function handleRecordingStart() {
    startTimeRef.current = Date.now()
  }

  async function handleRecordingComplete(blob) {
    const duration = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : exercise.duration_seconds
    setPhase('processing')
    try {
      const { transcript } = await transcribeAudio(token, blob)
      const rateResult = await scoreSpeechRate(token, transcript, duration)
      setResult({ ...rateResult, transcript })
      setPhase('result')
    } catch {
      setPhase('ready')
    }
  }

  function handleNext() {
    const itemResult = {
      block_type: exercise.block_type,
      exercise_name: exercise.exercise_name,
      expected_text: currentPhrase,
      transcript: result?.transcript || '',
      presence_detected: present,
      metric_name: exercise.metric_name,
      metric_value: result?.score ?? 0,
    }

    const newResults = [...itemResults, itemResult]

    if (itemIndex + 1 >= total) {
      onComplete(newResults)
    } else {
      setItemResults(newResults)
      setItemIndex(itemIndex + 1)
      setPhase('ready')
      setResult(null)
      startTimeRef.current = null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Camera onPresenceChange={handlePresence} />

      {total > 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Phrase {itemIndex + 1} of {total}
            </span>
          </div>
          <div style={{ height: 4, background: '#E2E2DD', borderRadius: 2 }}>
            <div style={{ height: '100%', background: '#1B4965', borderRadius: 2, width: `${(itemIndex / total) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 8 }}>
          Read slowly and clearly
        </p>
        <p style={{ fontSize: 40, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.2 }}>
          {currentPhrase}
        </p>
        <p style={{ fontSize: 17, color: '#6B7280', margin: 0 }}>
          Target: 80–120 words per minute
        </p>
      </div>

      {phase === 'ready' && (
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onRecordingStart={handleRecordingStart}
          disabled={!present}
        />
      )}

      {phase === 'processing' && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E2E2DD', borderTopColor: '#1B4965', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>Measuring speech rate…</p>
        </div>
      )}

      {phase === 'result' && result && (
        <SpeechRateResult result={result} onNext={handleNext} isLast={itemIndex + 1 >= total} />
      )}
    </div>
  )
}

function SpeechRateResult({ result, onNext, isLast }) {
  const { wpm, in_range, score } = result
  const color = score >= 80 ? '#2D6A4F' : score >= 50 ? '#BC6C25' : '#B91C1C'
  const message = in_range
    ? 'Perfect pace — right in the target range.'
    : wpm < 80
    ? 'A little slow — aim to speak more smoothly.'
    : 'Too fast — slow down and articulate each word.'

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 8 }}>
        Speech Rate
      </p>
      <div style={{ fontSize: 80, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>
        {wpm}
        <span style={{ fontSize: 22, fontWeight: 500, color: '#6B7280', marginLeft: 6 }}>WPM</span>
      </div>
      <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 8 }}>Target: 80–120 WPM</p>
      <p style={{ fontSize: 18, color: '#1A1A1A', marginBottom: 24 }}>{message}</p>
      <button
        onClick={onNext}
        style={{ width: '100%', height: 56, background: '#1B4965', color: '#ffffff', fontSize: 17, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        {isLast ? 'Next Exercise' : 'Next Phrase'}
      </button>
    </div>
  )
}
