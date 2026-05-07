export interface Cycle {
  id: string
  name: string
  goal: string
  startDate: string
  endDate: string
  weeks: number
  currentWeek: number
  status: 'active' | 'completed' | 'planned'
}

export interface Workout {
  id: string
  cycleId: string
  name: string
  date: string
  type: 'strength' | 'cardio' | 'recovery' | 'mobility'
  duration: number
  notes: string
  completed: boolean
}

export interface WorkoutSet {
  id: string
  workoutId: string
  exercise: string
  sets: number
  reps: number
  weight: number
  unit: 'kg' | 'lbs'
}

const defaultCycles: Cycle[] = [
  {
    id: '1',
    name: 'Strength Phase 1',
    goal: 'Build base strength and muscle',
    startDate: '2026-04-01',
    endDate: '2026-05-12',
    weeks: 6,
    currentWeek: 5,
    status: 'active',
  },
  {
    id: '2',
    name: 'Cardio Endurance',
    goal: 'Improve VO2 max and stamina',
    startDate: '2026-05-13',
    endDate: '2026-06-24',
    weeks: 6,
    currentWeek: 0,
    status: 'planned',
  },
]

const defaultWorkouts: Workout[] = [
  {
    id: 'w1',
    cycleId: '1',
    name: 'Upper Body A',
    date: '2026-05-05',
    type: 'strength',
    duration: 65,
    notes: 'Felt strong on bench press',
    completed: true,
  },
  {
    id: 'w2',
    cycleId: '1',
    name: 'Lower Body A',
    date: '2026-05-07',
    type: 'strength',
    duration: 70,
    notes: 'Squats felt heavy, form check needed',
    completed: true,
  },
  {
    id: 'w3',
    cycleId: '1',
    name: 'Active Recovery',
    date: '2026-05-08',
    type: 'recovery',
    duration: 30,
    notes: 'Light walk and stretching',
    completed: true,
  },
  {
    id: 'w4',
    cycleId: '1',
    name: 'Upper Body B',
    date: '2026-05-09',
    type: 'strength',
    duration: 60,
    notes: '',
    completed: false,
  },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const storage = {
  getCycles: (): Cycle[] => load('cycles', defaultCycles),
  saveCycles: (cycles: Cycle[]) => save('cycles', cycles),
  getWorkouts: (): Workout[] => load('workouts', defaultWorkouts),
  saveWorkouts: (workouts: Workout[]) => save('workouts', workouts),
}
