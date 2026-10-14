import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { ShieldIcon, ChevronRight } from '../components/Icons'
import BottomDrawer from '../components/BottomDrawer'

export default function Appeals() {
  const [loading, setLoading] = useState(true)
  const [appeals, setAppeals] = useState([])
  const [drawer, setDrawer] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vote_profiles')
      .select(`
        id, email, full_name, admission_number, faculty, year_of_study,
        avatar_url, verification_status, appeal_status, appeal_selfies,
        appeal_message, appeal_submitted_at, appeal_rejection_reason,
        ban_count, banned_at, ban_until, is_permanently_banned, badges,
        verification_rejection_reason, identity_confirmed_at
      `)
      .in('appeal_status', ['selfie_submitted', 'identity_confirmed', 'message_submitted', 'approved', 'rejected'])
      .order('appeal_submitted_at', { ascending: false, nullsFirst: false })
    setAppeals(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const identity = appeals.filter(a => a.appeal_status === 'selfie_submitted')
  const message = appeals.filter(a => a.appeal_status === 'message_submitted')
  const approved = appeals.filter(a => a.appeal_status === 'approved')
  const rejected = appeals.filter(a => a.appeal_status === 'rejected')

  return (
    <>
      <div style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
          <ShieldIcon size={72} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: -0.4 }}>
          Appeals
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          Review identity verifications and ban appeals
        </p>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0 0' }} />

      <SectionLabel>In review</SectionLabel>
      <DotRow color="#f59e0b" label="Identity pending" count={identity.length} onClick={() => setDrawer('identity')} />
      <DotRow color="#ef4444" label="Appeal submitted" count={message.length} onClick={() => setDrawer('message')} />

      <SectionLabel>Resolved</SectionLabel>
      <DotRow color="#10b981" label="Approved" count={approved.length} onClick={() => setDrawer('approved')} />
      <DotRow color="#ef4444" label="Rejected" count={rejected.length} onClick={() => setDrawer('rejected')} />

      <div style={{ height: 40 }} />

      <BottomDrawer
        open={drawer === 'identity'}
        onClose={() => setDrawer(null)}
        icon={<ShieldIcon size={56} />}
        title="Identity verifications"
      >
        <AppealList items={identity} mode="identity" onUpdate={load} />
      </BottomDrawer>

      <BottomDrawer
        open={drawer === 'message'}
        onClose={() => setDrawer(null)}
        icon={<ShieldIcon size={56} />}
        title="Appeals submitted"
      >
        <AppealList items={message} mode="message" onUpdate={load} />
      </BottomDrawer>

      <BottomDrawer
        open={drawer === 'approved'}
        onClose={() => setDrawer(null)}
        icon={<ShieldIcon size={56} />}
        title="Approved"
      >
        <AppealList items={approved} mode="readonly" onUpdate={load} />
      </BottomDrawer>

      <BottomDrawer
        open={drawer === 'rejected'}
        onClose={() => setDrawer(null)}
        icon={<ShieldIcon size={56} />}
        title="Rejected"
      >
        <AppealList items={rejected} mode="readonly" onUpdate={load} />
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

function DotRow({ color, label, count, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '18px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      cursor: 'pointer'
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 9999, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 600 }}>{count}</div>
      <div style={{ color: 'var(--text-3)' }}><ChevronRight size={18} /></div>
    </div>
  )
}

function AppealList({ items, mode, onUpdate }) {
  if (items.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Nothing here</div>
  }
  return (
    <div style={{ margin: '0 -24px' }}>
      {items.map(a => <AppealRow key={a.id} appeal={a} mode={mode} onUpdate={onUpdate} />)}
    </div>
  )
}

function AppealRow({ appeal, mode, onUpdate }) {
  const [expanded, setExpanded] = useState(mode !== 'readonly')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [selfieUrls, setSelfieUrls] = useState([])

  useEffect(() => {
    if (!expanded || !appeal.appeal_selfies || appeal.appeal_selfies.length === 0) return
    Promise.all(appeal.appeal_selfies.map(async (path) => {
      const { data } = await supabase.storage.from('vote-student-docs').createSignedUrl(path, 3600)
      return data?.signedUrl
    })).then(setSelfieUrls)
  }, [expanded, appeal.appeal_selfies])

  const approveIdentity = async () => {
    setBusy(true)
    const { data: me } = await supabase.from('vote_profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user.id).maybeSingle()

    await supabase.from('vote_profiles').update({
      appeal_status: 'identity_confirmed',
      identity_confirmed_at: new Date().toISOString(),
      identity_confirmed_by: me?.id,
      admin_note: note.trim() || null
    }).eq('id', appeal.id)

    setBusy(false)
    onUpdate?.()
  }

  const rejectIdentity = async () => {
    if (!note.trim()) { alert('Add a reason'); return }
    setBusy(true)
    await supabase.from('vote_profiles').update({
      appeal_status: 'rejected',
      appeal_reviewed_at: new Date().toISOString(),
      appeal_rejection_reason: note.trim()
    }).eq('id', appeal.id)
    setBusy(false)
    onUpdate?.()
  }

  const approveAppeal = async () => {
    if (!confirm('Approve this appeal and restore voting access?')) return
    setBusy(true)
    const { data: me } = await supabase.from('vote_profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user.id).maybeSingle()

    await supabase.from('vote_profiles').update({
      appeal_status: 'approved',
      verification_status: 'verified',
      ban_until: null,
      is_permanently_banned: false,
      appeal_reviewed_at: new Date().toISOString(),
      appeal_reviewed_by: me?.id,
      admin_note: note.trim() || null
    }).eq('id', appeal.id)

    if (me?.id) {
      await supabase.rpc('vote_add_badge', {
        p_profile_id: appeal.id,
        p_badge: 'restored',
        p_reason: 'Appeal approved',
        p_added_by: me.id
      })
    }

    setBusy(false)
    onUpdate?.()
  }

  const rejectAppeal = async () => {
    if (!note.trim()) { alert('Add a reason'); return }
    setBusy(true)
    await supabase.from('vote_profiles').update({
      appeal_status: 'rejected',
      appeal_reviewed_at: new Date().toISOString(),
      appeal_rejection_reason: note.trim()
    }).eq('id', appeal.id)
    setBusy(false)
    onUpdate?.()
  }

  const statusColor = appeal.appeal_status === 'approved' ? '#10b981'
    : appeal.appeal_status === 'rejected' ? '#ef4444'
    : '#f59e0b'

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div onClick={() => setExpanded(e => !e)} style={{
        padding: '18px 24px',
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
          color: 'var(--text-3)', fontWeight: 700
        }}>
          {appeal.avatar_url
            ? <img src={appeal.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (appeal.full_name || '?').slice(0, 1).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{appeal.full_name || appeal.email}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
            {appeal.admission_number} · Bans: {appeal.ban_count || 0}
          </div>
        </div>
        <div style={{
          fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
          color: statusColor, letterSpacing: 0.5
        }}>
          {appeal.appeal_status.replace('_', ' ')}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 24px 24px' }}>
          {selfieUrls.length > 0 && (
            <>
              <div style={{
                fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10
              }}>Identity selfies</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {selfieUrls.map((url, i) => (
                  <div key={i} style={{
                    aspectRatio: '1',
                    background: 'var(--surface-2)',
                    borderRadius: 12,
                    overflow: 'hidden'
                  }}>
                    {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                ))}
              </div>
            </>
          )}

          {appeal.appeal_message && (
            <>
              <div style={{
                fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8
              }}>Appeal message</div>
              <div style={{
                fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6,
                padding: 14, background: 'var(--surface-2)', borderRadius: 12,
                marginBottom: 20, whiteSpace: 'pre-wrap'
              }}>
                {appeal.appeal_message}
              </div>
            </>
          )}

          {mode !== 'readonly' && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Admin note (visible to user)"
              rows={3}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 14,
                color: 'var(--text-2)',
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: 14
              }}
            />
          )}

          {mode === 'identity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={approveIdentity} disabled={busy} style={btnOutline}>
                ✓ Approve identity
              </button>
              <button onClick={rejectIdentity} disabled={busy} style={btnDanger}>
                Reject identity — user can retry
              </button>
            </div>
          )}

          {mode === 'message' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={approveAppeal} disabled={busy} style={btnOutline}>
                ✓ Approve appeal — restore access
              </button>
              <button onClick={rejectAppeal} disabled={busy} style={btnDanger}>
                Reject appeal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const btnOutline = {
  padding: '14px',
  borderRadius: 12,
  border: '1.5px solid #10b981',
  background: 'transparent',
  color: '#10b981',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer'
}

const btnDanger = {
  padding: '14px',
  borderRadius: 12,
  border: 'none',
  background: 'rgba(239,68,68,0.15)',
  color: '#ef4444',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer'
}
