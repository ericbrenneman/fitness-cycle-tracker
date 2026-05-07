# Fitness Cycle Tracker

A mobile-first workout cycle tracker. Next.js + TypeScript + Tailwind CSS + Supabase.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL with RLS)

## Project Structure

```
app/
  layout.tsx        - Root layout, dark theme
  globals.css       - Tailwind v4 import + theme tokens
  page.tsx          - Root redirect (auth or dashboard)
  auth/page.tsx     - Login / Register page
  dashboard/page.tsx - Main dashboard (week summary, next workout, log)
components/
  LogWorkoutModal.tsx - Bottom-sheet modal for logging workouts
  WorkoutCard.tsx     - Single workout entry card
  WeekSummary.tsx     - Current week stats (time, sessions, cycle days)
  NextWorkout.tsx     - Next recommended workout in A/B/C sequence
lib/
  types.ts             - TypeScript types
  supabase/client.ts   - Browser Supabase client
  supabase/server.ts   - Server Supabase client
  supabase/middleware.ts - Session refresh helper
proxy.ts              - Next.js proxy (auth redirect guard)
supabase-setup.sql    - Run this in Supabase SQL editor to create the table + RLS
```

## Running

```bash
npm run dev
```

Runs on port 5000.

## Supabase Setup

Run `supabase-setup.sql` in your Supabase SQL editor before using the app.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key

## User Preferences

- Mobile-first design (max-width 480px)
- Dark theme
- Keep it simple — Phase 1 only
