import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { getMyPatients, getPatientSessions } from '../../api/therapist'

const AVATAR_COLORS = ['#1B4965', '#2D6A4F', '#7c3aed', '#c2410c', '#be185d', '#b45309']

function avatarColor(name) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function scoreColor(score) {
  if (score >= 75) return '#2D6A4F'
  if (score >= 50) return '#BC6C25'
  return '#B91C1C'
}

function timeAgo(isoString) {
  if (!isoString) return 'Never'
  const diff = Date.now() - new Date(isoString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function TherapistDashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const list = await getMyPatients(token)
        const enriched = await Promise.all(
          list.map(async (p) => {
            const sessions = await getPatientSessions(token, p.patient_id)
            const avg = sessions.length
              ? Math.round(sessions.reduce((a, s) => a + s.metric_value, 0) / sessions.length)
              : null
            return { ...p, sessions, avgScore: avg, lastSession: sessions[0] || null }
          })
        )
        setPatients(enriched)
      } catch {
        setError('Could not load patients. Make sure your therapist profile is set up.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      <header style={{ background: '#1B4965', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>
            SpeakBack
          </span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>
            THERAPIST
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{user?.name}</span>
          <button
            onClick={logout}
            style={{ fontSize: 13, padding: '6px 14px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 600 }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', marginBottom: 6 }}>
              Dashboard
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
              Your Patients
            </h1>
          </div>
          {!loading && patients.length > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 4, background: '#E2E2DD', color: '#1A1A1A' }}>
              {patients.length} patient{patients.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E2E2DD', borderTopColor: '#1B4965', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 14, color: '#6B7280' }}>Loading patients…</p>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '14px 18px', fontSize: 15, color: '#B91C1C' }}>
            {error}
          </div>
        )}

        {!loading && !error && patients.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, background: '#E2E2DD', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, color: '#6B7280', fontWeight: 800 }}>?</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: 18, color: '#1A1A1A', marginBottom: 6 }}>No patients linked</p>
            <p style={{ fontSize: 15, color: '#6B7280' }}>
              No patients linked yet. Patients can find you by entering your name during their profile setup.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {patients.map(p => (
            <PatientCard
              key={p.patient_id}
              patient={p}
              onClick={() => navigate(`/therapist/patient/${p.patient_id}`, { state: { patient: p } })}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

function PatientCard({ patient, onClick }) {
  const color = avatarColor(patient.name)
  const initials = patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const score = patient.avgScore
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textAlign: 'left',
        width: '100%',
        background: hovered ? '#FAFAF8' : '#ffffff',
        border: `1px solid ${hovered ? '#1B4965' : '#E2E2DD'}`,
        borderRadius: 8,
        padding: 24,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1A', margin: 0 }}>{patient.name}</p>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>
              {patient.affected_side} side · Dx {patient.diagnosis_date?.slice(0, 7)}
            </p>
          </div>
        </div>
        {score !== null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: scoreColor(score), margin: 0, lineHeight: 1 }}>
              {score}
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginTop: 3 }}>
              avg
            </p>
          </div>
        )}
      </div>

      {score !== null && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ width: '100%', height: 3, background: '#E2E2DD', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${score}%`, height: '100%', background: scoreColor(score), borderRadius: 2, transition: 'width 0.5s' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 4, background: '#E2E2DD', color: '#1A1A1A' }}>
            {patient.sessions.length} sessions
          </span>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            Last: {timeAgo(patient.lastSession?.timestamp)}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1B4965' }}>
          View
        </span>
      </div>
    </button>
  )
}
