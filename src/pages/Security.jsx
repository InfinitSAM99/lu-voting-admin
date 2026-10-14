import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { AlertIcon, ChevronRight, ShieldIcon } from '../components/Icons'
import BottomDrawer from '../components/BottomDrawer'

const EVENT_LABELS = {
  login_attempt: 'Login attempt',
  login_success: 'Login success',
  login_failure: 'Login failed',
  claim_attempt: 'Claim attempt',
  claim_success: 'Claim success',
  claim_failure: 'Claim failed',
  biometric_enroll: 'Biometric enrolled',
  biometric_challenge: 'Biometric challenge',
  biometric_verify_success: 'Biometric verified',
  biometric_verify_failure: 'Biometric failed',
  vote_attempt: 'Vote attempt',
  vote_success: 'Vote recorded',
  vote_rejected: 'Vote rejected',
  suspicious_activity: 'Suspicious activity',
  rate_limit_hit: 'Rate limit hit'
}

export default function Security() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vote_security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const count = (type) => events.filter(e => e.event_type === type).length
  const failed = count('login_failure') + count('claim_failure') + count('vote_rejected') + count('biometric_verify_failure')
  const success = count('login_success') + count('claim_success') + count('vote_success') + count('biometric_verify_success')
  const suspicious = count('suspicious_activity') + count('rate_limit_hit')

  const filtered = filter === 'all' ? events : events.filter(e => e.event_type === filter)

  return (
    <>
      <div style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
          <AlertIcon size={72} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: -0.4 }}>
          Security
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          Login, verification, and vote activity
        </p>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0 0' }} />

      <SectionLabel>Summary</SectionLabel>

      <DotRow color="#ef4444" label="Suspicious / flagged" count={suspicious} onClick={() => { setFilter('suspicious_activity'); setDrawerOpen(true) }} />
      <DotRow color="#ef4444" label="Failed attempts" count={failed} onClick={() => { setFilter('login_failure'); setDrawerOpen(true) }} />
      <DotRow color="#10b981" label="Successful actions" count={success} onClick={() => { setFilter('all'); setDrawerOpen(true) }} />

      <SectionLabel>Recent events</SectionLabel>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
      ) : events.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No events yet</div>
      ) : (
        events.slice(0, 20).map(ev => <EventRow key={ev.id} event={ev} />)
      )}

      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => { setFilter('all'); setDrawerOpen(true) }}
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 9999, padding: '12px 22px',
            color: 'var(--text-2)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer'
          }}
        >
          View all events
        </button>
      </div>

      <div style={{ height: 40 }} />

      <BottomDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        icon={<ShieldIcon size={56} />}
        title="Security events"
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
          {['all', 'login_success', 'login_failure', 'vote_success', 'vote_rejected', 'suspicious_activity', 'rate_limit_hit'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 14px',
                borderRadius: 9999,
                border: 'none',
                background: filter === f ? '#ef4444' : 'var(--surface-2)',
                color: filter === f ? '#fff' : 'var(--text-2)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f === 'all' ? 'All' : (EVENT_LABELS[f] || f)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No events for this filter
          </div>
        ) : (
          filtered.slice(0, 100).map(ev => <EventRow key={ev.id} event={ev} detailed />)
        )}
      </BottomDrawer>
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

function DotRow({ color, label, count, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '18px 20px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer'
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 9999, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 600 }}>{count}</div>
      <div style={{ color: 'var(--text-3)' }}><ChevronRight size={18} /></div>
    </div>
  )
}

function EventRow({ event, detailed }) {
  const tone = event.event_type.includes('fail') || event.event_type.includes('reject') || event.event_type.includes('suspicious') || event.event_type.includes('rate_limit')
    ? '#ef4444'
    : event.event_type.includes('success') || event.event_type.includes('verify_success')
      ? '#10b981'
      : 'var(--text-3)'

  const when = new Date(event.created_at).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div style={{
      padding: detailed ? '14px 0' : '16px 20px',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: 9999, background: tone, flexShrink: 0 }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: tone }}>
          {EVENT_LABELS[event.event_type] || event.event_type}
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 18 }}>
        {event.email_attempted || event.profile_id?.slice(0, 8) || '—'} · {when}
      </div>
      {detailed && event.details && (
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginLeft: 18, marginTop: 6, lineHeight: 1.5, fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {JSON.stringify(event.details).slice(0, 200)}
        </div>
      )}
    </div>
  )
}
