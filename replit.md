# Fitness Cycle Tracker

A mobile-first workout cycle tracker focused on strength, cardio, recovery, and sustainable fitness progression.

## Tech Stack

- React + TypeScript + Vite
- localStorage for persistence (no backend needed)
- Single-page app with tab navigation

## Project Structure

```
src/
  App.tsx           - Root component, page routing
  index.css         - Global styles and CSS variables
  main.tsx          - Entry point
  components/
    NavBar.tsx      - Bottom navigation bar
  pages/
    Dashboard.tsx   - Home overview with active cycle and recent workouts
    Cycles.tsx      - Manage workout cycles
    Workouts.tsx    - Log and track individual workouts
    Progress.tsx    - Statistics and progress overview
  data/
    storage.ts      - localStorage CRUD helpers and data types
```

## Running

```bash
npm run dev
```

Runs on port 5000.

## User Preferences

- Mobile-first design (max-width 480px)
- Dark theme
