import { useMemo } from 'react'
import { storage } from '../data/storage'

export default function Progress() {
  const workouts = storage.getWorkouts()
  const cycles = storage.getCycles()

  const completed = useMemo(() => workouts.filter(w => w.completed), [workouts])

  const byType = useMemo(() => {
    const counts: Record<string, number> = { strength: 0, cardio: 0, recovery: 0, mobility: 0 }
    completed.forEach(w => { counts[w.type] = (counts[w.type] ?? 0) + 1 })
    return counts
  }, [completed])

  const totalMinutes = useMemo(() => completed.reduce((sum, w) => sum + w.duration, 0), [completed])
  const avgDuration = completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0

  const completedCycles = cycles.filter(c => c.status === 'completed').length
  const activeCycles = cycles.filter(c => c.status === 'active').length

  const typeColor: Record<string, string> = {
    strength: '#6c63ff',
    cardio: '#ff6584',
    recovery: '#2ecc71',
    mobility: '#f39c12',
  }

  const maxCount = Math.max(...Object.values(byType), 1)

  const streak = useMemo(() => {
    const dates = completed.map(w => w.date).sort().reverse()
    if (dates.length === 0) return 0
    let s = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
      if (diff <= 2) s++
      else break
    }
    return s
  }, [completed])

  return (
    <div style={{ padding: '24px 16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Progress</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Total Workouts" value={completed.length} color="#6c63ff" />
        <StatCard label="Total Hours" value={(totalMinutes / 60).toFixed(1)} color="#ff6584" />
        <StatCard label="Avg Duration" value={`${avgDuration}m`} color="#2ecc71" />
        <StatCard label="Streak" value={`${streak}x`} color="#f39c12" />
      </div>

      <div style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Workout Types</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Object.entries(byType).map(([type, count]) => (
            <div key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: typeColor[type], fontWeight: '500', fontSize: '14px', textTransform: 'capitalize' }}>{type}</span>
                <span style={{ color: 'var(--color-muted)', fontSize: '14px' }}>{count}</span>
              </div>
              <div style={{ background: 'var(--color-border)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(count / maxCount) * 100}%`,
                  height: '100%',
                  background: typeColor[type],
                  borderRadius: '4px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '20px',
      }}>
        <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Cycles Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <MiniStat label="Active" value={activeCycles} color="#2ecc71" />
          <MiniStat label="Completed" value={completedCycles} color="#6c63ff" />
          <MiniStat label="Planned" value={cycles.filter(c => c.status === 'planned').length} color="#f39c12" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '14px',
      padding: '16px',
    }}>
      <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: '700', color }}>{value}</p>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '22px', fontWeight: '700', color }}>{value}</p>
      <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '2px' }}>{label}</p>
    </div>
  )
}
