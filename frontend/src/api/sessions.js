import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export async function getGuidedSession(token) {
  const res = await axios.get(`${API}/sessions/guided-session`, authHeaders(token))
  return res.data
}

export async function submitSession(token, sessionData) {
  const res = await axios.post(`${API}/sessions/submit`, sessionData, authHeaders(token))
  return res.data
}

export async function getMySessions(token) {
  const res = await axios.get(`${API}/sessions/my`, authHeaders(token))
  return res.data
}

export async function checkPresence(token, frameB64) {
  const res = await axios.post(`${API}/ml/presence`, { frame_b64: frameB64 }, authHeaders(token))
  return res.data
}

export async function transcribeAudio(token, audioBlob) {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  const res = await axios.post(`${API}/ml/transcribe`, formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function scorePhoneme(token, audioBlob, expectedWord) {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('expected_word', expectedWord)
  const res = await axios.post(`${API}/ml/phoneme?expected_word=${encodeURIComponent(expectedWord)}`, formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function scoreDDK(token, transcript, targetSyllable) {
  const res = await axios.post(`${API}/ml/ddk-count`, { transcript, target_syllable: targetSyllable }, authHeaders(token))
  return res.data
}

export async function scoreSpeechRate(token, transcript, durationSec) {
  const res = await axios.post(`${API}/ml/speech-rate`, { transcript, duration_seconds: durationSec }, authHeaders(token))
  return res.data
}
