import React, { useEffect, useMemo, useState } from 'react'

// simple localStorage hook
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initialValue } catch { return initialValue }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }, [key, value])
  return [value, setValue]
}

const priorities = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function App() {
  return (
    <div>
      <div className="header">
        <div className="container">
          <div className="title">
            <div className="logo">PP</div>
            <div>
              <div style={{fontWeight:600}}>Pocket Planner</div>
              <div className="small">Step 1: Tasks — local-first.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{paddingTop:16}}>
        <TasksPane />
      </div>

      <div className="container small" style={{textAlign:'center', padding:'24px 0'}}>
        Next we’ll add Notes & Expenses.
      </div>
    </div>
  )
}

function TasksPane() {
  const [tasks, setTasks] = useLocalStorage('pp_tasks', [])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [due, setDue] = useState('')
  const [prio, setPrio] = useState('medium')

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ by: 'created', dir: 'desc' })
  const [filter, setFilter] = useState('all')

  // editing state
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ title: '', desc: '', prio: 'medium', due: '' })

  function addTask() {
    if (!title.trim()) return
    const t = {
      id: crypto.randomUUID(),
      title: title.trim(),
      desc: desc.trim(),
      createdAt: Date.now(),
      due: due || null,
      prio,
      done: false,
    }
    setTasks([t, ...tasks])
    setTitle(''); setDesc(''); setDue(''); setPrio('medium')
  }

  function toggle(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }
  function remove(id) {
    setTasks(tasks.filter(t => t.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function startEdit(t) {
    setEditingId(t.id)
    setDraft({
      title: t.title,
      desc: t.desc || '',
      prio: t.prio,
      due: t.due || '',
    })
  }
  function cancelEdit() {
    setEditingId(null)
  }
  function saveEdit(id) {
    setTasks(tasks.map(t => t.id === id ? {
      ...t,
      title: (draft.title || '').trim() || t.title,
      desc: (draft.desc || '').trim(),
      prio: draft.prio,
      due: draft.due || null,
    } : t))
    setEditingId(null)
  }

  // Keyboard shortcuts while editing: Enter saves (Ctrl+Enter in textarea), Esc cancels
  function handleDraftKeyDown(e, id) {
    if (e.key === 'Enter' && (e.target.tagName !== 'TEXTAREA' || e.ctrlKey)) {
      e.preventDefault()
      saveEdit(id)
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  const visible = useMemo(() => {
    const q = query.toLowerCase()
    let list = tasks.filter(t =>
      t.title.toLowerCase().includes(q) || (t.desc || '').toLowerCase().includes(q)
    )
    if (filter !== 'all') list = list.filter(t => (filter === 'open' ? !t.done : t.done))
    list.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      switch (sort.by) {
        case 'due': return dir * ((a.due || '9999-12-31').localeCompare(b.due || '9999-12-31'))
        case 'priority': {
          const rank = { high: 3, medium: 2, low: 1 }
          return dir * (rank[a.prio] - rank[b.prio])
        }
        default: return dir * (a.createdAt - b.createdAt)
      }
    })
    return list
  }, [tasks, query, filter, sort])

  const completion = Math.round((tasks.filter(t => t.done).length / Math.max(tasks.length, 1)) * 100)

  return (
    <div className="card">
      <div className="card-head">
        <h2>Tasks</h2>
        <div className="row">
          <input className="input" placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} style={{ width: 160 }} />
          <select className="select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="done">Done</option>
          </select>
          <button className="button ghost" onClick={() => setSort(s => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }))}>
            {sort.dir === 'asc' ? 'Asc' : 'Desc'}
          </button>
          <select className="select" value={sort.by} onChange={e => setSort(s => ({ ...s, by: e.target.value }))}>
            <option value="created">Created</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      <div className="card-body">
        {/* Add Task */}
        <div className="row" style={{ gap: 12, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label className="small">Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs doing?" />
          </div>
          <div style={{ flex: '1 1 100%', marginTop: 8 }}>
            <label className="small">Description</label>
            <textarea
              className="input"
              rows="3"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Add details here…"
              style={{ resize: 'vertical' }}
            />
          </div>
          <div>
            <label className="small">Priority</label>
            <select className="select" value={prio} onChange={e => setPrio(e.target.value)}>
              {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="small">Due</label>
            <input className="input" type="date" value={due} onChange={e => setDue(e.target.value)} />
          </div>
          <button className="button" onClick={addTask}>Add</button>
        </div>

        {/* Task List */}
        <ul className="list">
          {visible.map(t => (
            <li key={t.id} className="item">
              <div className="row" style={{ alignItems: 'flex-start', flex: 1 }}>
                <button className="button ghost" onClick={() => toggle(t.id)}>{t.done ? '✓' : '○'}</button>

                {/* View mode */}
                {editingId !== t.id && (
                  <div style={{ flex: 1 }}>
                    <div className="row" style={{ alignItems: 'center' }}>
                      <p style={{ margin: 0, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#64748b' : 'inherit' }}>
                        {t.title}
                      </p>
                      <span className={`badge ${t.prio === 'high' ? 'danger' : t.prio === 'medium' ? 'neutral' : 'outline'}`} style={{ textTransform: 'capitalize' }}>
                        {t.prio}
                      </span>
                      {t.due && <span className="badge outline">Due {t.due}</span>}
                    </div>

                    {t.desc && (
                      <p className="small" style={{ marginTop: 4, color: '#475569', whiteSpace: 'pre-wrap' }}>
                        {t.desc}
                      </p>
                    )}
                    <p className="small" style={{ marginTop: 4 }}>Added {new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                )}

                {/* Edit mode */}
                {editingId === t.id && (
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div>
                        <label className="small">Title</label>
                        <input
                          className="input"
                          value={draft.title}
                          onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                          onKeyDown={e => handleDraftKeyDown(e, t.id)}
                        />
                      </div>
                      <div>
                        <label className="small">Description</label>
                        <textarea
                          className="input"
                          rows="3"
                          value={draft.desc}
                          onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))}
                          onKeyDown={e => handleDraftKeyDown(e, t.id)}
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <div>
                          <label className="small">Priority</label>
                          <select
                            className="select"
                            value={draft.prio}
                            onChange={e => setDraft(d => ({ ...d, prio: e.target.value }))}
                            onKeyDown={e => handleDraftKeyDown(e, t.id)}
                          >
                            {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="small">Due</label>
                          <input
                            className="input"
                            type="date"
                            value={draft.due}
                            onChange={e => setDraft(d => ({ ...d, due: e.target.value }))}
                            onKeyDown={e => handleDraftKeyDown(e, t.id)}
                          />
                        </div>
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <button className="button" onClick={() => saveEdit(t.id)}>Save</button>
                        <button className="button ghost" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right-side actions */}
              <div className="row">
                {editingId !== t.id && (
                  <button
                    className="button ghost"
                    onClick={() => startEdit(t)}
                    aria-label="Edit task"
                    title="Edit"
                  >
                    ✏️
                  </button>
                )}
                <button className="button ghost" onClick={() => remove(t.id)}>🗑</button>
              </div>
            </li>
          ))}

          {visible.length === 0 && (
            <li className="small" style={{ textAlign: 'center', padding: 16 }}>No tasks yet.</li>
          )}
        </ul>

        <div style={{ marginTop: 12 }}>
          <div className="small">Completion</div>
          <div className="progress"><div style={{ width: `${completion}%` }} /></div>
          <div className="small" style={{ marginTop: 4 }}>{completion}% done</div>
        </div>
      </div>
    </div>
  )
}
