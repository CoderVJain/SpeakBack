import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function registerUser(name, email, password, role) {
  const res = await axios.post(`${API}/auth/register`, { name, email, password, role })
  return res.data
}

export async function loginUser(email, password) {
  const res = await axios.post(`${API}/auth/login`, { email, password })
  return res.data
}
