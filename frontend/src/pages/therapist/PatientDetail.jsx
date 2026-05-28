import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { getPatientSessions, generateReport, getReports } from '../../api/therapist'
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

const EXERCISE_CHIPS = {
  vowel_sounds: { label: 'Vowels', bg: '#ede9fe', color: '#6d28d9' },
  words: { label: 'Words', bg: '#ccfbf1', color: '#0f766e' },
  sentences: { label: 'Sentences', bg: '#fff7ed', color: '#c2410c' },
  paragraphs: { label: 'Paragraphs', bg: '#dbeafe', color: '#1d4ed8' },
}

function scoreColor(score) {
  if (score >= 75) return '#2D6A4F'
  if (score >= 50) return '#BC6C25'
  return '#B91C1C'
}

function scoreBg(score) {
  if (score >= 75) return '#f0fdf4'
  if (score >= 50) return '#fff7ed'
  return '#fef2f2'
}

function avatarColor(name) {
  const colors = ['#7c3aed', '#0d9488', '#0369a1', '#c2410c', '#be185d', '#b45309']
  return colors[name.charCodeAt(0) % colors.length]
}

export default function PatientDetail() {
  const { patientId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const patient = location.state?.patient

  const [sessions, setSessions] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingCurrent, setGeneratingCurrent] = useState(false)
  const [reportMsg, setReportMsg] = useState(null)
  const [reportMsgCurrent, setReportMsgCurrent] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [s, r] = await Promise.all([
          getPatientSessions(token, patientId),
          getReports(token, patientId),
        ])
        setSessions(s)
        setReports(r)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, patientId])

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.metric_value, 0) / sessions.length)
    : null

  const bestScore = sessions.length
    ? Math.round(Math.max(...sessions.map(s => s.metric_value)))
    : null

  const thisMonday = (() => {
    const d = new Date()
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    d.setHours(0, 0, 0, 0)
    return d
  })()

  const currentWeekSessions = sessions.filter(s => new Date(s.timestamp) >= thisMonday)

  const thisWeek = currentWeekSessions.length

  const currentWeekAvg = currentWeekSessions.length
    ? Math.round(currentWeekSessions.reduce((a, s) => a + s.metric_value, 0) / currentWeekSessions.length)
    : null

  const currentWeekDays = new Set(
    currentWeekSessions.map(s => new Date(s.timestamp).toDateString())
  ).size

  const chartSessions = [...sessions].reverse().slice(-15)
  const chartData = {
    labels: chartSessions.map(s =>
      new Date(s.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Score',
      data: chartSessions.map(s => Math.round(s.metric_value)),
      borderColor: '#0d9488',
      backgroundColor: 'rgba(13, 148, 136, 0.07)',
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: '#0d9488',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      tension: 0.4,
      fill: true,
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#94a3b8',
        bodyColor: '#f8fafc',
        padding: 12,
        cornerRadius: 8,
        callbacks: { label: ctx => `Score: ${ctx.raw} / 100` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#a8a29e', font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: '#f1f0ec' },
        border: { display: false },
        ticks: { color: '#a8a29e', font: { size: 11 }, stepSize: 25 },
      },
    },
  }

  async function handleGenerate() {
    setGenerating(true)
    setReportMsg(null)
    try {
      const result = await generateReport(token, patientId, 'previous')
      setReportMsg({ ok: true, text: `Report generated · ${result.session_count} sessions` })
      const r = await getReports(token, patientId)
      setReports(r)
    } catch {
      setReportMsg({ ok: false, text: 'Failed to generate report. Try again.' })
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateCurrent() {
    setGeneratingCurrent(true)
    setReportMsgCurrent(null)
    try {
      const result = await generateReport(token, patientId, 'current')
      setReportMsgCurrent({ ok: true, text: `PDF generated · ${result.session_count} sessions this week` })
      const r = await getReports(token, patientId)
      setReports(r)
    } catch {
      setReportMsgCurrent({ ok: false, text: 'Failed to generate PDF. Try again.' })
    } finally {
      setGeneratingCurrent(false)
    }
  }

  function fmtDate(dateStr) {
    return new Date(dateStr.substring(0, 10) + 'T00:00:00')
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const currentWeekReport = reports.find(r => r.is_current_week)
  const pastReports = reports.filter(r => !r.is_current_week)

  const initials = patient?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const color = patient ? avatarColor(patient.name) : '#0d9488'

  const stats = [
    { label: 'Avg Score', value: avgScore ?? '—', unit: avgScore !== null ? '/100' : '' },
    { label: 'Total Sessions', value: sessions.length },
    { label: 'This Week', value: thisWeek },
    { label: 'Best Score', value: bestScore ?? '—', unit: bestScore !== null ? '/100' : '' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#f7f6f2' }}>
      <header style={{ background: '#1B4965' }} className="px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate('/therapist/dashboard')}
          className="text-sm font-medium flex items-center gap-1.5 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.6)' }}
          onMouseOver={e => e.currentTarget.style.color = '#ffffff'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
        >
          ← Back
        </button>
        <div className="w-px h-4" style={{ background: '#1e293b' }} />
        {patient && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg text-white text-xs font-black flex items-center justify-center"
                 style={{ background: color }}>
              {initials}
            </div>
            <span className="text-white font-semibold text-sm">{patient.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#1e293b', color: '#64748b' }}>
              {patient.affected_side} side
            </span>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-2xl px-5 py-5"
                 style={{ background: '#ffffff', border: '1px solid #e8e5df' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#a8a29e' }}>
                {stat.label}
              </p>
              <p className="font-black leading-none" style={{ color: '#0f172a', fontSize: 30 }}>
                {stat.value}
                {stat.unit && (
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#c7c3bb', marginLeft: 2 }}>
                    {stat.unit}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {sessions.length > 1 && (
          <div className="rounded-2xl px-6 py-5"
               style={{ background: '#ffffff', border: '1px solid #e8e5df' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-sm" style={{ color: '#0f172a' }}>Score History</p>
                <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>
                  Last {chartSessions.length} sessions
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#0d9488' }} />
                <span className="text-xs font-medium" style={{ color: '#a8a29e' }}>Pronunciation</span>
              </div>
            </div>
            <div style={{ height: 200 }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="rounded-2xl overflow-hidden"
             style={{ background: '#ffffff', border: '1px solid #e8e5df' }}>
          <div className="px-6 py-4 flex items-center justify-between"
               style={{ borderBottom: '1px solid #f1f0ec' }}>
            <p className="font-bold text-sm" style={{ color: '#0f172a' }}>Session History</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: '#f1f0ec', color: '#78716c' }}>
              {sessions.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-14">
              <div className="w-6 h-6 rounded-full animate-spin"
                   style={{ border: '2.5px solid #e8e5df', borderTopColor: '#0d9488' }} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-sm font-medium" style={{ color: '#a8a29e' }}>No sessions recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#faf9f6' }}>
                    {['Date', 'Exercise', 'Expected', 'Heard', 'Score'].map(h => (
                      <th key={h}
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: '#a8a29e', borderBottom: '1px solid #f1f0ec' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => {
                    const chip = EXERCISE_CHIPS[s.exercise_type] || {
                      label: s.exercise_type, bg: '#f1f0ec', color: '#374151',
                    }
                    return (
                      <SessionRow
                        key={s.session_id}
                        session={s}
                        chip={chip}
                        isLast={i === sessions.length - 1}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Current Week Live Card */}
        <div className="rounded-2xl overflow-hidden"
             style={{ background: '#ffffff', border: '1px solid #e8e5df' }}>
          <div className="px-6 py-4 flex items-center justify-between"
               style={{ borderBottom: '1px solid #f1f0ec' }}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm" style={{ color: '#0f172a' }}>This Week</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: '#fef3c7', color: '#b45309' }}>
                  In Progress
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>
                {thisMonday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} – today
              </p>
            </div>
            <button
              onClick={handleGenerateCurrent}
              disabled={generatingCurrent}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
              style={{
                background: generatingCurrent ? '#f1f0ec' : '#1B4965',
                color: generatingCurrent ? '#a8a29e' : '#ffffff',
                cursor: generatingCurrent ? 'not-allowed' : 'pointer',
              }}
            >
              {generatingCurrent ? 'Generating…' : 'Generate This Week PDF'}
            </button>
          </div>

          {reportMsgCurrent && (
            <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl text-xs font-medium"
                 style={{
                   background: reportMsgCurrent.ok ? '#f0fdf4' : '#fef2f2',
                   color: reportMsgCurrent.ok ? '#16a34a' : '#dc2626',
                 }}>
              {reportMsgCurrent.text}
            </div>
          )}

          <div className="px-6 py-5 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{currentWeekSessions.length}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#a8a29e' }}>Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black"
                 style={{ color: currentWeekAvg !== null ? scoreColor(currentWeekAvg) : '#a8a29e' }}>
                {currentWeekAvg !== null ? currentWeekAvg : '—'}
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#a8a29e' }}>Avg Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: '#0f172a' }}>{currentWeekDays}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#a8a29e' }}>Days Active</p>
            </div>
          </div>

          {currentWeekSessions.length === 0 && (
            <div className="text-center pb-5">
              <p className="text-xs" style={{ color: '#c7c3bb' }}>No sessions yet this week</p>
            </div>
          )}

          {currentWeekReport && (
            <div className="mx-6 mb-5 flex items-center justify-between px-4 py-3.5 rounded-xl"
                 style={{ background: '#faf9f6', border: '1px solid #e8e5df' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>This Week's PDF</p>
                <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>
                  {currentWeekReport.session_count} sessions · Generated {fmtDate(currentWeekReport.created_at)}
                </p>
              </div>
              <a
                href={currentWeekReport.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-3.5 py-2 rounded-lg"
                style={{ background: '#e0f2fe', color: '#1B4965' }}
              >
                Download PDF
              </a>
            </div>
          )}
        </div>

        {/* Past Weekly Reports */}
        <div className="rounded-2xl overflow-hidden"
             style={{ background: '#ffffff', border: '1px solid #e8e5df' }}>
          <div className="px-6 py-4 flex items-center justify-between"
               style={{ borderBottom: '1px solid #f1f0ec' }}>
            <div>
              <p className="font-bold text-sm" style={{ color: '#0f172a' }}>Weekly Reports</p>
              <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>
                Completed Mon–Sun summaries as PDF
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
              style={{
                background: generating ? '#f1f0ec' : '#0f172a',
                color: generating ? '#a8a29e' : '#ffffff',
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? 'Generating…' : 'Generate Last Week\'s Report'}
            </button>
          </div>

          {reportMsg && (
            <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl text-xs font-medium"
                 style={{
                   background: reportMsg.ok ? '#f0fdf4' : '#fef2f2',
                   color: reportMsg.ok ? '#16a34a' : '#dc2626',
                 }}>
              {reportMsg.text}
            </div>
          )}

          <div className="px-6 py-4">
            {pastReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: '#a8a29e' }}>No completed week reports yet</p>
                <p className="text-xs mt-1" style={{ color: '#c7c3bb' }}>
                  Generate last week's report to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastReports.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3.5 rounded-xl"
                       style={{ background: '#faf9f6' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                        Week of {fmtDate(r.week_start)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>
                        {r.session_count} sessions · Generated {fmtDate(r.created_at)}
                      </p>
                    </div>
                    <a
                      href={r.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold px-3.5 py-2 rounded-lg transition-opacity hover:opacity-80"
                      style={{ background: '#e0f2fe', color: '#1B4965' }}
                    >
                      Download PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

function SessionRow({ session: s, chip, isLast }) {
  const [hovered, setHovered] = useState(false)

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#faf9f6' : 'transparent',
        borderBottom: isLast ? 'none' : '1px solid #f7f6f2',
        transition: 'background 0.1s',
      }}
    >
      <td className="px-5 py-3.5 text-xs font-medium" style={{ color: '#78716c' }}>
        {new Date(s.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </td>
      <td className="px-5 py-3.5">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: chip.bg, color: chip.color }}>
          {chip.label}
        </span>
      </td>
      <td className="px-5 py-3.5 max-w-[150px]">
        <span className="block truncate text-xs" style={{ color: '#44403c' }}>{s.expected_text}</span>
      </td>
      <td className="px-5 py-3.5 max-w-[150px]">
        <span className="block truncate text-xs" style={{ color: s.transcript ? '#44403c' : '#c7c3bb' }}>
          {s.transcript || '—'}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs font-black px-2.5 py-1 rounded-lg"
              style={{ color: scoreColor(s.metric_value), background: scoreBg(s.metric_value) }}>
          {Math.round(s.metric_value)}
        </span>
      </td>
    </tr>
  )
}
