-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create workout_logs table
create table if not exists public.workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at date not null default current_date,
  workout_type text not null check (workout_type in ('A','B','C','Cardio','Rest','Sauna','Mobility','Illness','Other')),
  duration integer not null check (duration > 0),
  effort integer check (effort >= 1 and effort <= 10),
  notes text,
  advances_cycle boolean not null default false,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.workout_logs enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own logs"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own logs"
  on public.workout_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

-- Index for fast per-user queries ordered by date
create index if not exists workout_logs_user_date
  on public.workout_logs(user_id, logged_at desc);
