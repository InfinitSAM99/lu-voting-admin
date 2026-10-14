import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'
import { HomeIcon, VoteIcon, UsersIcon, ShieldIcon, ChartIcon, ChevronRight } from '../components/Icons'

export default function Dashboard() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    elections: 0,
    openElections: 0,
    pendingVerifications: 0,
    pendingApplications: 0,
    verifiedVoters: 0,
    totalVotes: 0,
    bannedUsers: 0,
    appealsPending: 0
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [activeElections, setActiveElections] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)

      const [
        electionsAll,
        openElections,
        pendingVer,
        pendingApps,
        verifiedVoters,
        votes,
        banned,
        appeals,
        events,
        active
      ] = await Promise.all([
        supabase.from('vote_elections').select('*', { count: 'exact', head: true }),
        supabase.from('vote_elections').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('vote_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('vote_candidate_applications').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
        supabase.from('vote_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('vote_participation').select('*', { count: 'exact', head: true }),
        supabase.from('vote_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'banned'),
        supabase.from('vote_profiles').select('*', { count: 'exact', head: true }).in('appeal_status', ['selfie_submitted', 'message_submitted']),
        supabase.from('vote_security_events').select('event_type, created_at, email_attempted').order('created_at', { ascending: false }).limit(6),
        supabase.from('vote_elections').select('id, title, status, voting_start, voting_end').in('status', ['open', 'candidate_registration', 'scheduled']).order('voting_start', { ascending: true }).limit(5)
      ])

      if (mounted) {
        setStats({
          elections: electionsAll.count || 0,
          openElections: openElections.count || 0,
          pendingVerifications: pendingVer.count || 0,
          pendingApplications: pendingApps.count || 0,
          verifiedVoters: verifiedVoters.count || 0,
          totalVotes: votes.count || 0,
          bannedUsers: banned.count || 0,
          appealsPending: appeals.count || 0
        })
        setRecentEvents(events.data || [])
        setActiveElections(active.data || [])
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>Loading…</div>
  }

  const attentionCount = stats.pendingVerifications + stats.pendingApplications + stats.appealsPending

  return (
    <>
      <div style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
          <HomeIcon size={72} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: -0.4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          Overview of election activity
        </p>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0 0' }} />

      {attentionCount > 0 && (
        <>
          <SectionLabel>Needs your attention</SectionLabel>
          {stats.pendingVerifications > 0 && (
            <AttentionRow
              color="#ef4444"
              label="Voter verifications"
              subtitle="Students waiting to be verified"
              count={stats.pendingVerifications}
              onClick={() => nav('/applications')}
            />
          )}
          {stats.pendingApplications > 0 && (
            <AttentionRow
              color="#ef4444"
              label="Candidate applications"
              subtitle="Students wanting to run"
              count={stats.pendingApplications}
              onClick={() => nav('/applications')}
            />
          )}
          {stats.appealsPending > 0 && (
            <AttentionRow
              color="#f59e0b"
              label="Ban appeals"
              subtitle="Identity or appeal review pending"
              count={stats.appealsPending}
              onClick={() => nav('/appeals')}
            />
          )}
        </>
      )}

      <SectionLabel>System status</SectionLabel>

      <StatRow
        icon={<VoteIcon size={20} />}
        label="Elections"
        primary={stats.elections}
        secondary={`${stats.openElections} open`}
        onClick={() => nav('/elections')}
      />
      <StatRow
        icon={<UsersIcon size={20} />}
        label="Verified voters"
        primary={stats.verifiedVoters}
        secondary={stats.bannedUsers > 0 ? `${stats.bannedUsers} banned` : null}
        onClick={() => nav('/students')}
      />
      <StatRow
        icon={<ChartIcon size={20} />}
        label="Total votes cast"
        primary={stats.totalVotes}
        onClick={() => nav('/results')}
      />
      <StatRow
        icon={<ShieldIcon size={20} />}
        label="Security events"
        primary={recentEvents.length}
        secondary="Recent activity"
        onClick={() => nav('/security')}
      />

      {activeElections.length > 0 && (
        <>
          <SectionLabel>Active elections</SectionLabel>
          {activeElections.map(e => (
            <div
              key={e.id}
              onClick={() => nav('/elections')}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>{e.title}</div>
                <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {e.status.replace(/_/g, ' ')}
                </div>
              </div>
              <div style={{ color: 'var(--text-3)' }}><ChevronRight size={18} /></div>
            </div>
          ))}
        </>
      )}

      {recentEvents.length > 0 && (
        <>
          <SectionLabel>Recent activity</SectionLabel>
          {recentEvents.map((ev, i) => (
            <div key={i} style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 9999, background: '#ef4444', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                {ev.event_type.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                {new Date(ev.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ height: 40 }} />
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

function AttentionRow({ color, label, subtitle, count, onClick }) {
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{subtitle}</div>}
      </div>
      <div style={{ fontSize: 16, color: '#ef4444', fontWeight: 700 }}>{count}</div>
      <div style={{ color: 'var(--text-3)' }}><ChevronRight size={18} /></div>
    </div>
  )
}

function StatRow({ icon, label, primary, secondary, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      cursor: 'pointer'
    }}>
      <div style={{ color: 'var(--text-3)' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {secondary && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{secondary}</div>}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{primary}</div>
      <div style={{ color: 'var(--text-3)' }}><ChevronRight size={18} /></div>
    </div>
  )
}
