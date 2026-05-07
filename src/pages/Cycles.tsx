import { useState } from 'react'
import { storage, Cycle } from '../data/storage'

export default function Cycles() {
  const [cycles, setCycles] = useState<Cycle[]>(storage.getCycles())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', goal: '', weeks: '6', startDate: '' })

  const handleAdd = () => {
    if (!form.name || !form.startDate) return
    const start = new Date(form.startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + parseInt(form.weeks) * 7)
    const newCycle: Cycle = {
      id: Date.now().toString(),
      name: form.name,
      goal: form.goal,
      startDate: form.startDate,
      endDate: end.toISOString().split('T')[0],
      weeks: parseInt(form.weeks),
      currentWeek: 0,
      status: 'planned',
    }
    const updated = [...cycles, newCycle]
    setCycles(updated)
    storage.saveCycles(updated)
    setForm({ name: '', goal: '', weeks: '6', startDate: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = cycles.filter(c => c.id !== id)
    setCycles(updated)
    storage.saveCycles(updated)
  }

  const statusColor: Record<string, string> = {
    active: '#2ecc71',
    completed: '#6c63ff',
    planned: '#f39c12',
  }

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Cycles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            borderRadius: '10px',
            padding: '8px 16px',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          {showForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>New Cycle</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              placeholder="Cycle name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Goal (optional)"
              value={form.goal}
              onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              style={inputStyle}
            />
            <input
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ color: 'var(--color-muted)', fontSize: '14px', minWidth: '70px' }}>Weeks:</label>
              <select
                value={form.weeks}
                onChange={e => setForm(f => ({ ...f, weeks: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }}
              >
                {[4, 6, 8, 10, 12].map(w => (
                  <option key={w} value={w}>{w} weeks</option>
                ))}
              </select>
            </div>
            <button onClick={handleAdd} style={{
              background: 'var(--color-accent)',
              color: '#fff',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: '600',
              fontSize: '15px',
            }}>
              Create Cycle
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {cycles.map(cycle => (
          <div key={cycle.id} style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '2px' }}>{cycle.name}</h3>
                {cycle.goal && <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>{cycle.goal}</p>}
              </div>
              <span style={{
                background: statusColor[cycle.status] + '22',
                color: statusColor[cycle.status],
                borderRadius: '8px',
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: '600',
                marginLeft: '8px',
              }}>
                {cycle.status}
              </span>
            </div>
            <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginBottom: '10px' }}>
              {new Date(cycle.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(cycle.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {cycle.weeks} weeks
            </p>
            {cycle.status === 'active' && (
              <div>
                <div style={{ background: 'var(--color-border)', borderRadius: '4px', height: '5px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{
                    width: `${Math.round((cycle.currentWeek / cycle.weeks) * 100)}%`,
                    height: '100%',
                    background: 'var(--color-accent)',
                    borderRadius: '4px',
                  }} />
                </div>
                <p style={{ color: 'var(--color-muted)', fontSize: '12px' }}>
                  Week {cycle.currentWeek} of {cycle.weeks}
                </p>
              </div>
            )}
            <button
              onClick={() => handleDelete(cycle.id)}
              style={{
                marginTop: '12px',
                background: 'none',
                color: '#ff6584',
                fontSize: '13px',
                padding: '0',
                fontWeight: '500',
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '12px 14px',
  color: 'var(--color-text)',
  fontSize: '15px',
  width: '100%',
}
