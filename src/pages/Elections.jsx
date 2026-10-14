import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { ChevronRight, CalendarIcon } from '../components/Icons'

const STATUS_OPTIONS = [
  'draft',
  'candidate_registration',
  'scheduled',
  'open',
  'paused',
  'closed',
  'results_published',
  'archived'
]

const STATUS_LABELS = {
  draft: 'Draft',
  candidate_registration: 'Registration open',
  scheduled: 'Scheduled',
  open: 'Voting open',
  paused: 'Paused',
  closed: 'Voting closed',
  results_published: 'Results published',
  archived: 'Archived'
}

const STATUS_COLORS = {
  draft: 'var(--text-3)',
  candidate_registration: '#ef4444',
  scheduled: '#f59e0b',
  open: '#10b981',
  paused: '#f59e0b',
  closed: 'var(--text-3)',
  results_published: '#10b981',
  archived: 'var(--text-3)'
}

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Elections() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vote_elections')
      .select('*')
      .order('created_at', { ascending: false })
    setElections(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const selected = elections.find(e => e.id === selectedId)

  return (
    <>
      <div style={{ padding: '28px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6, letterSpacing: -0.4 }}>
            Elections
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>
            Create and manage elections
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            background: '#ef4444',
            border: 'none',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 600,
            padding: '10px 16px',
            borderRadius: 9999,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          + New
        </button>
      </div>

      {loading && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
          Loading…
        </div>
      )}

      {!loading && elections.length === 0 && (
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: '#ef4444', marginBottom: 20 }}>
            <CalendarIcon size={64} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>No elections yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--text-3)' }}>Tap "+ New" to create one</div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div
                style={{
                  width: 8, height: 8, borderRadius: 9999,
                  background: STATUS_COLORS[e.status] || 'var(--text-3)'
                }}
              />
              <span style={{
                fontSize: 11,
                color: STATUS_COLORS[e.status] || 'var(--text-3)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.6
              }}>
                {STATUS_LABELS[e.status] || e.status}
              </span>
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4, letterSpacing: -0.2 }}>
              {e.title}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
              {e.academic_year || 'No year set'}
            </div>
          </div>
          <div style={{ color: 'var(--text-3)' }}><ChevronRight size={20} /></div>
        </div>
      ))}

      <CreateElectionDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); load() }}
      />

      {selected && (
        <ElectionDetailDrawer
          election={selected}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
        />
      )}
    </>
  )
}

/* ========================================================= */
/* CREATE ELECTION DRAWER                                     */
/* ========================================================= */

function CreateElectionDrawer({ open, onClose, onCreated }) {
  const [form, setForm] = useState(() => blank())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function blank() {
    return {
      title: '',
      description: '',
      election_type: 'student_union',
      academic_year: '',
      candidate_registration_start: '',
      candidate_registration_end: '',
      voting_start: '',
      voting_end: '',
      turnout_visible_during_voting: true,
      results_visible_during_voting: false,
      results_publish_cooldown_hours: 48
    }
  }

  useEffect(() => { if (open) { setForm(blank()); setError('') } }, [open])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setError('')
    if (!form.title.trim()) return setError('Title is required')

    setBusy(true)
    const { error: err } = await supabase
      .from('vote_elections')
      .insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        election_type: form.election_type,
        academic_year: form.academic_year.trim() || null,
        status: 'draft',
        candidate_registration_start: form.candidate_registration_start || null,
        candidate_registration_end: form.candidate_registration_end || null,
        voting_start: form.voting_start || null,
        voting_end: form.voting_end || null,
        turnout_visible_during_voting: form.turnout_visible_during_voting,
        results_visible_during_voting: form.results_visible_during_voting,
        results_publish_cooldown_hours: Number(form.results_publish_cooldown_hours) || 48
      })
    setBusy(false)
    if (err) { setError(err.message); return }
    onCreated?.()
  }

  if (!open) return null

  return (
    <DrawerShell onClose={onClose} title="New election">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Title">
          <input className="input-field" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. LUSA General Election 2026" />
        </Field>

        <Field label="Description">
          <textarea className="input-field" value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} style={{ resize: 'vertical', fontFamily: 'inherit', minHeight: 80 }} />
        </Field>

        <Field label="Election type">
          <select className="input-field" value={form.election_type} onChange={(e) => update('election_type', e.target.value)}>
            <option value="student_union">Student union</option>
            <option value="faculty">Faculty</option>
            <option value="school_rep">School rep</option>
            <option value="parliamentary">Parliamentary</option>
            <option value="special">Special</option>
            <option value="custom">Custom</option>
          </select>
        </Field>

        <Field label="Academic year">
          <input className="input-field" value={form.academic_year} onChange={(e) => update('academic_year', e.target.value)} placeholder="e.g. 2025/2026" />
        </Field>

        <div style={{ height: 4 }} />
        <GroupLabel>Candidate registration</GroupLabel>
        <Field label="Opens">
          <input type="datetime-local" className="input-field" value={form.candidate_registration_start} onChange={(e) => update('candidate_registration_start', e.target.value)} />
        </Field>
        <Field label="Closes">
          <input type="datetime-local" className="input-field" value={form.candidate_registration_end} onChange={(e) => update('candidate_registration_end', e.target.value)} />
        </Field>

        <div style={{ height: 4 }} />
        <GroupLabel>Voting</GroupLabel>
        <Field label="Opens">
          <input type="datetime-local" className="input-field" value={form.voting_start} onChange={(e) => update('voting_start', e.target.value)} />
        </Field>
        <Field label="Closes">
          <input type="datetime-local" className="input-field" value={form.voting_end} onChange={(e) => update('voting_end', e.target.value)} />
        </Field>

        <div style={{ height: 4 }} />
        <GroupLabel>Visibility</GroupLabel>

        <Toggle
          label="Show turnout during voting"
          subtitle="Students see total votes cast, not candidate counts"
          value={form.turnout_visible_during_voting}
          onChange={(v) => update('turnout_visible_during_voting', v)}
        />

        <Toggle
          label="Show candidate counts during voting"
          subtitle="Live per-candidate counts visible to students"
          value={form.results_visible_during_voting}
          onChange={(v) => update('results_visible_during_voting', v)}
        />

        <Field label="Publish cooldown (hours)">
          <input type="number" className="input-field" value={form.results_publish_cooldown_hours} onChange={(e) => update('results_publish_cooldown_hours', e.target.value)} min={0} />
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
            How long after publishing before results can be deleted
          </div>
        </Field>

        {error && (
          <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 12, color: '#ef4444', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button onClick={submit} className="btn-primary" disabled={busy}>
          {busy ? 'Creating…' : 'Create election'}
        </button>
      </div>
    </DrawerShell>
  )
}

/* ========================================================= */
/* DETAIL DRAWER                                              */
/* ========================================================= */

function ElectionDetailDrawer({ election, onClose, onUpdated }) {
  const [tab, setTab] = useState('details')

  return (
    <DrawerShell onClose={onClose} title={election.title}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['details', 'positions'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              border: 'none',
              background: tab === t ? '#ef4444' : 'var(--surface-2)',
              color: tab === t ? '#fff' : 'var(--text-2)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'details' && <DetailsTab election={election} onUpdated={onUpdated} />}
      {tab === 'positions' && <PositionsTab election={election} />}
    </DrawerShell>
  )
}

function DetailsTab({ election, onUpdated }) {
  const [form, setForm] = useState(() => ({
    title: election.title || '',
    description: election.description || '',
    academic_year: election.academic_year || '',
    status: election.status,
    candidate_registration_start: toLocalInput(election.candidate_registration_start),
    candidate_registration_end: toLocalInput(election.candidate_registration_end),
    voting_start: toLocalInput(election.voting_start),
    voting_end: toLocalInput(election.voting_end),
    turnout_visible_during_voting: election.turnout_visible_during_voting,
    results_visible_during_voting: election.results_visible_during_voting,
    results_publish_cooldown_hours: election.results_publish_cooldown_hours
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  const save = async () => {
    setError(''); setBusy(true)
    const { error: err } = await supabase
      .from('vote_elections')
      .update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        academic_year: form.academic_year.trim() || null,
        status: form.status,
        candidate_registration_start: form.candidate_registration_start || null,
        candidate_registration_end: form.candidate_registration_end || null,
        voting_start: form.voting_start || null,
        voting_end: form.voting_end || null,
        turnout_visible_during_voting: form.turnout_visible_during_voting,
        results_visible_during_voting: form.results_visible_during_voting,
        results_publish_cooldown_hours: Number(form.results_publish_cooldown_hours) || 48
      })
      .eq('id', election.id)
    setBusy(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    onUpdated?.()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field label="Title">
        <input className="input-field" value={form.title} onChange={(e) => update('title', e.target.value)} />
      </Field>

      <Field label="Description">
        <textarea className="input-field" value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} style={{ resize: 'vertical', fontFamily: 'inherit', minHeight: 80 }} />
      </Field>

      <Field label="Academic year">
        <input className="input-field" value={form.academic_year} onChange={(e) => update('academic_year', e.target.value)} />
      </Field>

      <Field label="Status">
        <select className="input-field" value={form.status} onChange={(e) => update('status', e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </Field>

      <div style={{ height: 4 }} />
      <GroupLabel>Candidate registration</GroupLabel>
      <Field label="Opens">
        <input type="datetime-local" className="input-field" value={form.candidate_registration_start} onChange={(e) => update('candidate_registration_start', e.target.value)} />
      </Field>
      <Field label="Closes">
        <input type="datetime-local" className="input-field" value={form.candidate_registration_end} onChange={(e) => update('candidate_registration_end', e.target.value)} />
      </Field>

      <div style={{ height: 4 }} />
      <GroupLabel>Voting</GroupLabel>
      <Field label="Opens">
        <input type="datetime-local" className="input-field" value={form.voting_start} onChange={(e) => update('voting_start', e.target.value)} />
      </Field>
      <Field label="Closes">
        <input type="datetime-local" className="input-field" value={form.voting_end} onChange={(e) => update('voting_end', e.target.value)} />
      </Field>

      <div style={{ height: 4 }} />
      <GroupLabel>Visibility</GroupLabel>

      <Toggle
        label="Show turnout during voting"
        value={form.turnout_visible_during_voting}
        onChange={(v) => update('turnout_visible_during_voting', v)}
      />

      <Toggle
        label="Show candidate counts during voting"
        value={form.results_visible_during_voting}
        onChange={(v) => update('results_visible_during_voting', v)}
      />

      <Field label="Publish cooldown (hours)">
        <input type="number" className="input-field" value={form.results_publish_cooldown_hours} onChange={(e) => update('results_publish_cooldown_hours', e.target.value)} min={0} />
      </Field>

      {error && (
        <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 12, color: '#ef4444', fontSize: 13 }}>
          {error}
        </div>
      )}

      {saved && (
        <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 12, color: '#10b981', fontSize: 13 }}>
          Saved
        </div>
      )}

      <button onClick={save} className="btn-primary" disabled={busy}>
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}

/* ========================================================= */
/* POSITIONS TAB                                              */
/* ========================================================= */

function PositionsTab({ election }) {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [templates, setTemplates] = useState([])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vote_positions')
      .select('*')
      .eq('election_id', election.id)
      .order('sort_order', { ascending: true })
    setPositions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    supabase
      .from('vote_position_templates')
      .select('id, title, scope, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setTemplates(data || []))
  }, [election.id])

  const remove = async (id) => {
    if (!confirm('Remove this position?')) return
    await supabase.from('vote_positions').delete().eq('id', id)
    load()
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
          {positions.length} {positions.length === 1 ? 'position' : 'positions'}
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            background: '#ef4444', border: 'none', color: '#fff',
            fontSize: 13, fontWeight: 600, padding: '8px 14px',
            borderRadius: 9999, cursor: 'pointer'
          }}
        >
          + Add
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
      ) : positions.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          No positions yet
        </div>
      ) : (
        <div>
          {positions.map(p => (
            <div
              key={p.id}
              style={{
                padding: '14px 0',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {p.max_selections} seat{p.max_selections !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={() => remove(p.id)}
                style={{
                  background: 'transparent', border: 'none', color: '#ef4444',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <AddPositionDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        electionId={election.id}
        templates={templates}
        currentSortOrder={positions.length + 1}
        onAdded={() => { setAddOpen(false); load() }}
      />
    </>
  )
}

function AddPositionDrawer({ open, onClose, electionId, templates, currentSortOrder, onAdded }) {
  const [mode, setMode] = useState('template')
  const [templateId, setTemplateId] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [maxSelections, setMaxSelections] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setMode('template')
      setTemplateId('')
      setCustomTitle('')
      setCustomDescription('')
      setMaxSelections(1)
      setError('')
    }
  }, [open])

  const submit = async () => {
    setError('')
    let title, description

    if (mode === 'template') {
      const t = templates.find(x => x.id === templateId)
      if (!t) return setError('Pick a template')
      title = t.title
      description = t.description
    } else {
      if (!customTitle.trim()) return setError('Title is required')
      title = customTitle.trim()
      description = customDescription.trim() || null
    }

    setBusy(true)
    const { error: err } = await supabase
      .from('vote_positions')
      .insert({
        election_id: electionId,
        title,
        description,
        sort_order: currentSortOrder,
        max_selections: Number(maxSelections) || 1,
        is_active: true
      })
    setBusy(false)
    if (err) {
      if (err.code === '23505') return setError('That position already exists in this election')
      return setError(err.message)
    }
    onAdded?.()
  }

  if (!open) return null

  return (
    <DrawerShell onClose={onClose} title="Add position" nested>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setMode('template')}
          style={{
            flex: 1, padding: '10px', borderRadius: 9999,
            border: 'none',
            background: mode === 'template' ? '#ef4444' : 'var(--surface-2)',
            color: mode === 'template' ? '#fff' : 'var(--text-2)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}
        >
          From template
        </button>
        <button
          onClick={() => setMode('custom')}
          style={{
            flex: 1, padding: '10px', borderRadius: 9999,
            border: 'none',
            background: mode === 'custom' ? '#ef4444' : 'var(--surface-2)',
            color: mode === 'custom' ? '#fff' : 'var(--text-2)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}
        >
          Custom
        </button>
      </div>

      {mode === 'template' ? (
        <Field label="Template">
          <select className="input-field" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Pick a position…</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.title} · {t.scope}</option>
            ))}
          </select>
        </Field>
      ) : (
        <>
          <Field label="Title">
            <input className="input-field" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="e.g. Sports Captain" />
          </Field>
          <div style={{ height: 16 }} />
          <Field label="Description (optional)">
            <textarea className="input-field" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} rows={3} style={{ resize: 'vertical', fontFamily: 'inherit', minHeight: 80 }} />
          </Field>
        </>
      )}

      <div style={{ height: 16 }} />

      <Field label="Seats (max selections)">
        <input type="number" className="input-field" value={maxSelections} onChange={(e) => setMaxSelections(e.target.value)} min={1} />
      </Field>

      <div style={{ height: 20 }} />

      {error && (
        <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 12, color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <button onClick={submit} className="btn-primary" disabled={busy}>
        {busy ? 'Adding…' : 'Add position'}
      </button>
    </DrawerShell>
  )
}

/* ========================================================= */
/* SHARED                                                     */
/* ========================================================= */

function DrawerShell({ onClose, title, children, nested }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: nested ? 200 : 100 }} />
      <div
        style={{
          position: 'fixed',
          left: 0, right: 0, bottom: 0,
          zIndex: nested ? 201 : 101,
          background: '#000',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -16px 40px rgba(0,0,0,0.6)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 0)'
        }}
      >
        <div style={{ padding: '14px 20px 10px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 44, height: 4, borderRadius: 9999, background: 'var(--border)' }} />
        </div>

        {title && (
          <div style={{ padding: '16px 24px 20px', fontSize: 19, fontWeight: 700, letterSpacing: -0.2 }}>
            {title}
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 32px', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, color: 'var(--text-3)', marginBottom: 8, fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function GroupLabel({ children }) {
  return (
    <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>
      {children}
    </div>
  )
}

function Toggle({ label, subtitle, value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'var(--surface-2)',
        borderRadius: 12,
        cursor: 'pointer',
        gap: 16
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      <div
        style={{
          width: 44,
          height: 26,
          borderRadius: 9999,
          background: value ? '#ef4444' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.15s',
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: 20, height: 20, borderRadius: 9999,
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: value ? 21 : 3,
            transition: 'left 0.15s'
          }}
        />
      </div>
    </div>
  )
}
