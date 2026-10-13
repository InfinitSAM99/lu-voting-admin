import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { useTheme } from '../hooks/useTheme'
import AdminLayout from '../layouts/AdminLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Elections from '../pages/Elections'
import Applications from '../pages/Applications'
import Results from '../pages/Results'
import Security from '../pages/Security'
import Settings from '../pages/Settings'

function Loader() {
  return (
    <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#ef4444', fontSize: 14 }}>Loading…</div>
    </div>
  )
}

function AdminRoute({ children }) {
  const { session, profile, loading, error } = useAuth()
  if (loading) return <Loader />
  if (!session) return <Navigate to="/login" replace />
  if (error || !profile) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 400 }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            Access denied
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>
            {error || 'This account does not have admin access.'}
          </div>
        </div>
      </div>
    )
  }
  return children
}

function PublicOnly({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <Loader />
  if (session) return <Navigate to="/dashboard" replace />
  return children
}

function Shell() {
  useTheme()
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/elections" element={<Elections />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/results" element={<Results />} />
        <Route path="/security" element={<Security />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  )
}
