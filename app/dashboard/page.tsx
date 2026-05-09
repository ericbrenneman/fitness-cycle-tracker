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

export default function DashboardPage() {
  const [_user, setUser] = useState<{ email?: string; id: string } | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  // Stable ref so supabase client is never recreated across renders
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("workout_logs")
      .select("*")
      .order("logged_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[fetchLogs error]", error);
      setDbError(error.message);
    } else {
      setDbError(null);
      setLogs((data as WorkoutLog[]) ?? []);
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      // Use getSession first — it reads the cookie synchronously
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        // Wait briefly then re-check before redirecting — handles post-login race
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (!retrySession) {
          router.push("/auth");
          return;
        }
        setUser({ email: retrySession.user.email, id: retrySession.user.id });
        await fetchLogs();
        if (!cancelled) setLoading(false);
        return;
      }
      setUser({ email: session.user.email, id: session.user.id });
      await fetchLogs();
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogWorkout = async (entry: WorkoutLogInsert) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return "Not logged in";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("workout_logs") as any).insert({
      ...entry,
      user_id: session.user.id,
    });
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

  return (
    <div className="flex flex-col flex-1 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-6">
        <div>
          <p className="text-muted text-xs mb-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-xl font-bold">Apex Training Log</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/history")}
            className="text-muted text-xs hover:text-white transition-colors border border-border rounded-lg px-3 py-1.5"
          >
            History
          </button>
          <button
            onClick={handleSignOut}
            className="text-muted text-xs hover:text-white transition-colors border border-border rounded-lg px-3 py-1.5"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {/* DB setup warning */}
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
  ▶ Start Next Workout
</button>
<button
  onClick={() => router.push("/recovery")}
  className="w-full bg-surface border border-border text-white font-semibold py-3.5 rounded-2xl text-sm hover:border-accent/50 transition-colors"
>
  🧖 Log Recovery / Sauna
</button>

        <div>
          <h2 className="text-xs font-semibold text-muted tracking-wider uppercase mb-3">
            Last 7 Entries
          </h2>
          {logs.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <p className="text-muted text-sm">No workouts logged yet.</p>
              <p className="text-muted text-xs mt-1">Tap the button above to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.map((log) => (
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
