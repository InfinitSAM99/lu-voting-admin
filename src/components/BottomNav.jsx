import { NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, VoteIcon, UsersIcon, AlertIcon, SettingsIcon } from './Icons'

const TABS = [
  { key: 'dashboard', path: '/dashboard', label: 'Home', Icon: HomeIcon },
  { key: 'elections', path: '/elections', label: 'Elections', Icon: VoteIcon },
  { key: 'applications', path: '/applications', label: 'Review', Icon: UsersIcon },
  { key: 'appeals', path: '/appeals', label: 'Appeals', Icon: AlertIcon },
  { key: 'settings', path: '/settings', label: 'More', Icon: SettingsIcon }
]

export default function BottomNav() {
  const location = useLocation()
  return (
    <nav
      style={{
        display: 'flex',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        flexShrink: 0
      }}
    >
      {TABS.map(({ key, path, label, Icon }) => {
        const active = location.pathname === path || location.pathname.startsWith(path + '/')
        return (
          <NavLink
            key={key}
            to={path}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 0 12px',
              gap: 4,
              textDecoration: 'none',
              color: active ? '#ef4444' : 'var(--text-3)'
            }}
          >
            <Icon size={22} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500 }}>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
