import { useState, useEffect, useRef, useCallback } from 'react'
import { getFaceLandmarker } from '../../utils/faceLandmarker'

const EXERCISE_CONFIG = {
  'Lip Pucker Hold': {
    extract: s => Math.max(s.mouthPucker ?? 0, s.mouthFunnel ?? 0),
  },
  'Lip Spread Hold': {
    extract: s => ((s.mouthSmileLeft ?? 0) + (s.mouthSmileRight ?? 0)) / 2,
    symmetryExtract: s => [s.mouthSmileLeft ?? 0, s.mouthSmileRight ?? 0],
  },
  'Alternating Lip Movement': {
    extract: s => Math.max(
      s.mouthPucker ?? 0,
      ((s.mouthSmileLeft ?? 0) + (s.mouthSmileRight ?? 0)) / 2
    ),
  },
  'Tongue Protrusion Hold': {
    extract: s => s.tongueOut ?? 0,
  },
  'Tongue Lateral Movement': {
    extract: s => Math.max(s.mouthLeft ?? 0, s.mouthRight ?? 0),
    symmetryExtract: s => [s.mouthLeft ?? 0, s.mouthRight ?? 0],
  },
  'Jaw Open Close': {
    extract: s => s.jawOpen ?? 0,
  },
  'Cheek Puff Hold': {
    extract: s => s.cheekPuff ?? 0,
  },
  'Tongue to Roof': {
    extract: s => s.mouthClose ?? 0,
  },
}

const EXERCISE_DIAGRAMS = {
  'Lip Pucker Hold': (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="8" fill="#FFF5EC"/>
      <ellipse cx="60" cy="56" rx="42" ry="46" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1.5"/>
      <circle cx="44" cy="44" r="3.5" fill="#444"/>
      <circle cx="76" cy="44" r="3.5" fill="#444"/>
      <circle cx="45.5" cy="43" r="1.2" fill="white"/>
      <circle cx="77.5" cy="43" r="1.2" fill="white"/>
      <ellipse cx="60" cy="77" rx="9" ry="11" fill="#C0546A" stroke="#8B3045" strokeWidth="2"/>
      <ellipse cx="60" cy="72" rx="9" ry="5.5" fill="#E08090"/>
      <ellipse cx="60" cy="80" rx="4.5" ry="5.5" fill="#7B1A30"/>
    </svg>
  ),
  'Lip Spread Hold': (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="8" fill="#FFF5EC"/>
      <ellipse cx="60" cy="56" rx="42" ry="46" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1.5"/>
      <circle cx="44" cy="44" r="3.5" fill="#444"/>
      <circle cx="76" cy="44" r="3.5" fill="#444"/>
      <circle cx="45.5" cy="43" r="1.2" fill="white"/>
      <circle cx="77.5" cy="43" r="1.2" fill="white"/>
      <path d="M34 74 Q60 92 86 74 Q60 68 34 74 Z" fill="#8B2040"/>
      <rect x="36" y="73" width="48" height="10" rx="2" fill="white"/>
      <path d="M34 74 Q60 68 86 74" fill="#C0546A" stroke="#8B3045" strokeWidth="1.5"/>
      <path d="M34 74 Q60 90 86 74" fill="none" stroke="#8B3045" strokeWidth="1.5"/>
    </svg>
  ),
  'Alternating Lip Movement': (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="8" fill="#FFF5EC"/>
      <ellipse cx="60" cy="54" rx="42" ry="44" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1.5"/>
      <circle cx="44" cy="43" r="3.5" fill="#444"/>
      <circle cx="76" cy="43" r="3.5" fill="#444"/>
      <circle cx="45.5" cy="42" r="1.2" fill="white"/>
      <circle cx="77.5" cy="42" r="1.2" fill="white"/>
      <ellipse cx="60" cy="74" rx="8" ry="9" fill="#C0546A" stroke="#8B3045" strokeWidth="1.5"/>
      <ellipse cx="60" cy="70" rx="8" ry="4.5" fill="#E08090"/>
      <ellipse cx="60" cy="77" rx="4" ry="4.5" fill="#7B1A30"/>
      <text x="14" y="112" fontSize="9" fill="#888" fontFamily="sans-serif">pucker ↔ smile</text>
    </svg>
  ),
  'Tongue Protrusion Hold': (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="8" fill="#FFF5EC"/>
      <ellipse cx="60" cy="54" rx="42" ry="46" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1.5"/>
      <circle cx="44" cy="43" r="3.5" fill="#444"/>
      <circle cx="76" cy="43" r="3.5" fill="#444"/>
      <circle cx="45.5" cy="42" r="1.2" fill="white"/>
      <circle cx="77.5" cy="42" r="1.2" fill="white"/>
      <ellipse cx="60" cy="73" rx="15" ry="9" fill="#7B1A30" stroke="#5B1030" strokeWidth="1.5"/>
      <ellipse cx="60" cy="86" rx="9" ry="12" fill="#E07890" stroke="#C05070" strokeWidth="1"/>
      <path d="M45 73 Q60 67 75 73" fill="#C0546A" stroke="#8B3045" strokeWidth="1.5"/>
      <path d="M45 73 Q60 79 75 73" fill="#E08090" stroke="#8B3045" strokeWidth="1"/>
    </svg>
  ),
  'Tongue Lateral Movement': (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="8" fill="#FFF5EC"/>
      <ellipse cx="60" cy="56" rx="42" ry="46" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1.5"/>
      <circle cx="44" cy="44" r="3.5" fill="#444"/>
      <circle cx="76" cy="44" r="3.5" fill="#444"/>
      <circle cx="45.5" cy="43" r="1.2" fill="white"/>
      <circle cx="77.5" cy="43" r="1.2" fill="white"/>
      <ellipse cx="60" cy="76" rx="15" ry="9" fill="#7B1A30" stroke="#5B1030" strokeWidth="1.5"/>
      <ellipse cx="71" cy="76" rx="11" ry="7" fill="#E07890" stroke="#C05070" strokeWidth="1"/>
      <path d="M45 76 Q60 70 75 76" fill="#C0546A" stroke="#8B3045" strokeWidth="1.5"/>
      <path d="M45 76 Q60 82 75 76" fill="#E08090" stroke="#8B3045" strokeWidth="1"/>
      <path d="M84 72 L92 76 L84 80" fill="#1B4965" stroke="#1B4965" strokeWidth="1"/>
    </svg>
  ),
  'Jaw Open Close': (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="8" fill="#FFF5EC"/>
      <ellipse cx="60" cy="56" rx="42" ry="46" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1.5"/>
      <circle cx="44" cy="42" r="3.5" fill="#444"/>
      <circle cx="76" cy="42" r="3.5" fill="#444"/>
      <circle cx="45.5" cy="41" r="1.2" fill="white"/>
      <circle cx="77.5" cy="41" r="1.2" fill="white"/>
      <ellipse cx="60" cy="80" rx="20" ry="16" fill="#5B1030" stroke="#3B0020" strokeWidth="1.5"/>
      <rect x="42" y="66" width="36" height="9" rx="3" fill="white"/>
      <rect x="42" y="84" width="36" height="9" rx="3" fill="white"/>
      <path d="M40 66 Q60 60 80 66" fill="#C0546A" stroke="#8B3045" strokeWidth="1.5"/>
      <path d="M40 93 Q60 100 80 93" fill="#E08090" stroke="#8B3045" strokeWidth="1.5"/>
    </svg>
  ),
  'Cheek Puff Hold': (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="8" fill="#FFF5EC"/>
      <ellipse cx="18" cy="64" rx="14" ry="12" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1"/>
      <ellipse cx="102" cy="64" rx="14" ry="12" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1"/>
      <ellipse cx="60" cy="56" rx="42" ry="46" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1.5"/>
      <circle cx="44" cy="44" r="3.5" fill="#444"/>
      <circle cx="76" cy="44" r="3.5" fill="#444"/>
      <circle cx="45.5" cy="43" r="1.2" fill="white"/>
      <circle cx="77.5" cy="43" r="1.2" fill="white"/>
      <ellipse cx="60" cy="76" rx="7" ry="8" fill="#C0546A" stroke="#8B3045" strokeWidth="2"/>
      <ellipse cx="60" cy="73" rx="7" ry="4" fill="#E08090"/>
      <ellipse cx="60" cy="79" rx="3.5" ry="4" fill="#7B1A30"/>
    </svg>
  ),
  'Tongue to Roof': (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="8" fill="#FFF5EC"/>
      <ellipse cx="60" cy="56" rx="42" ry="46" fill="#FDDCB5" stroke="#D49A6A" strokeWidth="1.5"/>
      <circle cx="44" cy="44" r="3.5" fill="#444"/>
      <circle cx="76" cy="44" r="3.5" fill="#444"/>
      <circle cx="45.5" cy="43" r="1.2" fill="white"/>
      <circle cx="77.5" cy="43" r="1.2" fill="white"/>
      <ellipse cx="60" cy="76" rx="16" ry="9" fill="#7B1A30" stroke="#5B1030" strokeWidth="1.5"/>
      <path d="M46 70 Q60 64 74 70" fill="#E07890" stroke="#C05070" strokeWidth="1.5"/>
      <path d="M44 76 Q60 70 76 76" fill="#C0546A" stroke="#8B3045" strokeWidth="1.5"/>
      <path d="M44 76 Q60 82 76 76" fill="#E08090" stroke="#8B3045" strokeWidth="1"/>
    </svg>
  ),
}

function parseBlendshapes(result) {
  const cats = result?.faceBlendshapes?.[0]?.categories
  if (!cats) return null
  return Object.fromEntries(cats.map(c => [c.categoryName, c.score]))
}

function computeScore(config, calibBaseline, activeSamples, activeSymSamples) {
  if (!activeSamples.length) return 0
  const activeAvg = activeSamples.reduce((a, b) => a + b, 0) / activeSamples.length
  const range = 1.0 - calibBaseline
  const rom = range > 0.001
    ? Math.max(0, Math.min(100, ((activeAvg - calibBaseline) / range) * 100))
    : 0

  if (!config.symmetryExtract || !activeSymSamples.length) return Math.round(rom)

  const leftAvg = activeSymSamples.map(r => r[0]).reduce((a, b) => a + b, 0) / activeSymSamples.length
  const rightAvg = activeSymSamples.map(r => r[1]).reduce((a, b) => a + b, 0) / activeSymSamples.length
  const dominant = Math.max(leftAvg, rightAvg)
  const sym = dominant > 0.01 ? (Math.min(leftAvg, rightAvg) / dominant) * 100 : 100
  return Math.round(rom * 0.6 + sym * 0.4)
}


export default function OralMotorExercise({ exercise, onComplete }) {
  const [phase, setPhase] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [faceDetected, setFaceDetected] = useState(false)
  const [calibCountdown, setCalibCountdown] = useState(2)
  const [score, setScore] = useState(null)
  const [liveScore, setLiveScore] = useState(0)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const landmarkerRef = useRef(null)
  const rafRef = useRef(null)
  const phaseRef = useRef('loading')
  const calibSamplesRef = useRef([])
  const activeSamplesRef = useRef([])
  const activeSymSamplesRef = useRef([])
  const calibResultRef = useRef({ romBaseline: 0 })
  const lastLiveUpdateRef = useRef(0)

  const config = EXERCISE_CONFIG[exercise.exercise_name] || { extract: () => 0 }
  const diagram = EXERCISE_DIAGRAMS[exercise.exercise_name]

  function changePhase(p) {
    phaseRef.current = p
    setPhase(p)
  }

  const startRaf = useCallback(() => {
    let lastTs = -1
    function tick() {
      rafRef.current = requestAnimationFrame(tick)
      const video = videoRef.current
      if (!video || video.readyState < 2 || !landmarkerRef.current) return

      const ts = performance.now()
      if (ts === lastTs) return
      lastTs = ts

      const result = landmarkerRef.current.detectForVideo(video, ts)
      const scores = parseBlendshapes(result)

      if (!scores) {
        setFaceDetected(false)
        return
      }
      setFaceDetected(true)

      const primary = config.extract(scores)

      if (phaseRef.current === 'calibrating') {
        calibSamplesRef.current.push(primary)
      } else if (phaseRef.current === 'active') {
        activeSamplesRef.current.push(primary)
        if (config.symmetryExtract) {
          activeSymSamplesRef.current.push(config.symmetryExtract(scores))
        }
        const now = performance.now()
        if (now - lastLiveUpdateRef.current > 120) {
          lastLiveUpdateRef.current = now
          const baseline = calibResultRef.current.romBaseline
          const range = 1.0 - baseline
          const rom = range > 0.001
            ? Math.max(0, Math.min(100, ((primary - baseline) / range) * 100))
            : 0
          setLiveScore(Math.round(rom))
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [config])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const [landmarker, stream] = await Promise.all([
          getFaceLandmarker(),
          navigator.mediaDevices.getUserMedia({ video: true, audio: false }),
        ])
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        landmarkerRef.current = landmarker
        streamRef.current = stream
        videoRef.current.srcObject = stream

        videoRef.current.onloadedmetadata = () => {
          if (cancelled) return
          videoRef.current.play()
          startRaf()
          changePhase('calibrating')
          setCalibCountdown(2)

          let count = 2
          const interval = setInterval(() => {
            count -= 1
            setCalibCountdown(count)
            if (count <= 0) {
              clearInterval(interval)
              const samples = calibSamplesRef.current
              const baseline = samples.length
                ? samples.reduce((a, b) => a + b, 0) / samples.length
                : 0
              calibResultRef.current = { romBaseline: baseline }
              changePhase('ready')
            }
          }, 1000)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.name === 'NotAllowedError' ? 'Camera access denied.' : 'Could not start camera or load model.')
          changePhase('camError')
        }
      }
    }

    init()
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [startRaf])

  function startExercise() {
    activeSamplesRef.current = []
    activeSymSamplesRef.current = []
    lastLiveUpdateRef.current = 0
    setLiveScore(0)
    changePhase('active')
    setTimeout(() => {
      const finalScore = computeScore(
        config,
        calibResultRef.current.romBaseline,
        activeSamplesRef.current,
        activeSymSamplesRef.current
      )
      setScore(finalScore)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      changePhase('result')
    }, exercise.duration_seconds * 1000)
  }

  function handleNext() {
    onComplete({
      block_type: exercise.block_type,
      exercise_name: exercise.exercise_name,
      expected_text: null,
      transcript: null,
      presence_detected: true,
      metric_name: exercise.metric_name,
      metric_value: score ?? 0,
      baseline_delta: null,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {phase !== 'result' && phase !== 'camError' && (
        <div>
          <div style={{
            borderRadius: 8, overflow: 'hidden',
            border: `4px solid ${faceDetected ? '#2D6A4F' : '#B91C1C'}`,
            transition: 'border-color 0.3s',
            background: '#000',
          }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', display: 'block' }} />
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: faceDetected ? '#2D6A4F' : '#B91C1C' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: faceDetected ? '#2D6A4F' : '#B91C1C' }}>
              {faceDetected ? 'Face detected' : 'Move into view'}
            </span>
          </div>
        </div>
      )}

      {phase === 'loading' && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E2E2DD', borderTopColor: '#1B4965', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>Loading movement analysis…</p>
        </div>
      )}

      {phase === 'camError' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: 17, color: '#B91C1C', fontWeight: 600, marginBottom: 8 }}>Camera unavailable</p>
          <p style={{ fontSize: 15, color: '#6B7280' }}>{loadError}</p>
        </div>
      )}

      {phase === 'calibrating' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 19, fontWeight: 700, color: '#1B4965', margin: '0 0 6px' }}>
            Hold still — measuring your resting position
          </p>
          <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 16px' }}>
            Look straight ahead with a relaxed, neutral face.
          </p>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', border: '4px solid #1B4965',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', fontSize: 30, fontWeight: 900, color: '#1B4965',
          }}>
            {calibCountdown}
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {diagram && (
              <div style={{ flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E2DD' }}>
                {diagram}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, color: '#1A1A1A', lineHeight: 1.6, margin: '0 0 8px' }}>
                {exercise.instruction}
              </p>
              <p style={{ fontSize: 13, color: '#2D6A4F', fontWeight: 600, margin: 0 }}>
                Baseline captured. Press Begin when ready.
              </p>
            </div>
          </div>
          <button
            onClick={startExercise}
            disabled={!faceDetected}
            style={{
              width: '100%', height: 56,
              background: faceDetected ? '#1B4965' : '#E2E2DD',
              color: faceDetected ? '#ffffff' : '#6B7280',
              fontSize: 17, fontWeight: 700, border: 'none', borderRadius: 6,
              cursor: faceDetected ? 'pointer' : 'not-allowed',
            }}
          >
            Begin Exercise
          </button>
        </>
      )}

      {phase === 'active' && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {diagram && (
            <div style={{ flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E2DD' }}>
              {diagram}
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 15, color: '#1A1A1A', lineHeight: 1.6, margin: 0 }}>
              {exercise.instruction}
            </p>
            <MotivationBar liveScore={liveScore} />
          </div>
        </div>
      )}

      {phase === 'result' && score !== null && (
        <OralMotorResult score={score} metricName={exercise.metric_name} onNext={handleNext} />
      )}
    </div>
  )
}

function MotivationBar({ liveScore }) {
  const color = liveScore >= 70 ? '#2D6A4F' : liveScore >= 40 ? '#BC6C25' : '#B91C1C'
  const message = liveScore >= 70
    ? 'Excellent — keep that movement going!'
    : liveScore >= 40
    ? 'Good — push a little further!'
    : 'Keep going — move as far as you can!'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Movement Quality
        </span>
        <span style={{ fontSize: 20, fontWeight: 900, color, transition: 'color 0.3s' }}>
          {liveScore}%
        </span>
      </div>
      <div style={{ position: 'relative', height: 20, background: '#E2E2DD', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: '60%', top: 0, bottom: 0, width: 2,
          background: 'rgba(45,106,79,0.5)', zIndex: 1,
        }} />
        <div style={{
          height: '100%',
          width: `${liveScore}%`,
          background: color,
          borderRadius: 10,
          transition: 'width 0.12s ease-out, background 0.3s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>Rest</span>
        <span style={{ fontSize: 11, color: '#2D6A4F', fontWeight: 600 }}>Target 60%+</span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>Max</span>
      </div>
      <div style={{
        marginTop: 10, padding: '8px 14px',
        background: `${color}18`,
        border: `1px solid ${color}50`,
        borderRadius: 8, textAlign: 'center',
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <p style={{ fontSize: 14, fontWeight: 700, color, margin: 0, transition: 'color 0.3s' }}>
          {message}
        </p>
      </div>
    </div>
  )
}

function OralMotorResult({ score, metricName, onNext }) {
  const color = score >= 70 ? '#2D6A4F' : score >= 45 ? '#BC6C25' : '#B91C1C'
  const message = score >= 70 ? 'Good range of movement.' : score >= 45 ? 'Keep working on it.' : 'Try to move further each session.'

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 8 }}>
        {metricName}
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
