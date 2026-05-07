"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WorkoutLog, WorkoutLogInsert, WorkoutType } from "@/lib/types";
import LogWorkoutModal from "@/components/LogWorkoutModal";
import WorkoutCard from "@/components/WorkoutCard";
import WeekSummary from "@/components/WeekSummary";
import NextWorkout from "@/components/NextWorkout";

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string; id: string } | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("workout_logs")
      .select("*")
      .order("logged_at", { ascending: false })
      .limit(7);
    if (!error && data) setLogs(data as WorkoutLog[]);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser({ email: user.email, id: user.id });
      await fetchLogs();
      setLoading(false);
    };
    init();
  }, [supabase, router, fetchLogs]);

  const handleLogWorkout = async (entry: WorkoutLogInsert) => {
    const { error } = await supabase.from("workout_logs").insert(entry);
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
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-xl font-bold">Your Dashboard</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="text-muted text-xs hover:text-white transition-colors border border-border rounded-lg px-3 py-1.5"
        >
          Sign out
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {/* Week Summary */}
        <WeekSummary logs={logs} />

        {/* Next Workout Recommendation */}
        <NextWorkout logs={logs} />

        {/* Log Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-accent text-white font-semibold py-3.5 rounded-2xl text-sm hover:bg-accent/90 transition-colors"
        >
          + Log Workout
        </button>

        {/* Last 7 Entries */}
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
