"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WorkoutLog, WorkoutLogInsert } from "@/lib/types";
import LogWorkoutModal from "@/components/LogWorkoutModal";
import WorkoutCard from "@/components/WorkoutCard";
import WeekSummary from "@/components/WeekSummary";
import NextWorkout from "@/components/NextWorkout";
import RecoveryWarning from "@/components/RecoveryWarning";
import { loadWorkoutMode, saveWorkoutMode, WorkoutMode } from "@/lib/userTemplates";
import {
  todayLocalISO,
  currentWeekStart,
  calcHydrationStreak,
  calcAlcoholStreak,
  hydrationGoalMet,
  alcoholGoalMet,
} from "@/lib/habits";

export default function DashboardPage() {
  const [_user, setUser] = useState<{ email?: string; id: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>("home");
  const [modeToggling, setModeToggling] = useState(false);
  const router = useRouter();

  // Habit state
  const [hydrationToday, setHydrationToday] = useState(0);
  const [hydrationGoal, setHydrationGoal] = useState(100);
  const [hydrationStreak, setHydrationStreak] = useState(0);
  const [hydrationAvg7, setHydrationAvg7] = useState(0);
  const [hydrationGoalDays7, setHydrationGoalDays7] = useState(0);
  const [hydrationCustom, setHydrationCustom] = useState("");
  const [lastHydrationAdd, setLastHydrationAdd] = useState<number | null>(null);

  const [alcoholThisWeek, setAlcoholThisWeek] = useState(0);
  const [alcoholLimit, setAlcoholLimit] = useState(7);
  const [alcoholStreak, setAlcoholStreak] = useState(0);
  const [alcoholAvg4, setAlcoholAvg4] = useState(0);
  const [alcoholWithinLimit4, setAlcoholWithinLimit4] = useState(0);
  const [alcoholTrackedWeeks4, setAlcoholTrackedWeeks4] = useState(0);
  const [alcoholCustom, setAlcoholCustom] = useState("");
  const [lastAlcoholAdd, setLastAlcoholAdd] = useState<number | null>(null);

  const hydrationUndoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alcoholUndoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchLogs = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLogs([]); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("workout_logs") as any)
      .select("*")
      .eq("user_id", session.user.id)
      .order("logged_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setDbError(error.message);
      setLogs([]);
    } else {
      setDbError(null);
      setLogs((data as WorkoutLog[]) ?? []);
    }
  }, [supabase]);

  const subtractLocalDays = (iso: string, days: number) => {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - days);

    const yr = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, "0");
    const dy = String(date.getDate()).padStart(2, "0");

    return `${yr}-${mo}-${dy}`;
  };

  const subtractLocalWeeks = (weekStartIso: string, weeks: number) => {
    return subtractLocalDays(weekStartIso, weeks * 7);
  };

  const calculateHydrationInsights = (
    rows: { logged_at: string; amount_oz: number }[],
    goalOz: number
  ) => {
    const today = todayLocalISO();
    const byDate = new Map<string, number>();

    for (const row of rows) {
      byDate.set(row.logged_at, (byDate.get(row.logged_at) ?? 0) + row.amount_oz);
    }

    let total = 0;
    let goalDays = 0;

    for (let i = 0; i < 7; i++) {
      const date = subtractLocalDays(today, i);
      const amount = byDate.get(date) ?? 0;

      total += amount;

      if (amount >= goalOz) {
        goalDays++;
      }
    }

    return {
      avg: Math.round(total / 7),
      goalDays,
    };
  };

  const calculateAlcoholInsights = (
    rows: { week_start: string; drink_count: number }[],
    limit: number
  ) => {
    const thisWeek = currentWeekStart();
    const byWeek = new Map<string, number>();

    for (const row of rows) {
      byWeek.set(row.week_start, (byWeek.get(row.week_start) ?? 0) + row.drink_count);
    }

    let total = 0;
    let trackedWeeks = 0;
    let withinLimit = 0;

    for (let i = 1; i <= 4; i++) {
      const weekStart = subtractLocalWeeks(thisWeek, i);
      const count = byWeek.get(weekStart);

      if (count === undefined) continue;

      trackedWeeks++;
      total += count;

      if (count <= limit) {
        withinLimit++;
      }
    }

    return {
      avg: trackedWeeks > 0 ? Math.round((total / trackedWeeks) * 10) / 10 : 0,
      withinLimit,
      trackedWeeks,
    };
  };
  
  const fetchHabits = useCallback(async (uid: string) => {
    const today = todayLocalISO();
    const weekStart = currentWeekStart();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [settingsRes, hydrationTodayRes, hydrationAllRes, alcoholWeekRes, alcoholAllRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("user_settings") as any)
        .select("hydration_goal_oz, weekly_alcohol_limit")
        .eq("user_id", uid)
        .single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("hydration_logs") as any)
        .select("amount_oz")
        .eq("user_id", uid)
        .eq("logged_at", today)
        .single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("hydration_logs") as any)
        .select("logged_at, amount_oz")
        .eq("user_id", uid)
        .order("logged_at", { ascending: false })
        .limit(60),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("alcohol_logs") as any)
        .select("drink_count")
        .eq("user_id", uid)
        .eq("week_start", weekStart)
        .single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("alcohol_logs") as any)
        .select("week_start, drink_count")
        .eq("user_id", uid)
        .order("week_start", { ascending: false })
        .limit(26),
    ]);

    const goal = settingsRes.data?.hydration_goal_oz ?? 100;
    const limit = settingsRes.data?.weekly_alcohol_limit ?? 7;
    setHydrationGoal(goal);
    setAlcoholLimit(limit);

    setHydrationToday(hydrationTodayRes.data?.amount_oz ?? 0);
    setAlcoholThisWeek(alcoholWeekRes.data?.drink_count ?? 0);

    const hydrationRows = hydrationAllRes.data ?? [];
    const alcoholRows = alcoholAllRes.data ?? [];

    setHydrationStreak(calcHydrationStreak(hydrationRows, goal));
    setAlcoholStreak(calcAlcoholStreak(alcoholRows, limit));

    const hydrationInsights = calculateHydrationInsights(hydrationRows, goal);
    setHydrationAvg7(hydrationInsights.avg);
    setHydrationGoalDays7(hydrationInsights.goalDays);

    const alcoholInsights = calculateAlcoholInsights(alcoholRows, limit);
    setAlcoholAvg4(alcoholInsights.avg);
    setAlcoholWithinLimit4(alcoholInsights.withinLimit);
    setAlcoholTrackedWeeks4(alcoholInsights.trackedWeeks);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (!retrySession) { router.push("/auth"); return; }
        setUser({ email: retrySession.user.email, id: retrySession.user.id });
        setUserId(retrySession.user.id);
        const mode = await loadWorkoutMode(supabase, retrySession.user.id);
        setWorkoutMode(mode);
        await Promise.all([fetchLogs(), fetchHabits(retrySession.user.id)]);
        if (!cancelled) setLoading(false);
        return;
      }

      setUser({ email: session.user.email, id: session.user.id });
      setUserId(session.user.id);
      const mode = await loadWorkoutMode(supabase, session.user.id);
      setWorkoutMode(mode);
      await Promise.all([fetchLogs(), fetchHabits(session.user.id)]);
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (hydrationUndoTimer.current) {
        clearTimeout(hydrationUndoTimer.current);
      }

      if (alcoholUndoTimer.current) {
        clearTimeout(alcoholUndoTimer.current);
      }
    };
  }, []);

  const handleToggleMode = async () => {
    if (!userId) return;
    setModeToggling(true);
    const newMode: WorkoutMode = workoutMode === "home" ? "travel" : "home";
    await saveWorkoutMode(supabase, userId, newMode);
    setWorkoutMode(newMode);
    setModeToggling(false);
  };

  const startHydrationUndoWindow = (oz: number) => {
    if (hydrationUndoTimer.current) {
      clearTimeout(hydrationUndoTimer.current);
    }

    setLastHydrationAdd(oz);

    hydrationUndoTimer.current = setTimeout(() => {
      setLastHydrationAdd(null);
      hydrationUndoTimer.current = null;
    }, 60000);
  };

  const startAlcoholUndoWindow = (drinks: number) => {
    if (alcoholUndoTimer.current) {
      clearTimeout(alcoholUndoTimer.current);
    }

    setLastAlcoholAdd(drinks);

    alcoholUndoTimer.current = setTimeout(() => {
      setLastAlcoholAdd(null);
      alcoholUndoTimer.current = null;
    }, 60000);
  };
  
  const addHydration = async (oz: number) => {
    if (!userId) return;
    const today = todayLocalISO();
    const newTotal = hydrationToday + oz;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("hydration_logs") as any).upsert(
      { user_id: userId, logged_at: today, amount_oz: newTotal, updated_at: new Date().toISOString() },
      { onConflict: "user_id,logged_at" }
    );
    setHydrationToday(newTotal);
    startHydrationUndoWindow(oz);
    await fetchHabits(userId);
  };

  const undoHydration = async () => {
    if (!userId || lastHydrationAdd === null) return;

    const today = todayLocalISO();
    const newTotal = Math.max(0, hydrationToday - lastHydrationAdd);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("hydration_logs") as any).upsert(
      {
        user_id: userId,
        logged_at: today,
        amount_oz: newTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,logged_at" }
    );

    setHydrationToday(newTotal);
    setLastHydrationAdd(null);

    if (hydrationUndoTimer.current) {
      clearTimeout(hydrationUndoTimer.current);
      hydrationUndoTimer.current = null;
    }

    await fetchHabits(userId);
  };

  const addAlcohol = async (drinks: number) => {
    if (!userId) return;
    const weekStart = currentWeekStart();
    const newTotal = alcoholThisWeek + drinks;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("alcohol_logs") as any).upsert(
      { user_id: userId, week_start: weekStart, drink_count: newTotal, updated_at: new Date().toISOString() },
      { onConflict: "user_id,week_start" }
    );
    setAlcoholThisWeek(newTotal);
    startAlcoholUndoWindow(drinks);
    await fetchHabits(userId);
  };

  const undoAlcohol = async () => {
    if (!userId || lastAlcoholAdd === null) return;

    const weekStart = currentWeekStart();
    const newTotal = Math.max(0, alcoholThisWeek - lastAlcoholAdd);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("alcohol_logs") as any).upsert(
      {
        user_id: userId,
        week_start: weekStart,
        drink_count: newTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,week_start" }
    );

    setAlcoholThisWeek(newTotal);
    setLastAlcoholAdd(null);

    if (alcoholUndoTimer.current) {
      clearTimeout(alcoholUndoTimer.current);
      alcoholUndoTimer.current = null;
    }
    
    await fetchHabits(userId);
  };

  const handleLogWorkout = async (entry: WorkoutLogInsert) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return "Not logged in";
    const workoutPayload = {
      workout_type: entry.workout_type,
      duration: entry.duration,
      effort: entry.effort,
      notes: entry.notes,
      advances_cycle: entry.advances_cycle,
      logged_at: entry.logged_at,
      user_id: session.user.id,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("workout_logs") as any).insert(workoutPayload);
    if (!error) {
      await fetchLogs();
      setShowModal(false);
    }
    return error?.message ?? null;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted text-sm">Loading…</div>
      </div>
    );
  }

  const hydrationDone = hydrationGoalMet(hydrationToday, hydrationGoal);
  const alcoholOk = alcoholGoalMet(alcoholThisWeek, alcoholLimit);

  return (
    <div className="flex flex-col flex-1 pb-28">
      <div className="flex items-center justify-between px-4 pt-10 pb-6">
        <div>
          <p className="text-muted text-xs mb-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
            })}
          </p>
          <h1 className="text-xl font-bold">Apex Training Log</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="text-muted text-xs hover:text-white transition-colors border border-border rounded-lg px-3 py-1.5"
        >
          Sign out
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {/* Home / Travel mode toggle */}
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-3 border cursor-pointer transition-colors ${
            workoutMode === "travel"
              ? "bg-blue-500/10 border-blue-400/30"
              : "bg-surface border-border"
          }`}
          onClick={handleToggleMode}
        >
          <div>
            <p className="text-sm font-semibold">
              {workoutMode === "travel" ? "✈️ Travel Mode" : "🏠 Home Mode"}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {workoutMode === "travel"
                ? "Hotel / bodyweight workouts active"
                : "Gym workouts active — tap to switch to travel"}
            </p>
          </div>
          <div className={`w-11 h-6 rounded-full flex items-center transition-colors ${
            workoutMode === "travel" ? "bg-blue-500" : "bg-border"
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
              workoutMode === "travel" ? "translate-x-5" : "translate-x-0"
            }`} />
          </div>
        </div>

        {dbError && (
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-4 py-3">
            <p className="text-yellow-300 text-xs font-semibold mb-1">Database not set up yet</p>
            <p className="text-yellow-400/80 text-xs leading-relaxed">
              Run <code className="bg-yellow-400/20 px-1 rounded">supabase-setup.sql</code> in your
              Supabase SQL Editor to create the workout_logs table.
            </p>
            <p className="text-yellow-400/50 text-xs mt-1">Error: {dbError}</p>
          </div>
        )}

        <WeekSummary logs={logs} />
        <RecoveryWarning logs={logs} />
        <NextWorkout logs={logs} />

        <button
          onClick={() => router.push("/workout")}
          className="w-full bg-accent text-white font-semibold py-3.5 rounded-2xl text-sm hover:bg-accent/90 transition-colors"
        >
          {workoutMode === "travel" ? "✈️ Start Travel Workout" : "▶ Start Next Workout"}
        </button>

        <button
          onClick={() => router.push("/recovery")}
          className="w-full bg-surface border border-border text-white font-semibold py-3.5 rounded-2xl text-sm hover:border-accent/50 transition-colors"
        >
          🧖 Log Recovery / Sauna
        </button>

        {/* ── Apex Habits ─────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Apex Habits
          </p>

          {/* Hydration card */}
          <div className={`rounded-2xl p-4 border mb-3 ${
            hydrationDone
              ? "bg-blue-500/10 border-blue-400/30"
              : "bg-surface border-border"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  💧 Hydration
                  {hydrationDone && (
                    <span className="text-xs font-medium text-blue-300 bg-blue-400/20 px-2 py-0.5 rounded-full">
                      Apex Habit ✓
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {hydrationDone
                    ? `Daily goal reached • ${hydrationToday} / ${hydrationGoal} oz`
                    : `${hydrationToday} / ${hydrationGoal} oz today`}
                </p>

                {hydrationDone && hydrationToday > hydrationGoal && (
                  <p className="text-xs text-blue-300 mt-1">
                    +{hydrationToday - hydrationGoal} oz over target
                  </p>
                )}
              </div>
              {hydrationStreak > 0 && (
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-300">{hydrationStreak}</p>
                  <p className="text-xs text-muted">day streak</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/10 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((hydrationToday / hydrationGoal) * 100))}%`,
                  background: hydrationDone ? "#3b82f6" : "#6c63ff",
                }}
              />
            </div>

            {/* Quick add buttons */}
            <div className="flex gap-2">
              {[8, 16, 24].map((oz) => (
                <button
                  key={oz}
                  onClick={() => addHydration(oz)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-medium text-muted hover:text-white hover:border-accent/50 transition-colors"
                >
                  +{oz} oz
                </button>
              ))}
              <div className="flex gap-1 flex-1">
                <input
                  type="number"
                  value={hydrationCustom}
                  onChange={(e) => setHydrationCustom(e.target.value)}
                  placeholder="oz"
                  className="w-full bg-card border border-border rounded-xl px-2 py-2 text-white text-xs focus:outline-none focus:border-accent text-center"
                />
                <button
                  onClick={() => {
                    const val = parseInt(hydrationCustom);
                    if (val > 0) { addHydration(val); setHydrationCustom(""); }
                  }}
                  className="px-2 py-2 bg-accent rounded-xl text-white text-xs font-bold hover:bg-accent/90 transition-colors"
                >
                  +
                </button>
                  </div>
                </div>

                {lastHydrationAdd !== null && (
                  <button
                    onClick={undoHydration}
                    className="w-full mt-2 text-xs text-blue-300 hover:text-white transition-colors"
                  >
                    Undo +{lastHydrationAdd} oz
                  </button>
                )}
              </div>

          {/* Conscious Consumption card */}
          <div className={`rounded-2xl p-4 border ${
            !alcoholOk
              ? "bg-red-500/10 border-red-400/30"
              : alcoholThisWeek === 0
              ? "bg-green-500/10 border-green-400/30"
              : "bg-surface border-border"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  🍃 Conscious Consumption
                  {alcoholOk && alcoholThisWeek <= alcoholLimit && (
                    <span className="text-xs font-medium text-green-300 bg-green-400/20 px-2 py-0.5 rounded-full">
                      Within limit
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {!alcoholOk
                    ? `${alcoholThisWeek} / ${alcoholLimit} drinks — over target`
                    : alcoholThisWeek === 0
                    ? "Recovery protected this week"
                    : `${alcoholThisWeek} / ${alcoholLimit} drinks this week`}
                </p>
              </div>
              {alcoholStreak > 0 && (
                <div className="text-right">
                  <p className="text-lg font-bold text-green-300">{alcoholStreak}</p>
                  <p className="text-xs text-muted">week streak</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/10 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((alcoholThisWeek / Math.max(alcoholLimit, 1)) * 100))}%`,
                  background: !alcoholOk ? "#ef4444" : "#2ecc71",
                }}
              />
            </div>

            {/* Quick add */}
            <div className="flex gap-2">
              <button
                onClick={() => addAlcohol(1)}
                className="flex-1 py-2 rounded-xl border border-border text-xs font-medium text-muted hover:text-white hover:border-accent/50 transition-colors"
              >
                +1 drink
              </button>
              <div className="flex gap-1 flex-1">
                <input
                  type="number"
                  value={alcoholCustom}
                  onChange={(e) => setAlcoholCustom(e.target.value)}
                  placeholder="drinks"
                  className="w-full bg-card border border-border rounded-xl px-2 py-2 text-white text-xs focus:outline-none focus:border-accent text-center"
                />
                <button
                  onClick={() => {
                    const val = parseInt(alcoholCustom);
                    if (val > 0) { addAlcohol(val); setAlcoholCustom(""); }
                  }}
                  className="px-2 py-2 bg-accent rounded-xl text-white text-xs font-bold hover:bg-accent/90 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {lastAlcoholAdd !== null && (
              <button
                onClick={undoAlcohol}
                className="w-full mt-2 text-xs text-green-300 hover:text-white transition-colors"
              >
                Undo +{lastAlcoholAdd} drink{lastAlcoholAdd === 1 ? "" : "s"}
              </button>
            )}

            {!alcoholOk && (
              <p className="text-xs text-red-300/80 mt-2 text-center">
                Weekly target exceeded — refocus and protect your recovery.
              </p>
            )}
          </div>
        </div>
        
        {/* Apex Habits Insights card */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Apex Habits Insights
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted mb-1">💧 Live 7-day avg.</p>
              <p className="text-lg font-bold">{hydrationAvg7} oz</p>
              <p className="text-xs text-muted mt-0.5">
                Goal hit {hydrationGoalDays7} of 7 days
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted mb-1">🍃 4-week average</p>
              <p className="text-lg font-bold">{alcoholAvg4} drinks</p>
              <p className="text-xs text-muted mt-0.5">
                {alcoholTrackedWeeks4 > 0
                  ? `Within limit ${alcoholWithinLimit4} of ${alcoholTrackedWeeks4} tracked week${
                      alcoholTrackedWeeks4 === 1 ? "" : "s"
                    }`
                  : "No completed weeks tracked yet"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent entries */}
        <div>
          <h2 className="text-xs font-semibold text-muted tracking-wider uppercase mb-3">
            Recent
          </h2>
          {logs.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <p className="text-muted text-sm">No workouts logged yet.</p>
              <p className="text-muted text-xs mt-1">Tap the button above to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.slice(0, 3).map((log) => (
                <WorkoutCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <LogWorkoutModal
          onClose={() => setShowModal(false)}
          onSubmit={handleLogWorkout}
        />
      )}
    </div>
  );
}