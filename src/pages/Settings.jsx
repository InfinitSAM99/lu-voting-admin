import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../app/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { SettingsIcon, ChevronRight, ShieldIcon, UsersIcon, SunIcon, MoonIcon } from '../components/Icons'
import BottomDrawer from '../components/BottomDrawer'

export default function Settings() {
  const nav = useNavigate()
  const { profile, signOut, isSuperAdmin } = useAuth()
  const { theme, toggle } = useTheme()

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState(null) // 'admins' | 'officers' | 'faculties'

  useEffect(() => {
    let mounted = true
    supabase
      .from('vote_profiles')
      .select('id, full_name, email, role, is_active')
      .in('role', ['admin', 'super_admin', 'officer'])
      .order('role', { ascending: false })
      .then(({ data }) => {
        if (mounted) {
          setAdmins(data || [])
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [])

  const logout = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <>
      <div style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
          <SettingsIcon size={72} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: -0.4 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          Account, team, and system configuration
        </p>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0 0' }} />

      <SectionLabel>Your account</SectionLabel>
      <Row
        label={profile?.full_name || 'Admin'}
        subtitle={profile?.email}
        value={profile?.role}
      />

      <SectionLabel>Team</SectionLabel>
      <Row
        icon={<UsersIcon size={20} />}
        label="Admins & officers"
        subtitle={loading ? 'Loading…' : `${admins.length} with admin access`}
        chevron
        onClick={() => setDrawer('admins')}
      />

      <SectionLabel>Configuration</SectionLabel>
      <Row
        icon={<ShieldIcon size={20} />}
        label="Faculties"
        subtitle="Toggle schools on or off"
        chevron
        onClick={() => setDrawer('faculties')}
      />

      <SectionLabel>Preferences</SectionLabel>
      <Row
        icon={theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
        label="Theme"
        value={theme === 'dark' ? 'Dark' : 'Light'}
        chevron
        onClick={toggle}
      />

      <div style={{ padding: '24px 20px 40px' }}>
        <button className="btn-secondary" onClick={logout}>Sign out</button>
      </div>

      <BottomDrawer
        open={drawer === 'admins'}
        onClose={() => setDrawer(null)}
        icon={<UsersIcon size={56} />}
        title="Admins & officers"
      >
        <AdminsList admins={admins} canEdit={isSuperAdmin} onUpdate={() => {
          supabase
            .from('vote_profiles')
            .select('id, full_name, email, role, is_active')
            .in('role', ['admin', 'super_admin', 'officer'])
            .order('role', { ascending: false })
            .then(({ data }) => setAdmins(data || []))
        }} />
      </BottomDrawer>

      <BottomDrawer
        open={drawer === 'faculties'}
        onClose={() => setDrawer(null)}
        icon={<ShieldIcon size={56} />}
        title="Faculties"
      >
        <FacultiesList />
      </BottomDrawer>
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: '28px 20px 8px',
      fontSize: 11.5,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: 'var(--text-3)',
      fontWeight: 600
    }}>{children}</div>
  )
}

function Row({ icon, label, subtitle, value, onClick, chevron }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {icon && <div style={{ color: 'var(--text-3)', flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500 }}>{label}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {value && <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{value}</div>}
      {chevron && <div style={{ color: 'var(--text-3)' }}><ChevronRight size={18} /></div>}
    </div>
  )
}

function AdminsList({ admins, canEdit, onUpdate }) {
  const changeRole = async (id, newRole) => {
    if (!confirm(`Change role to ${newRole}?`)) return
    await supabase.from('vote_profiles').update({ role: newRole }).eq('id', id)
    onUpdate?.()
  }

  if (admins.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
      No admins yet
    </div>
  }

  return (
    <div style={{ margin: '0 -24px' }}>
      {admins.map(a => (
        <div key={a.id} style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 9999,
            background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-3)', fontWeight: 700, flexShrink: 0
          }}>
            {(a.full_name || a.email || '?').slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 2 }}>{a.full_name || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{a.email}</div>
          </div>
          {canEdit ? (
            <select
              value={a.role}
              onChange={(e) => changeRole(a.id, e.target.value)}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '6px 10px',
                fontSize: 12,
                color: 'var(--text)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super admin</option>
            </select>
          ) : (
            <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
              {a.role}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FacultiesList() {
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase
      .from('vote_faculties')
      .select('id, name, is_active, sort_order')
      .order('sort_order', { ascending: true })
    setFaculties(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggle = async (id, current) => {
    await supabase.from('vote_faculties').update({ is_active: !current }).eq('id', id)
    load()
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>

  return (
    <div style={{ margin: '0 -24px' }}>
      {faculties.map(f => (
        <div key={f.id} style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 500, opacity: f.is_active ? 1 : 0.5 }}>
            {f.name}
          </div>
          <button
            onClick={() => toggle(f.id, f.is_active)}
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              border: 'none',
              background: f.is_active ? 'rgba(239,68,68,0.15)' : 'var(--surface-2)',
              color: f.is_active ? '#ef4444' : 'var(--text-3)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {f.is_active ? 'Active' : 'Off'}
          </button>
        </div>
      ))}
    </div>
  )
}
