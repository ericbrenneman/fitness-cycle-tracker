import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Cycles from './pages/Cycles'
import Workouts from './pages/Workouts'
import Progress from './pages/Progress'
import NavBar from './components/NavBar'

export type Page = 'dashboard' | 'cycles' | 'workouts' | 'progress'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />
      case 'cycles': return <Cycles />
      case 'workouts': return <Workouts />
      case 'progress': return <Progress />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1, paddingBottom: '72px' }}>
        {renderPage()}
      </main>
      <NavBar current={page} onNavigate={setPage} />
    </div>
  )
}
