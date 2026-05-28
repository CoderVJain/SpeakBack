import { useState, useCallback } from 'react'
import Camera from '../Camera'
import AudioRecorder from '../AudioRecorder'
import { transcribeAudio } from '../../api/sessions'
import { useAuth } from '../../store/authStore'

function stripPunc(str) {
  return str.replace(/[^\w\s]/g, '').trim()
}

function calcWER(transcript, expected) {
  const t = stripPunc(transcript).toLowerCase().split(/\s+/).filter(Boolean)
  const e = stripPunc(expected).toLowerCase().split(/\s+/).filter(Boolean)
  if (!e.length) return 0
  let correct = 0
  const eSet = [...e]
  for (const w of t) {
    const idx = eSet.indexOf(w)
    if (idx !== -1) { correct++; eSet.splice(idx, 1) }
  }
  return Math.round((correct / e.length) * 100)
}

export default function PhraseExercise({ exercise, onComplete }) {
  const { token } = useAuth()
  const items = exercise.target_items || (exercise.target_text ? [exercise.target_text] : [])
  const [itemIndex, setItemIndex] = useState(0)
  const [itemResults, setItemResults] = useState([])
  const [phase, setPhase] = useState('ready')
  const [present, setPresent] = useState(false)
  const [result, setResult] = useState(null)

  const currentPhrase = items[itemIndex]
  const total = items.length

  const handlePresence = useCallback((p) => setPresent(p), [])

  async function handleRecordingComplete(blob, amplitude = 0) {
    setPhase('processing')
    try {
      const { transcript } = await transcribeAudio(token, blob)
      const wordScore = calcWER(transcript, currentPhrase)
      const ampScore = Math.min(100, Math.round((amplitude / 0.1) * 100))
      const score = Math.round(wordScore * 0.7 + ampScore * 0.3)
      setResult({ score, transcript })
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
          {exercise.exercise_name}
        </p>
        <p style={{ fontSize: 48, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.2 }}>
          "{currentPhrase}"
        </p>
        <p style={{ fontSize: 17, color: '#6B7280', margin: 0 }}>
          {exercise.instruction}
        </p>
      </div>

      {phase === 'ready' && (
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          disabled={!present}
        />
      )}

      {phase === 'processing' && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E2E2DD', borderTopColor: '#1B4965', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>Checking your words…</p>
        </div>
      )}

      {phase === 'result' && result && (
        <PhraseResult result={result} onNext={handleNext} isLast={itemIndex + 1 >= total} />
      )}
    </div>
  )
}

function PhraseResult({ result, onNext, isLast }) {
  const { score, transcript } = result
  const color = score >= 80 ? '#2D6A4F' : score >= 55 ? '#BC6C25' : '#B91C1C'
  const message = score >= 80 ? 'Clear and intelligible.' : score >= 55 ? 'Most words came through — keep practicing.' : 'Try again with slower, deliberate speech.'

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 8 }}>
        Words Understood
      </p>
      <div style={{ fontSize: 80, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>
        {score}
        <span style={{ fontSize: 28, fontWeight: 500, color: '#6B7280', marginLeft: 4 }}>%</span>
      </div>
      {transcript && (
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
          Heard: "{transcript}"
        </p>
      )}
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
