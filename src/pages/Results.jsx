import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { ChartIcon, ChevronRight, ShieldIcon } from '../components/Icons'
import BottomDrawer from '../components/BottomDrawer'

export default function Results() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vote_elections')
      .select('id, title, status, voting_end, results_published_at')
      .in('status', ['closed', 'results_published', 'archived'])
      .order('voting_end', { ascending: false, nullsFirst: false })
    setElections(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const selected = elections.find(e => e.id === selectedId)

  return (
    <>
      <div style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
          <ChartIcon size={72} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: -0.4 }}>
          Results
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
          Compute counts and publish winners
        </p>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0 0' }} />

      {loading && (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>Loading…</div>
      )}

      {!loading && elections.length === 0 && (
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>
          No closed elections yet
        </div>
      )}

      {!loading && elections.map(e => (
        <div
          key={e.id}
          onClick={() => setSelectedId(e.id)}
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4 }}>
              {e.title}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
              {e.results_published_at
                ? 'Results published · ' + new Date(e.results_published_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
                : 'Closed · ready to publish'}
            </div>
          </div>
          <div style={{ color: 'var(--text-3)' }}><ChevronRight size={20} /></div>
        </div>
      ))}

      {selected && (
        <ResultsDrawer
          election={selected}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
        />
      )}
    </>
  )
}

function ResultsDrawer({ election, onClose, onUpdated }) {
  const [loading, setLoading] = useState(true)
  const [positions, setPositions] = useState([])
  const [counts, setCounts] = useState({})
  const [candidates, setCandidates] = useState({})
  const [published, setPublished] = useState({})
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(election.results_publish_cooldown_hours || 48)
  const [result, setResult] = useState(null)

  const load = async () => {
    setLoading(true)

    const { data: pos } = await supabase
      .from('vote_positions')
      .select('id, title, sort_order, tie_review_required')
      .eq('election_id', election.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    const { data: cands } = await supabase
      .from('vote_candidates')
      .select('id, position_id, display_name, photo_url')
      .eq('election_id', election.id)
      .eq('is_active', true)

    const { data: cts } = await supabase
      .from('vote_results_live')
      .select('position_id, candidate_id, vote_count')
      .eq('election_id', election.id)

    const { data: pub } = await supabase
      .from('vote_results_published')
      .select('id, position_id, candidate_id, vote_count_at_publish, total_votes_for_position, published_at, deletable_after, is_active, is_tie')
      .eq('election_id', election.id)
      .eq('is_active', true)

    const candGrouped = {}
    ;(cands || []).forEach(c => {
      if (!candGrouped[c.position_id]) candGrouped[c.position_id] = []
      candGrouped[c.position_id].push(c)
    })

    const countGrouped = {}
    ;(cts || []).forEach(c => {
      if (!countGrouped[c.position_id]) countGrouped[c.position_id] = {}
      countGrouped[c.position_id][c.candidate_id] = c.vote_count
    })

    const pubMap = {}
    ;(pub || []).forEach(p => { pubMap[p.position_id] = p })

    setPositions(pos || [])
    setCandidates(candGrouped)
    setCounts(countGrouped)
    setPublished(pubMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [election.id])

  const publish = async () => {
    if (!confirm(`Publish winners for all positions in "${election.title}"?`)) return
    setBusy(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { alert('Not signed in'); return }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vote-publish-results`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ election_id: election.id, cooldown_hours: cooldown })
        }
      )
      const json = await res.json()
      if (!res.ok) { alert(json.error || 'Failed'); return }
      setResult(json)
      await load()
      onUpdated?.()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const removePublished = async (pubId, reason) => {
    const { data: me } = await supabase
      .from('vote_profiles').select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user.id)
      .maybeSingle()

    await supabase.from('vote_results_published')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: me?.id,
        deletion_reason: reason
      })
      .eq('id', pubId)

    await load()
  }

  return (
    <BottomDrawer
      open
      onClose={onClose}
      icon={<ShieldIcon size={56} />}
      title={election.title}
    >
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>
      ) : (
        <>
          {positions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No positions
            </div>
          ) : positions.map(p => (
            <PositionBlock
              key={p.id}
              position={p}
              candidates={candidates[p.id] || []}
              counts={counts[p.id] || {}}
              published={published[p.id]}
              onDelete={removePublished}
            />
          ))}

          {result && (
            <div style={{
              marginTop: 20,
              padding: 16,
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 13,
              color: 'var(--text-2)'
            }}>
              {result.message}
            </div>
          )}

          <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-2)', borderRadius: 14 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 10 }}>
              Publish cooldown (hours)
            </div>
            <input
              type="number"
              value={cooldown}
              onChange={(e) => setCooldown(Number(e.target.value))}
              min={0}
              className="input-field"
            />
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
              Published winners cannot be deleted until this window passes.
            </div>
          </div>

          <div style={{ marginTop: 20, paddingBottom: 20 }}>
            <button onClick={publish} className="btn-primary" disabled={busy}>
              {busy ? 'Publishing…' : 'Publish computed winners'}
            </button>
          </div>
        </>
      )}
    </BottomDrawer>
  )
}

function PositionBlock({ position, candidates, counts, published, onDelete }) {
  const sorted = [...candidates].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
  const top = counts[sorted[0]?.id] || 0
  const tied = sorted.filter(c => (counts[c.id] || 0) === top && top > 0)
  const isTie = tied.length > 1

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11.5,
        color: 'var(--text-3)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 10
      }}>
        {position.title}
      </div>

      {published && (
        <div style={{
          padding: 14,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          marginBottom: 10
        }}>
          <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            ✓ Published
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>
            {candidates.find(c => c.id === published.candidate_id)?.display_name || '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
            {published.vote_count_at_publish} votes · published {new Date(published.published_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 10 }}>
            Deletable after {new Date(published.deletable_after).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={() => {
              const reason = prompt('Reason for deleting published result (required):')
              if (!reason?.trim()) return
              onDelete(published.id, reason.trim())
            }}
            disabled={new Date(published.deletable_after) > new Date()}
            style={{
              background: 'transparent',
              border: '1px solid #ef4444',
              borderRadius: 9999,
              padding: '8px 14px',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 600,
              cursor: new Date(published.deletable_after) > new Date() ? 'not-allowed' : 'pointer',
              opacity: new Date(published.deletable_after) > new Date() ? 0.4 : 1
            }}
          >
            {new Date(published.deletable_after) > new Date() ? 'Locked until cooldown passes' : 'Delete (requires reason)'}
          </button>
        </div>
      )}

      {isTie && (
        <div style={{
          padding: 12,
          background: 'rgba(239,68,68,0.06)',
          borderRadius: 10,
          marginBottom: 10,
          fontSize: 12.5,
          color: '#ef4444',
          fontWeight: 600
        }}>
          ⚠ Tie detected — {tied.length} candidates tied at {top} votes. Position requires review. No auto-winner.
        </div>
      )}

      {sorted.map(c => (
        <div
          key={c.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 9999,
            background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
            color: 'var(--text-3)', fontSize: 14, fontWeight: 700
          }}>
            {c.photo_url
              ? <img src={c.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : c.display_name.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{c.display_name}</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: counts[c.id] === top && top > 0 && !isTie ? '#ef4444' : 'var(--text-2)' }}>
            {counts[c.id] || 0}
          </div>
        </div>
      ))}
    </div>
  )
}
