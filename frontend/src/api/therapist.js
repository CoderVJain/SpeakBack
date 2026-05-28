import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export async function getMyPatients(token) {
  const res = await axios.get(`${API}/therapists/patients`, authHeaders(token))
  return res.data
}

export async function getPatientSessions(token, patientId) {
  const res = await axios.get(`${API}/sessions/patient/${patientId}`, authHeaders(token))
  return res.data
}

export async function generateReport(token, patientId, weekType = 'previous') {
  const res = await axios.post(`${API}/reports/${patientId}/generate?week=${weekType}`, {}, authHeaders(token))
  return res.data
}

export async function getReports(token, patientId) {
  const res = await axios.get(`${API}/reports/${patientId}`, authHeaders(token))
  return res.data
}
