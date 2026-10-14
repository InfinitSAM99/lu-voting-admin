import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { UsersIcon, ChevronRight, ShieldIcon } from '../components/Icons'
import BottomDrawer from '../components/BottomDrawer'

const BADGE_LABELS = {
  identity_verified: 'Verified',
  first_ban: 'First ban',
  repeat_offender: 'Repeat offender',
  restored: 'Restored',
  warning_1: 'Warning 1',
  warning_2: 'Warning 2',
  appeal_in_progress: 'Appealing',
  appeal_approved: 'Appeal approved',
  appeal_rejected: 'Appeal rejected',
  under_investigation: 'Under review'
}

export default function Students() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | verified | pending | banned
  const [selectedId, setSelectedId] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vote_profiles')
      .select(`
        id, email, full_name, admission_number, faculty, year_of_study,
        avatar_url, role, is_active, is_verified,
        verification_status, warning_count, ban_count, badges,
        banned_at, ban_until, is_permanently_banned,
        appeal_status, created_at
      `)
      .eq('role', 'voter')
      .order('created_at', { ascending: false })
      .limit(500)
    setStudents(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = students.filter(s => {
    if (filter === 'verified' && s.verification_status !== 'verified') return false
    if (filter === 'pending' && s.verification_status !== 'pending') return false
    if (filter === 'banned' && s.verification_status !== 'banned') return false
    if (search) {
      const q = search.toLowerCase()
      return (s.full_name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.admission_number || '').toLowerCase().includes(q)
    }
    return true
  })

  const total = students.length
  const verified = students.filter(s => s.verification_status === 'verified').length
  const pending = students.filter(s => s.verification_status === 'pending').length
  const banned = students.filter(s => s.verification_status === 'banned').length

  const selected = students.find(s => s.id === selectedId)

  return (
    <>
      <div style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
          <UsersIcon size={72} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: -0.4 }}>
          Students
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          Verified voters, pending requests, and bans
        </p>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0 0' }} />

      <SectionLabel>Summary</SectionLabel>

      <DotRow color="#10b981" label="Verified voters" count={verified} onClick={() => setFilter('verified')} active={filter === 'verified'} />
      <DotRow color="#ef4444" label="Pending review" count={pending} onClick={() => setFilter('pending')} active={filter === 'pending'} />
      <DotRow color="#ef4444" label="Banned" count={banned} onClick={() => setFilter('banned')} active={filter === 'banned'} />
      <DotRow color="var(--text-3)" label="All students" count={total} onClick={() => setFilter('all')} active={filter === 'all'} />

      <div style={{ padding: '24px 20px 12px' }}>
        <input
          className="input-field"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or admission number"
        />
      </div>

      <SectionLabel>
        {filter === 'all' ? 'All students' : filter === 'verified' ? 'Verified' : filter === 'pending' ? 'Pending' : 'Banned'}
        {' · '}{filtered.length}
      </SectionLabel>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No students</div>
      ) : filtered.slice(0, 50).map(s => (
        <StudentRow key={s.id} student={s} onClick={() => setSelectedId(s.id)} />
      ))}

      <div style={{ height: 40 }} />

      {selected && (
        <StudentDetailDrawer
          student={selected}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
        />
      )}
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: '24px 20px 8px',
      fontSize: 11.5,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: 'var(--text-3)',
      fontWeight: 600
    }}>{children}</div>
  )
}

function DotRow({ color, label, count, onClick, active }) {
  return (
    <div onClick={onClick} style={{
      padding: '18px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      cursor: 'pointer',
      background: active ? 'rgba(239,68,68,0.05)' : 'transparent'
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 9999, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 15, fontWeight: active ? 700 : 500 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 600 }}>{count}</div>
      <div style={{ color: 'var(--text-3)' }}><ChevronRight size={18} /></div>
    </div>
  )
}

function StudentRow({ student, onClick }) {
  const badges = student.badges || []
  return (
    <div onClick={onClick} style={{
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      cursor: 'pointer'
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 9999,
        background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
        color: 'var(--text-3)', fontWeight: 700, fontSize: 18
      }}>
        {student.avatar_url
          ? <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (student.full_name || '?').slice(0, 1).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 3 }}>
          {student.full_name || student.email}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: badges.length > 0 ? 6 : 0 }}>
          {student.admission_number || '—'} · {student.faculty || '—'}
        </div>
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {badges.slice(0, 3).map(b => (
              <span key={b} style={{
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                padding: '3px 8px',
                borderRadius: 9999,
                background: 'rgba(239,68,68,0.12)',
                color: '#ef4444'
              }}>
                {BADGE_LABELS[b] || b}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ color: 'var(--text-3)' }}><ChevronRight size={18} /></div>
    </div>
  )
}

function StudentDetailDrawer({ student, onClose, onUpdated }) {
  const [busy, setBusy] = useState(false)
  const [badgeLog, setBadgeLog] = useState([])

  useEffect(() => {
    supabase
      .from('vote_badge_log')
      .select('badge, reason, added_at')
      .eq('profile_id', student.id)
      .order('added_at', { ascending: false })
      .then(({ data }) => setBadgeLog(data || []))
  }, [student.id])

  const changeStatus = async (newStatus) => {
    if (!confirm(`Change verification status to "${newStatus}"?`)) return
    setBusy(true)
    await supabase.from('vote_profiles').update({ verification_status: newStatus }).eq('id', student.id)
    setBusy(false)
    onUpdated?.()
    onClose?.()
  }

  return (
    <BottomDrawer
      open
      onClose={onClose}
      icon={<ShieldIcon size={56} />}
      title={student.full_name || student.email}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 9999,
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          color: 'var(--text-3)', fontWeight: 700, fontSize: 32,
          border: student.verification_status === 'verified' ? '2px solid #ef4444' : 'none'
        }}>
          {student.avatar_url
            ? <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (student.full_name || '?').slice(0, 1).toUpperCase()}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <InfoLine label="Email" value={student.email} />
        <InfoLine label="Admission number" value={student.admission_number || '—'} />
        <InfoLine label="Faculty" value={student.faculty || '—'} />
        <InfoLine label="Year" value={student.year_of_study ? `Year ${student.year_of_study}` : '—'} />
        <InfoLine label="Verification" value={student.verification_status} />
        <InfoLine label="Warnings" value={String(student.warning_count || 0)} />
        <InfoLine label="Bans" value={String(student.ban_count || 0)} />
        {student.banned_at && (
          <InfoLine label="Banned at" value={new Date(student.banned_at).toLocaleString('en-KE')} />
        )}
        {student.ban_until && (
          <InfoLine label="Ban expires" value={new Date(student.ban_until).toLocaleString('en-KE')} />
        )}
        {student.appeal_status !== 'none' && (
          <InfoLine label="Appeal" value={student.appeal_status} />
        )}
      </div>

      {badgeLog.length > 0 && (
        <>
          <div style={{
            fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginTop: 16
          }}>Badge history</div>
          {badgeLog.map((b, i) => (
            <div key={i} style={{
              padding: '10px 0',
              borderTop: i === 0 ? '1px solid var(--border)' : 'none',
              borderBottom: '1px solid var(--border)',
              fontSize: 12.5
            }}>
              <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: 2 }}>
                {BADGE_LABELS[b.badge.replace('REMOVED:', '')] || b.badge}
              </div>
              {b.reason && <div style={{ color: 'var(--text-3)', marginBottom: 4 }}>{b.reason}</div>}
              <div style={{ color: 'var(--text-3)', fontSize: 11 }}>
                {new Date(b.added_at).toLocaleString('en-KE')}
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {student.verification_status !== 'verified' && (
          <button onClick={() => changeStatus('verified')} disabled={busy} className="btn-primary">
            Mark as verified
          </button>
        )}
        {student.verification_status !== 'pending' && student.verification_status !== 'banned' && (
          <button onClick={() => changeStatus('pending')} disabled={busy} className="btn-secondary">
            Send back to pending
          </button>
        )}
        {student.verification_status !== 'banned' && (
          <button onClick={() => changeStatus('banned')} disabled={busy} style={{
            padding: '14px', borderRadius: 9999, border: '1px solid #ef4444',
            background: 'transparent', color: '#ef4444',
            fontSize: 14, fontWeight: 600, cursor: 'pointer'
          }}>
            Ban from voting
          </button>
        )}
      </div>
    </BottomDrawer>
  )
}

function InfoLine({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}
