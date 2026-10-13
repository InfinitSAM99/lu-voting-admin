import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { SunIcon, MoonIcon } from '../components/Icons'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )
  useEffect(() => {
    const m = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    m.addEventListener('change', handler)
    return () => m.removeEventListener('change', handler)
  }, [query])
  return matches
}

export default function AdminLayout() {
  const { theme, toggle } = useTheme()
  const { profile, signOut } = useAuth()
  const nav = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 900px)')

  const handleSignOut = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div className="app-shell" style={{ flexDirection: isDesktop ? 'row' : 'column' }}>
      {isDesktop && <Sidebar />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg)',
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {profile?.full_name || 'Admin'}
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {profile?.role || 'admin'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggle}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 9999,
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text)', cursor: 'pointer'
              }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
            <button
              onClick={handleSignOut}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 9999,
                padding: '0 14px',
                height: 36,
                color: 'var(--text-2)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="main-area">
          <Outlet />
        </main>

        {!isDesktop && <BottomNav />}
      </div>
    </div>
  )
}
