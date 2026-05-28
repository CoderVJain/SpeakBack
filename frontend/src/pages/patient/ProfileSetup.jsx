import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { createProfile } from '../../api/patients'

const SIDES = ['left', 'right', 'both']

export default function ProfileSetup() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [diagnosisDate, setDiagnosisDate] = useState('')
  const [affectedSide, setAffectedSide] = useState('')
  const [therapistName, setTherapistName] = useState('')
  const [therapistError, setTherapistError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!diagnosisDate || !affectedSide) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setTherapistError('')
    setSubmitting(true)
    try {
      await createProfile(token, {
        diagnosis_date: diagnosisDate,
        affected_side: affectedSide,
        therapist_name: therapistName.trim() || null,
      })
      navigate('/patient/dashboard', { replace: true })
    } catch (err) {
      const detail = err?.response?.data?.detail || ''
      if (err?.response?.status === 404 && detail.includes('therapist')) {
        setTherapistError(detail)
      } else {
        setError(detail || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1B4965', padding: '14px 24px' }}>
        <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 16 }}>SpeakBack</span>
      </header>

      <main style={{ maxWidth: 480, margin: '48px auto', padding: '0 24px', width: '100%' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', marginBottom: 8 }}>Set Up Your Profile</h1>
        <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 32 }}>
          Complete your profile to start your therapy sessions.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
              Diagnosis Date <span style={{ color: '#B91C1C' }}>*</span>
            </label>
            <input
              type="date"
              value={diagnosisDate}
              onChange={e => setDiagnosisDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              style={{ width: '100%', height: 48, border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '0 14px', fontSize: 15, background: '#ffffff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
              Affected Side <span style={{ color: '#B91C1C' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {SIDES.map(side => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setAffectedSide(side)}
                  style={{
                    flex: 1,
                    height: 48,
                    border: `2px solid ${affectedSide === side ? '#1B4965' : '#D1D5DB'}`,
                    borderRadius: 6,
                    background: affectedSide === side ? '#1B4965' : '#ffffff',
                    color: affectedSide === side ? '#ffffff' : '#374151',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', display: 'block', marginBottom: 8 }}>
              Therapist Name <span style={{ fontSize: 13, fontWeight: 400, color: '#6B7280' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={therapistName}
              onChange={e => { setTherapistName(e.target.value); setTherapistError('') }}
              placeholder="Enter your therapist's full name"
              style={{
                width: '100%',
                height: 48,
                border: `1.5px solid ${therapistError ? '#B91C1C' : '#D1D5DB'}`,
                borderRadius: 6,
                padding: '0 14px',
                fontSize: 15,
                background: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
            {therapistError ? (
              <p style={{ fontSize: 13, color: '#B91C1C', marginTop: 6 }}>{therapistError}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
                Leave blank if you don't have a therapist yet.
              </p>
            )}
          </div>

          {error && (
            <p style={{ fontSize: 14, color: '#B91C1C', fontWeight: 600 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              height: 56,
              background: submitting ? '#6B7280' : '#1B4965',
              color: '#ffffff',
              fontSize: 17,
              fontWeight: 700,
              border: 'none',
              borderRadius: 6,
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginTop: 8,
            }}
          >
            {submitting ? 'Saving…' : 'Continue to Dashboard'}
          </button>
        </form>
      </main>
    </div>
  )
}
