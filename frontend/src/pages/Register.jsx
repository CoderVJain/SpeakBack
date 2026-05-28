import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../api/auth'
import { useAuth } from '../store/authStore'

const inputStyle = {
  width: '100%',
  border: '1px solid #E2E2DD',
  borderRadius: 6,
  padding: '12px 16px',
  fontSize: 17,
  color: '#1A1A1A',
  outline: 'none',
  background: '#ffffff',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  fontSize: 15,
  fontWeight: 600,
  color: '#1A1A1A',
  marginBottom: 6,
}

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await registerUser(name, email, password, role)
      login(data.user, data.access_token)
      if (data.user.role === 'patient') navigate('/patient/dashboard')
      else navigate('/therapist/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#ffffff', border: '1px solid #E2E2DD', borderRadius: 8, padding: 40, width: '100%', maxWidth: 420 }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1B4965', margin: 0, lineHeight: 1.2 }}>
            SpeakBack
          </h1>
          <p style={{ fontSize: 17, color: '#6B7280', marginTop: 6, marginBottom: 0, lineHeight: 1.5 }}>
            Create your account
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '12px 16px', fontSize: 15, color: '#B91C1C', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
              placeholder="John Smith"
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label style={labelStyle}>I am a</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="patient">Patient</option>
              <option value="therapist">Therapist</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: 56,
              background: loading ? '#E2E2DD' : '#1B4965',
              color: loading ? '#6B7280' : '#ffffff',
              fontSize: 17,
              fontWeight: 700,
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ fontSize: 15, color: '#6B7280', marginTop: 28, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1B4965', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
