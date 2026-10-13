import { NavLink } from 'react-router-dom'
import { HomeIcon, VoteIcon, UsersIcon, ChartIcon, AlertIcon, SettingsIcon } from './Icons'

const ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: HomeIcon },
  { to: '/elections', label: 'Elections', Icon: VoteIcon },
  { to: '/applications', label: 'Applications', Icon: UsersIcon },
  { to: '/results', label: 'Results', Icon: ChartIcon },
  { to: '/security', label: 'Security', Icon: AlertIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon }
]

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}
    >
      <div style={{ padding: '24px 20px 20px', fontSize: 18, fontWeight: 700 }}>
        LU Voting
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          Admin
        </div>
      </div>

      <nav style={{ padding: '8px 12px', flex: 1 }}>
        {ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 12,
              color: isActive ? '#ef4444' : 'var(--text-2)',
              background: isActive ? 'rgba(239,68,68,0.1)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14.5,
              fontWeight: isActive ? 600 : 500,
              marginBottom: 4
            })}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
