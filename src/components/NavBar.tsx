import { Page } from '../App'

interface NavBarProps {
  current: Page
  onNavigate: (page: Page) => void
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Home', icon: '⊞' },
  { id: 'cycles', label: 'Cycles', icon: '↻' },
  { id: 'workouts', label: 'Workouts', icon: '◈' },
  { id: 'progress', label: 'Progress', icon: '↗' },
]

export default function NavBar({ current, onNavigate }: NavBarProps) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      padding: '8px 0',
      zIndex: 100,
    }}>
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{
            flex: 1,
            background: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 4px',
            color: current === item.id ? 'var(--color-accent)' : 'var(--color-muted)',
            fontSize: '11px',
            fontWeight: current === item.id ? '600' : '400',
            transition: 'color 0.2s',
          }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
