import { useState } from 'react'
import { storage, Workout } from '../data/storage'

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>(storage.getWorkouts())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: 'strength' as Workout['type'],
    duration: '60',
    notes: '',
  })

  const cycles = storage.getCycles()
  const activeCycle = cycles.find(c => c.status === 'active')

  const handleAdd = () => {
    if (!form.name) return
    const newWorkout: Workout = {
      id: Date.now().toString(),
      cycleId: activeCycle?.id ?? '',
      name: form.name,
      date: form.date,
      type: form.type,
      duration: parseInt(form.duration),
      notes: form.notes,
      completed: false,
    }
    const updated = [...workouts, newWorkout]
    setWorkouts(updated)
    storage.saveWorkouts(updated)
    setForm({ name: '', date: new Date().toISOString().split('T')[0], type: 'strength', duration: '60', notes: '' })
    setShowForm(false)
  }

  const toggleComplete = (id: string) => {
    const updated = workouts.map(w => w.id === id ? { ...w, completed: !w.completed } : w)
    setWorkouts(updated)
    storage.saveWorkouts(updated)
  }

  const handleDelete = (id: string) => {
    const updated = workouts.filter(w => w.id !== id)
    setWorkouts(updated)
    storage.saveWorkouts(updated)
  }

  const typeColor: Record<string, string> = {
    strength: '#6c63ff',
    cardio: '#ff6584',
    recovery: '#2ecc71',
    mobility: '#f39c12',
  }

  const typeEmoji: Record<string, string> = {
    strength: '💪',
    cardio: '🏃',
    recovery: '🧘',
    mobility: '🤸',
  }

  const pending = workouts.filter(w => !w.completed)
  const completed = workouts.filter(w => w.completed)

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Workouts</h1>
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
          <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Log Workout</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              placeholder="Workout name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={inputStyle}
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as Workout['type'] }))}
              style={inputStyle}
            >
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
              <option value="recovery">Recovery</option>
              <option value="mobility">Mobility</option>
            </select>
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              style={inputStyle}
            />
            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
            <button onClick={handleAdd} style={{
              background: 'var(--color-accent)',
              color: '#fff',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: '600',
              fontSize: '15px',
            }}>
              Add Workout
            </button>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-muted)', letterSpacing: '0.8px', marginBottom: '12px' }}>UPCOMING</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pending.map(w => <WorkoutCard key={w.id} workout={w} typeColor={typeColor} typeEmoji={typeEmoji} onToggle={toggleComplete} onDelete={handleDelete} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-muted)', letterSpacing: '0.8px', marginBottom: '12px' }}>COMPLETED</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...completed].reverse().map(w => <WorkoutCard key={w.id} workout={w} typeColor={typeColor} typeEmoji={typeEmoji} onToggle={toggleComplete} onDelete={handleDelete} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function WorkoutCard({
  workout, typeColor, typeEmoji, onToggle, onDelete
}: {
  workout: Workout
  typeColor: Record<string, string>
  typeEmoji: Record<string, string>
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div style={{
      background: 'var(--color-card)',
      border: `1px solid ${workout.completed ? 'var(--color-border)' : typeColor[workout.type] + '44'}`,
      borderRadius: '14px',
      padding: '14px 16px',
      opacity: workout.completed ? 0.75 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: typeColor[workout.type] + '22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
        }}>
          {typeEmoji[workout.type]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{
              fontWeight: '600',
              fontSize: '15px',
              textDecoration: workout.completed ? 'line-through' : 'none',
              color: workout.completed ? 'var(--color-muted)' : 'var(--color-text)',
            }}>{workout.name}</p>
            <span style={{
              background: typeColor[workout.type] + '22',
              color: typeColor[workout.type],
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '600',
            }}>{workout.type}</span>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '3px' }}>
            {new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {workout.duration} min
          </p>
          {workout.notes && <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginTop: '6px', fontStyle: 'italic' }}>{workout.notes}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
        <button
          onClick={() => onToggle(workout.id)}
          style={{
            flex: 1,
            background: workout.completed ? 'var(--color-surface)' : 'var(--color-accent)',
            color: workout.completed ? 'var(--color-muted)' : '#fff',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          {workout.completed ? 'Mark Pending' : 'Mark Done'}
        </button>
        <button
          onClick={() => onDelete(workout.id)}
          style={{
            background: 'var(--color-surface)',
            color: '#ff6584',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          Delete
        </button>
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
