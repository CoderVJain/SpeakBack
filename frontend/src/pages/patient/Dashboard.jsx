import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { getMySessions } from '../../api/sessions'
import { getMyProfile } from '../../api/patients'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

function computeStreak(sessions) {
  if (!sessions.length) return 0
  const days = new Set(sessions.map(s => s.timestamp.slice(0, 10)))
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)
  const startOffset = days.has(todayKey) ? 0 : days.has(yesterdayKey) ? 1 : null
  if (startOffset === null) return 0
  let streak = 0
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (days.has(key)) streak++
    else break
  }
  return streak
}

function getWeeklyData(sessions) {
  const today = new Date()
  const labels = []
  const data = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    labels.push(d.toLocaleDateString('en', { month: 'short', day: 'numeric' }))
    const day = sessions.filter(s => s.timestamp.slice(0, 10) === key)
    if (day.length) {
      const avg = day.reduce((a, s) => a + s.metric_value, 0) / day.length
      data.push(Math.round(avg))
    } else {
      data.push(null)
    }
  }
  return { labels, data }
}

function getBestDayScore(sessions) {
  if (!sessions.length) return null
  const byDay = {}
  for (const s of sessions) {
    const day = s.timestamp.slice(0, 10)
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(s.metric_value)
  }
  const dayAvgs = Object.values(byDay).map(
    vals => Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  )
  return Math.max(...dayAvgs)
}

export default function PatientDashboard() {
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        await getMyProfile(token)
      } catch {
        navigate('/patient/setup', { replace: true })
        return
      }
      getMySessions(token).then(setSessions).finally(() => setLoading(false))
    }
    load()
  }, [token])

  const streak = computeStreak(sessions)
  const bestDay = getBestDayScore(sessions)
  const totalSessions = sessions.length

  const { labels: weekLabels, data: weekData } = getWeeklyData(sessions)
  const hasWeekData = weekData.some(v => v !== null)

  const chartData = {
    labels: weekLabels,
    datasets: [{
      label: 'Avg Score',
      data: weekData,
      borderColor: '#1B4965',
      backgroundColor: 'rgba(27, 73, 101, 0.07)',
      borderWidth: 2,
      pointRadius: weekData.map(v => v === null ? 0 : 4),
      pointHoverRadius: 6,
      pointBackgroundColor: '#1B4965',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: true,
      spanGaps: true,
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A1A1A',
        titleColor: '#6B7280',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 4,
        callbacks: {
          label: ctx => ctx.raw !== null ? `Score: ${ctx.raw}` : 'No session',
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#6B7280', font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: '#E2E2DD' },
        border: { display: false },
        ticks: { color: '#6B7280', font: { size: 11 }, stepSize: 25 },
      },
    },
  }

  const stats = [
    { label: 'Streak', value: streak, unit: streak === 1 ? 'day' : 'days', color: '#BC6C25' },
    { label: 'Best Day', value: bestDay ?? '—', unit: bestDay !== null ? '/100' : '', color: '#2D6A4F' },
    { label: 'Total Sessions', value: totalSessions, unit: '', color: '#1B4965' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      <header style={{ background: '#1B4965', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: 0 }}>SpeakBack</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>Welcome, {user?.name}</p>
        </div>
        <button
          onClick={logout}
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          onMouseOver={e => e.currentTarget.style.color = '#ffffff'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
        >
          Logout
        </button>
      </header>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        <button
          onClick={() => navigate('/patient/session')}
          style={{
            width: '100%', height: 64, background: '#1B4965', color: '#ffffff',
            fontSize: 19, fontWeight: 800, border: 'none', borderRadius: 6, cursor: 'pointer',
            letterSpacing: '-0.2px',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#163d55'}
          onMouseOut={e => e.currentTarget.style.background = '#1B4965'}
        >
          Start Today's Session
        </button>
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', margin: '-20px 0 0' }}>
          15 minutes · 8 exercises · Warm-up included
        </p>

        {!loading && (
          <>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 10 }}>
                Your Progress
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {stats.map(stat => (
                  <div key={stat.label} style={{ background: '#ffffff', border: '1px solid #E2E2DD', borderRadius: 8, padding: '16px 14px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', margin: '0 0 8px' }}>
                      {stat.label}
                    </p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: stat.color, margin: 0, lineHeight: 1 }}>
                      {stat.value}
                      {stat.unit && (
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginLeft: 3 }}>
                          {stat.unit}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {hasWeekData && (
              <div style={{ background: '#ffffff', border: '1px solid #E2E2DD', borderRadius: 8, padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A', margin: 0 }}>This Week</p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '3px 0 0' }}>Daily average score</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B4965' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>Score</span>
                  </div>
                </div>
                <div style={{ height: 160 }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            )}
          </>
        )}

      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
