import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/patient/Dashboard'
import Session from './pages/patient/Session'
import ProfileSetup from './pages/patient/ProfileSetup'
import TherapistDashboard from './pages/therapist/Dashboard'
import PatientDetail from './pages/therapist/PatientDetail'

function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/patient/dashboard"
          element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>}
        />
        <Route
          path="/patient/session"
          element={<ProtectedRoute role="patient"><Session /></ProtectedRoute>}
        />
        <Route
          path="/patient/setup"
          element={<ProtectedRoute role="patient"><ProfileSetup /></ProtectedRoute>}
        />
        <Route
          path="/therapist/dashboard"
          element={<ProtectedRoute role="therapist"><TherapistDashboard /></ProtectedRoute>}
        />
        <Route
          path="/therapist/patient/:patientId"
          element={<ProtectedRoute role="therapist"><PatientDetail /></ProtectedRoute>}
        />
        <Route
          path="/"
          element={
            user
              ? <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/therapist/dashboard'} replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
