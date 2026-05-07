import { useMemo } from 'react'
import { storage } from '../data/storage'
import { Page } from '../App'

interface DashboardProps {
  onNavigate: (page: Page) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const cycles = storage.getCycles()
  const workouts = storage.getWorkouts()

  const activeCycle = useMemo(() => cycles.find(c => c.status === 'active'), [cycles])
  const recentWorkouts = useMemo(
    () => workouts.filter(w => w.completed).slice(-3).reverse(),
    [workouts]
  )
  const upcomingWorkout = useMemo(
    () => workouts.find(w => !w.completed),
    [workouts]
  )
  const totalCompleted = workouts.filter(w => w.completed).length

  const weekProgress = activeCycle
    ? Math.round((activeCycle.currentWeek / activeCycle.weeks) * 100)
    : 0

  const typeColor: Record<string, string> = {
    strength: '#6c63ff',
    cardio: '#ff6584',
    recovery: '#2ecc71',
    mobility: '#f39c12',
  }

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-muted)', fontSize: '14px', marginBottom: '4px' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>
          Your Fitness Hub
        </h1>
      </div>

      {activeCycle && (
        <div style={{
          background: 'linear-gradient(135deg, #6c63ff22, #6c63ff08)',
          border: '1px solid #6c63ff44',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ color: 'var(--color-accent)', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Active Cycle</p>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{activeCycle.name}</h2>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginTop: '2px' }}>{activeCycle.goal}</p>
            </div>
            <span style={{
              background: 'var(--color-accent)',
              color: '#fff',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: '600',
            }}>
              Week {activeCycle.currentWeek}/{activeCycle.weeks}
            </span>
          </div>
          <div style={{ background: 'var(--color-border)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${weekProgress}%`,
              height: '100%',
              background: 'var(--color-accent)',
              borderRadius: '4px',
              transition: 'width 0.6s ease',
            }} />
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '8px' }}>
            {weekProgress}% through cycle
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Workouts Done" value={totalCompleted} accent="#6c63ff" />
        <StatCard label="Active Cycle" value={activeCycle ? '1' : '0'} accent="#2ecc71" />
      </div>

      {upcomingWorkout && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-muted)' }}>NEXT UP</h3>
          <div
            onClick={() => onNavigate('workouts')}
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: typeColor[upcomingWorkout.type] + '22',
              border: `1px solid ${typeColor[upcomingWorkout.type]}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              {upcomingWorkout.type === 'strength' ? '💪' : upcomingWorkout.type === 'cardio' ? '🏃' : upcomingWorkout.type === 'recovery' ? '🧘' : '🤸'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '600', marginBottom: '2px' }}>{upcomingWorkout.name}</p>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>
                {upcomingWorkout.duration} min · {upcomingWorkout.type}
              </p>
            </div>
            <span style={{ color: 'var(--color-accent)', fontSize: '20px' }}>→</span>
          </div>
        </div>
      )}

      <div>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-muted)' }}>RECENT WORKOUTS</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentWorkouts.length === 0 && (
            <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>No completed workouts yet.</p>
          )}
          {recentWorkouts.map(w => (
            <div key={w.id} style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p style={{ fontWeight: '500', fontSize: '15px' }}>{w.name}</p>
                <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '2px' }}>
                  {new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {w.duration} min
                </p>
              </div>
              <span style={{
                background: typeColor[w.type] + '22',
                color: typeColor[w.type],
                borderRadius: '8px',
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: '500',
              }}>
                {w.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '14px',
      padding: '16px',
    }}>
      <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: '700', color: accent }}>{value}</p>
    </div>
  )
}
