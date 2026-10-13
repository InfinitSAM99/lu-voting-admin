import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'

export default function Dashboard() {
  const [stats, setStats] = useState({ elections: 0, applications: 0, candidates: 0, votes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const [e, a, c, v] = await Promise.all([
        supabase.from('vote_elections').select('*', { count: 'exact', head: true }),
        supabase.from('vote_candidate_applications').select('*', { count: 'exact', head: true }),
        supabase.from('vote_candidates').select('*', { count: 'exact', head: true }),
        supabase.from('vote_participation').select('*', { count: 'exact', head: true })
      ])
      if (mounted) {
        setStats({
          elections: e.count || 0,
          applications: a.count || 0,
          candidates: c.count || 0,
          votes: v.count || 0
        })
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <>
      <div style={{ padding: '28px 20px 8px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6, letterSpacing: -0.4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          Overview of election activity
        </p>
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {loading ? (
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            <Stat label="Elections" value={stats.elections} />
            <Stat label="Applications" value={stats.applications} />
            <Stat label="Approved candidates" value={stats.candidates} />
            <Stat label="Total votes cast" value={stats.votes} />
          </>
        )}
      </div>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        padding: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>{value}</div>
    </div>
  )
}
