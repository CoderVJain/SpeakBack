import { useState, useCallback } from 'react'
import Camera from '../Camera'
import AudioRecorder from '../AudioRecorder'
import { transcribeAudio, scorePhoneme } from '../../api/sessions'
import { useAuth } from '../../store/authStore'

export default function ArticulationExercise({ exercise, onComplete }) {
  const { token } = useAuth()
  const items = exercise.target_items || (exercise.target_text ? [exercise.target_text] : [])
  const [itemIndex, setItemIndex] = useState(0)
  const [itemResults, setItemResults] = useState([])
  const [phase, setPhase] = useState('ready')
  const [present, setPresent] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [result, setResult] = useState(null)

  const currentWord = items[itemIndex]
  const total = items.length

  const handlePresence = useCallback((p) => setPresent(p), [])

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

  async function handleRecordingComplete(blob) {
    setPhase('processing')
    try {
      const phonemeRes = await scorePhoneme(token, blob, currentWord)
      setResult({ score: phonemeRes.phoneme_score, transcript: phonemeRes.transcript })
      setPhase('result')
    } catch {
      setPhase('ready')
    }
  }

  function handleNext() {
    const itemResult = {
      block_type: exercise.block_type,
      exercise_name: exercise.exercise_name,
      expected_text: currentWord,
      transcript: result?.transcript || '',
      presence_detected: present,
      metric_name: 'Pronunciation Score',
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
              Word {itemIndex + 1} of {total}
            </span>
          </div>
          <div style={{ height: 4, background: '#E2E2DD', borderRadius: 2 }}>
            <div style={{ height: '100%', background: '#1B4965', borderRadius: 2, width: `${(itemIndex / total) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 8 }}>
          Say this word
        </p>
        <p style={{ fontSize: 64, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-1px' }}>
          {currentWord}
        </p>
        <p style={{ fontSize: 18, color: '#6B7280', margin: 0 }}>
          Speak clearly and precisely — repeat for 10 seconds
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
          <p style={{ fontSize: 18, color: '#6B7280', marginTop: 8 }}>Get ready…</p>
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
          <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>Analyzing pronunciation…</p>
        </div>
      )}

      {phase === 'result' && result && (
        <ArticulationResult result={result} onNext={handleNext} isLast={itemIndex + 1 >= total} />
      )}
    </div>
  )
}

function ArticulationResult({ result, onNext, isLast }) {
  const { score } = result
  const color = score >= 75 ? '#2D6A4F' : score >= 50 ? '#BC6C25' : '#B91C1C'
  const message = score >= 75
    ? 'Clear pronunciation — well done.'
    : score >= 50
    ? 'Getting there — keep practicing.'
    : 'Focus on slow, clear sounds.'

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 8 }}>
        Pronunciation Score
      </p>
      <div style={{ fontSize: 80, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>
        {Math.round(score)}
        <span style={{ fontSize: 28, fontWeight: 500, color: '#6B7280', marginLeft: 4 }}>/100</span>
      </div>
      <p style={{ fontSize: 18, color: '#1A1A1A', marginBottom: 24 }}>{message}</p>
      <button
        onClick={onNext}
        style={{ width: '100%', height: 56, background: '#1B4965', color: '#ffffff', fontSize: 17, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        {isLast ? 'Next Exercise' : 'Next Word'}
      </button>
    </div>
  )
}
