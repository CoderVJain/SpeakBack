import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export async function getMyProfile(token) {
  const res = await axios.get(`${API}/patients/profile`, authHeaders(token))
  return res.data
}

export async function createProfile(token, data) {
  const res = await axios.post(`${API}/patients/profile`, data, authHeaders(token))
  return res.data
}
