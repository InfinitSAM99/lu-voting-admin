import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { UsersIcon, ChevronRight } from '../components/Icons'
import BottomDrawer from '../components/BottomDrawer'

export default function Applications() {
  const [loading, setLoading] = useState(true)
  const [verifications, setVerifications] = useState([])
  const [applications, setApplications] = useState([])
  const [openDrawer, setOpenDrawer] = useState(null) // 'verifications' | 'applications'

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)

      const { data: vers } = await supabase
        .from('vote_profiles')
        .select(`
          id, email, full_name, admission_number, faculty, year_of_study,
          avatar_url, verification_status, verification_submitted_at,
          verification_selfie_url, verification_student_id_url,
          verification_supporting_doc_url, verification_supporting_doc_type,
          verification_file_hash, verification_metadata, verification_risk_score,
          verification_flags, verification_rejection_reason,
          warning_count, ban_count, badges
        `)
        .in('verification_status', ['pending', 'flagged', 'rejected'])
        .order('verification_submitted_at', { ascending: false, nullsFirst: false })

      const { data: apps } = await supabase
        .from('vote_candidate_applications')
        .select(`
          id, status, submitted_at, display_name, photo_url, manifesto, statement,
          faculty, year_of_study, rejection_reason,
          election:vote_elections(id, title),
          position:vote_positions(id, title),
          applicant:vote_profiles(
            id, full_name, email, admission_number, avatar_url,
            verification_status, faculty, year_of_study
          )
        `)
        .in('status', ['submitted', 'under_review'])
        .order('submitted_at', { ascending: false, nullsFirst: false })

      if (mounted) {
        setVerifications(vers || [])
        setApplications(apps || [])
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const reload = async () => {
    const { data: vers } = await supabase
      .from('vote_profiles')
      .select(`
        id, email, full_name, admission_number, faculty, year_of_study,
        avatar_url, verification_status, verification_submitted_at,
        verification_selfie_url, verification_student_id_url,
        verification_supporting_doc_url, verification_supporting_doc_type,
        verification_file_hash, verification_metadata, verification_risk_score,
        verification_flags, verification_rejection_reason,
        warning_count, ban_count, badges
      `)
      .in('verification_status', ['pending', 'flagged', 'rejected'])
      .order('verification_submitted_at', { ascending: false, nullsFirst: false })
    setVerifications(vers || [])

    const { data: apps } = await supabase
      .from('vote_candidate_applications')
      .select(`
        id, status, submitted_at, display_name, photo_url, manifesto, statement,
        faculty, year_of_study, rejection_reason,
        election:vote_elections(id, title),
        position:vote_positions(id, title),
        applicant:vote_profiles(
          id, full_name, email, admission_number, avatar_url,
          verification_status, faculty, year_of_study
        )
      `)
      .in('status', ['submitted', 'under_review'])
      .order('submitted_at', { ascending: false, nullsFirst: false })
    setApplications(apps || [])
  }

  const pendingVerifications = verifications.filter(v => v.verification_status === 'pending').length
  const flaggedVerifications = verifications.filter(v => v.verification_status === 'flagged').length
  const rejectedVerifications = verifications.filter(v => v.verification_status === 'rejected').length
  const pendingApps = applications.length

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>Loading…</div>
  }

  return (
    <>
      <div style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
          <UsersIcon size={72} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: -0.4 }}>
          Applications
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          Review voter verifications and candidate applications
        </p>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0 0' }} />

      <div style={{ padding: '8px 0 40px' }}>
        <SectionLabel>Voter verifications</SectionLabel>

        <DotRow
          color="#f59e0b"
          label="Pending review"
          count={pendingVerifications}
          onClick={() => setOpenDrawer('verifications_pending')}
        />
        <DotRow
          color="#ef4444"
          label="Flagged"
          count={flaggedVerifications}
          onClick={() => setOpenDrawer('verifications_flagged')}
        />
        <DotRow
          color="var(--text-3)"
          label="Rejected"
          count={rejectedVerifications}
          onClick={() => setOpenDrawer('verifications_rejected')}
        />

        <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

        <SectionLabel>Candidate applications</SectionLabel>

        <DotRow
          color="#ef4444"
          label="Awaiting review"
          count={pendingApps}
          onClick={() => setOpenDrawer('applications')}
        />
      </div>

      <BottomDrawer
        open={openDrawer?.startsWith('verifications')}
        onClose={() => setOpenDrawer(null)}
        icon={<UsersIcon size={56} />}
        title="Verifications"
      >
        <VerificationList
          items={
            openDrawer === 'verifications_pending'
              ? verifications.filter(v => v.verification_status === 'pending')
              : openDrawer === 'verifications_flagged'
                ? verifications.filter(v => v.verification_status === 'flagged')
                : verifications.filter(v => v.verification_status === 'rejected')
          }
          onUpdate={reload}
        />
      </BottomDrawer>

      <BottomDrawer
        open={openDrawer === 'applications'}
        onClose={() => setOpenDrawer(null)}
        icon={<UsersIcon size={56} />}
        title="Candidate applications"
      >
        <ApplicationList items={applications} onUpdate={reload} />
      </BottomDrawer>
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: '12px 20px 8px',
      fontSize: 11.5,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: 'var(--text-3)',
      fontWeight: 600
    }}>
      {children}
    </div>
  )
}

function DotRow({ color, label, count, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: 'pointer'
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 9999, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 600 }}>{count}</div>
      <div style={{ color: 'var(--text-3)' }}><ChevronRight size={18} /></div>
    </div>
  )
}

function VerificationList({ items, onUpdate }) {
  if (items.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Nothing here</div>
  }
  return (
    <div style={{ margin: '0 -24px' }}>
      {items.map(v => (
        <VerificationRow key={v.id} profile={v} onUpdate={onUpdate} />
      ))}
    </div>
  )
}

function VerificationRow({ profile, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [selfieUrl, setSelfieUrl] = useState(null)
  const [studentIdUrl, setStudentIdUrl] = useState(null)
  const [supportingUrl, setSupportingUrl] = useState(null)

  useEffect(() => {
    if (!expanded) return
    const loadUrls = async () => {
      if (profile.verification_selfie_url) {
        const { data } = await supabase.storage.from('vote-student-docs').createSignedUrl(profile.verification_selfie_url, 3600)
        setSelfieUrl(data?.signedUrl)
      }
      if (profile.verification_student_id_url) {
        const { data } = await supabase.storage.from('vote-student-docs').createSignedUrl(profile.verification_student_id_url, 3600)
        setStudentIdUrl(data?.signedUrl)
      }
      if (profile.verification_supporting_doc_url) {
        const { data } = await supabase.storage.from('vote-student-docs').createSignedUrl(profile.verification_supporting_doc_url, 3600)
        setSupportingUrl(data?.signedUrl)
      }
    }
    loadUrls()
  }, [expanded, profile])

  const approve = async () => {
    setBusy(true)
    const { data: me } = await supabase.from('vote_profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user.id).maybeSingle()
    await supabase.from('vote_profiles').update({
      verification_status: 'verified',
      verification_reviewed_at: new Date().toISOString(),
      verification_reviewed_by: me?.id,
      verification_notes: note.trim() || null
    }).eq('id', profile.id)
    setBusy(false)
    onUpdate?.()
  }

  const reject = async () => {
    if (!note.trim()) {
      alert('Please add a reason for rejection (visible to student)')
      return
    }
    setBusy(true)
    const { data: me } = await supabase.from('vote_profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user.id).maybeSingle()
    await supabase.from('vote_profiles').update({
      verification_status: 'rejected',
      verification_reviewed_at: new Date().toISOString(),
      verification_reviewed_by: me?.id,
      verification_rejection_reason: note.trim(),
      warning_count: (profile.warning_count || 0) + 1
    }).eq('id', profile.id)
    setBusy(false)
    onUpdate?.()
  }

  const ban = async () => {
    if (!confirm('Ban this student from voting?')) return
    setBusy(true)
    const { data: me } = await supabase.from('vote_profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user.id).maybeSingle()
    await supabase.from('vote_profiles').update({
      verification_status: 'banned',
      banned_at: new Date().toISOString(),
      ban_count: (profile.ban_count || 0) + 1,
      verification_rejection_reason: note.trim() || 'Rejected documents submitted 3+ times.'
    }).eq('id', profile.id)
    if (me?.id) {
      await supabase.rpc('vote_add_badge', {
        p_profile_id: profile.id,
        p_badge: (profile.ban_count || 0) === 0 ? 'first_ban' : 'repeat_offender',
        p_reason: note.trim() || 'Auto-flagged as banned',
        p_added_by: me.id
      })
    }
    setBusy(false)
    onUpdate?.()
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 9999,
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          color: 'var(--text-3)', fontWeight: 700
        }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (profile.full_name || '?').slice(0, 1).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{profile.full_name || profile.email}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
            {profile.admission_number} · {profile.faculty || '—'} · Year {profile.year_of_study || '—'}
          </div>
        </div>
        <div style={{
          fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
          color: profile.verification_status === 'pending' ? '#f59e0b'
            : profile.verification_status === 'flagged' ? '#ef4444'
            : 'var(--text-3)',
          letterSpacing: 0.5
        }}>
          {profile.verification_status}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Selfie', url: selfieUrl },
              { label: 'Student ID', url: studentIdUrl },
              { label: 'Supporting', url: supportingUrl }
            ].map(({ label, url }) => (
              <div key={label}>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {label}
                </div>
                <div style={{
                  aspectRatio: '1',
                  background: 'var(--surface-2)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {url
                    ? <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading…</span>}
                </div>
              </div>
            ))}
          </div>

          {profile.verification_metadata && (
            <details style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 10, fontSize: 12 }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-3)', fontWeight: 600 }}>Metadata</summary>
              <pre style={{ marginTop: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--text-2)' }}>
                {JSON.stringify(profile.verification_metadata, null, 2)}
              </pre>
            </details>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Admin note (visible to student)"
            rows={3}
            style={{
              width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 12, color: 'var(--text-2)', fontSize: 13,
              fontFamily: 'inherit', resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={approve}
              disabled={busy}
              style={{
                padding: '14px', borderRadius: 12, border: '1.5px solid #10b981',
                background: 'transparent', color: '#10b981', fontWeight: 700, fontSize: 14,
                cursor: busy ? 'not-allowed' : 'pointer'
              }}
            >✓ Approve identity</button>

            <button
              onClick={reject}
              disabled={busy}
              style={{
                padding: '14px', borderRadius: 12, border: 'none',
                background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700, fontSize: 14,
                cursor: busy ? 'not-allowed' : 'pointer'
              }}
            >Reject — student can retry</button>

            <button
              onClick={ban}
              disabled={busy}
              style={{
                padding: '14px', borderRadius: 12, border: '1.5px solid #ef4444',
                background: 'transparent', color: '#ef4444', fontWeight: 700, fontSize: 14,
                cursor: busy ? 'not-allowed' : 'pointer'
              }}
            >Ban from voting</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ApplicationList({ items, onUpdate }) {
  if (items.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No applications</div>
  }
  return (
    <div style={{ margin: '0 -24px' }}>
      {items.map(a => (
        <ApplicationRow key={a.id} app={a} onUpdate={onUpdate} />
      ))}
    </div>
  )
}

function ApplicationRow({ app, onUpdate }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const approve = async () => {
    setBusy(true)
    await supabase.from('vote_candidate_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', app.id)

    await supabase.from('vote_candidates').insert({
      election_id: app.election.id,
      position_id: app.position.id,
      profile_id: app.applicant.id,
      application_id: app.id,
      display_name: app.display_name,
      photo_url: app.photo_url,
      manifesto: app.manifesto,
      statement: app.statement,
      is_active: true
    })

    setBusy(false)
    onUpdate?.()
  }

  const reject = async () => {
    if (!note.trim()) return
    setBusy(true)
    await supabase.from('vote_candidate_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        rejection_reason: note.trim()
      })
      .eq('id', app.id)
    setBusy(false)
    onUpdate?.()
  }

  const applicantVerified = app.applicant?.verification_status === 'verified'

  return (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 9999,
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0, color: 'var(--text-3)', fontSize: 20, fontWeight: 700
        }}>
          {app.photo_url
            ? <img src={app.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (app.applicant?.full_name || '?').slice(0, 1).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 3 }}>{app.display_name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
            {app.applicant?.admission_number} · {app.applicant?.faculty}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            {app.position?.title} · {app.election?.title}
          </div>
        </div>
        {!applicantVerified && (
          <div style={{ fontSize: 10.5, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
            not verified
          </div>
        )}
      </div>

      {app.manifesto && (
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 14, whiteSpace: 'pre-wrap' }}>
          {app.manifesto.length > 240 ? app.manifesto.slice(0, 240) + '…' : app.manifesto}
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (if rejecting)"
        rows={2}
        style={{
          width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 12, color: 'var(--text-2)', fontSize: 13,
          fontFamily: 'inherit', marginBottom: 10, resize: 'vertical'
        }}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={approve}
          disabled={busy}
          style={{
            flex: 1, padding: '12px', borderRadius: 12,
            border: '1.5px solid #10b981', background: 'transparent',
            color: '#10b981', fontWeight: 700, fontSize: 13.5,
            cursor: busy ? 'not-allowed' : 'pointer'
          }}
        >Approve</button>
        <button
          onClick={reject}
          disabled={busy || !note.trim()}
          style={{
            flex: 1, padding: '12px', borderRadius: 12,
            border: 'none', background: 'rgba(239,68,68,0.15)',
            color: '#ef4444', fontWeight: 700, fontSize: 13.5,
            cursor: busy || !note.trim() ? 'not-allowed' : 'pointer',
            opacity: note.trim() ? 1 : 0.4
          }}
        >Reject</button>
      </div>
    </div>
  )
}
