import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { getGuidedSession, submitSession } from '../../api/sessions'
import OralMotorExercise from '../../components/exercises/OralMotorExercise'
import DDKExercise from '../../components/exercises/DDKExercise'
import LoudnessExercise from '../../components/exercises/LoudnessExercise'
import ArticulationExercise from '../../components/exercises/ArticulationExercise'
import SpeechRateExercise from '../../components/exercises/SpeechRateExercise'
import PhraseExercise from '../../components/exercises/PhraseExercise'
import ReadAloudExercise from '../../components/exercises/ReadAloudExercise'

const BLOCK_LABELS = {
  oral_motor: 'Warm-Up',
  coordination_ddk: 'Coordination',
  loudness: 'Loudness',
  articulation: 'Articulation',
  speech_rate: 'Speech Rate',
  functional_phrases: 'Phrases',
  read_aloud: 'Read Aloud',
}

function ExerciseComponent({ exercise, onComplete }) {
  switch (exercise.block_type) {
    case 'oral_motor': return <OralMotorExercise exercise={exercise} onComplete={onComplete} />
    case 'coordination_ddk': return <DDKExercise exercise={exercise} onComplete={onComplete} />
    case 'loudness': return <LoudnessExercise exercise={exercise} onComplete={onComplete} />
    case 'articulation': return <ArticulationExercise exercise={exercise} onComplete={onComplete} />
    case 'speech_rate': return <SpeechRateExercise exercise={exercise} onComplete={onComplete} />
    case 'functional_phrases': return <PhraseExercise exercise={exercise} onComplete={onComplete} />
    case 'read_aloud': return <ReadAloudExercise exercise={exercise} onComplete={onComplete} />
    default: return null
  }
}

export default function Session() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState([])
  const [phase, setPhase] = useState('loading')
  const [showExitModal, setShowExitModal] = useState(false)

  useEffect(() => {
    getGuidedSession(token)
      .then(data => {
        setExercises(data.exercises)
        setPhase('exercise')
      })
      .catch(err => {
        if (err?.response?.data?.detail === 'session_already_done_today') {
          setPhase('done_today')
        } else {
          setPhase('error')
        }
      })
  }, [token])

  async function handleExerciseComplete(result) {
    const items = Array.isArray(result) ? result : [result]
    const newResults = [...results, ...items]
    setResults(newResults)

    if (currentIndex + 1 >= exercises.length) {
      setPhase('submitting')
      const withFeedback = await Promise.all(newResults.map(item =>
        submitSession(token, item)
          .then(res => ({ ...item, feedback: res.feedback }))
          .catch(() => item)
      ))
      setResults(withFeedback)
      setPhase('complete')
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function handleExitConfirm() {
    navigate('/patient/dashboard')
  }

  const current = exercises[currentIndex]
  const total = exercises.length
  const progress = total > 0 ? (currentIndex / total) * 100 : 0

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      <header style={{ background: '#1B4965', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 16 }}>SpeakBack</span>
        {phase === 'exercise' && total > 0 && (
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            Exercise {currentIndex + 1} of {total}
          </span>
        )}
        {phase === 'exercise' && (
          <button
            onClick={() => setShowExitModal(true)}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Exit
          </button>
        )}
        {phase !== 'exercise' && <div style={{ width: 40 }} />}
      </header>

      {phase === 'exercise' && total > 0 && (
        <div style={{ height: 4, background: '#E2E2DD' }}>
          <div style={{ height: '100%', background: '#2D6A4F', width: `${progress}%`, transition: 'width 0.4s' }} />
        </div>
      )}

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>

        {phase === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2E2DD', borderTopColor: '#1B4965', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 17, color: '#6B7280' }}>Preparing your session…</p>
          </div>
        )}

        {phase === 'done_today' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>✓</p>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', marginBottom: 12 }}>
              Session already done today!
            </h2>
            <p style={{ fontSize: 17, color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>
              You've completed your session for today.<br />Come back tomorrow to keep your streak going.
            </p>
            <button
              onClick={() => navigate('/patient/dashboard')}
              style={{ height: 56, padding: '0 32px', background: '#1B4965', color: '#ffffff', fontSize: 17, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 18, color: '#B91C1C', fontWeight: 600, marginBottom: 16 }}>
              Could not load session. Please try again.
            </p>
            <button
              onClick={() => navigate('/patient/dashboard')}
              style={{ height: 56, padding: '0 32px', background: '#1B4965', color: '#ffffff', fontSize: 17, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {phase === 'exercise' && current && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280' }}>
                {BLOCK_LABELS[current.block_type]}
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '4px 0 0' }}>
                {current.exercise_name}
              </h2>
            </div>
            <ExerciseComponent key={currentIndex} exercise={current} onComplete={handleExerciseComplete} />
          </div>
        )}

        {phase === 'submitting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2E2DD', borderTopColor: '#2D6A4F', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 17, color: '#6B7280' }}>Saving your results…</p>
          </div>
        )}

        {phase === 'complete' && (
          <SessionSummary results={results} onDone={() => navigate('/patient/dashboard')} />
        )}

      </main>

      {showExitModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 24,
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, padding: '32px 28px',
            maxWidth: 400, width: '100%', textAlign: 'center',
          }}>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', marginBottom: 12 }}>
              Exit session?
            </h3>
            <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.6, marginBottom: 28 }}>
              Nothing from this session will be saved. You'll need to start over from the beginning next time.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleExitConfirm}
                style={{ width: '100%', height: 52, background: '#B91C1C', color: '#ffffff', fontSize: 16, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                Exit Anyway
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                style={{ width: '100%', height: 52, background: '#F3F4F6', color: '#1A1A1A', fontSize: 16, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                Keep Going
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function SessionSummary({ results, onDone }) {
  const scored = results.filter(r => r.metric_value > 0)
  const avg = scored.length
    ? Math.round(scored.reduce((a, r) => a + r.metric_value, 0) / scored.length)
    : null

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 8 }}>
          Session Complete
        </p>
        <h2 style={{ fontSize: 36, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>
          Well done!
        </h2>
        {avg !== null && (
          <p style={{ fontSize: 18, color: '#6B7280', marginTop: 8 }}>
            Average score: <strong style={{ color: '#1B4965' }}>{avg}</strong>
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {results.map((r, i) => {
          const color = r.metric_value >= 75 ? '#2D6A4F' : r.metric_value >= 50 ? '#BC6C25' : '#B91C1C'
          return (
            <div key={i} style={{ background: '#ffffff', border: '1px solid #E2E2DD', borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', margin: 0 }}>
                    {BLOCK_LABELS[r.block_type]}
                  </p>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
                    {r.exercise_name}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color, margin: 0 }}>
                    {Math.round(r.metric_value)}
                  </p>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>
                    {r.metric_name?.split('(')[0].trim()}
                  </p>
                </div>
              </div>
              {r.feedback && (
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '12px 0 0', paddingTop: 12, borderTop: '1px solid #F0F0EC' }}>
                  {r.feedback}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={onDone}
        style={{ width: '100%', height: 56, background: '#1B4965', color: '#ffffff', fontSize: 17, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        Back to Dashboard
      </button>
    </div>
  )
}
