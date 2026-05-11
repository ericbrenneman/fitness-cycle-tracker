"use client";

import { saveCycleState, workoutTypeToCycleStep } from "@/lib/cycle";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WorkoutTemplate, StrengthExercise, StrengthExerciseInsert, WorkoutLog } from "@/lib/types";
import { getSuggestion, hasRecentIllness, getLastPerformance, LastPerformance } from "@/lib/progression";

interface Props {
  cycleStep: "A" | "B" | "C";
  template: WorkoutTemplate;
  pastLogs: WorkoutLog[];
  onDone: () => void;
  mode?: "home" | "travel";
}

interface SetRow {
  reps: string;
  weight: string;
  unit: "lb" | "kg";
  perceived_difficulty: "Easy" | "Moderate" | "Hard" | "";
  notes: string;
}

const DEFAULT_REST = 90;

// ============================================================
// Rest Timer Component
// ============================================================
function RestTimer({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const [seconds, setSeconds] = useState(DEFAULT_REST);
  const [customInput, setCustomInput] = useState(String(DEFAULT_REST));
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setRunning(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, seconds]);

  const restart = (secs: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(secs);
    setRunning(true);
  };

  const togglePause = () => setRunning((r) => !r);

  const pct = seconds / DEFAULT_REST;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * pct;
  const done = seconds === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1d27] border border-border rounded-3xl p-6 w-72 flex flex-col items-center gap-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
          {done ? "Rest Complete!" : "Rest Timer"}
        </p>

        {/* Circle timer */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke="#ffffff18"
              strokeWidth="6"
            />
            <circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke={done ? "#2ecc71" : "#6c63ff"}
              strokeWidth="6"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s linear" }}
            />
          </svg>
          <span className="absolute text-2xl font-bold">
            {done ? "✓" : seconds}
          </span>
        </div>

        {/* Quick adjust buttons */}
        <div className="flex gap-2">
          {[60, 90, 120].map((s) => (
            <button
              key={s}
              onClick={() => { restart(s); setCustomInput(String(s)); }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                DEFAULT_REST === s && seconds === s
                  ? "border-accent bg-accent/10 text-white"
                  : "border-border text-muted hover:text-white"
              }`}
            >
              {s}s
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex items-center gap-2 w-full">
          <input
            type="number"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Custom secs"
            className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent text-center"
          />
          <button
            onClick={() => {
              const val = parseInt(customInput);
              if (val > 0) restart(val);
            }}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-white hover:border-accent transition-colors"
          >
            Set
          </button>
        </div>

        {/* Controls */}
        <div className="flex gap-2 w-full">
          {!done && (
            <button
              onClick={togglePause}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-white hover:border-accent transition-colors"
            >
              {running ? "⏸ Pause" : "▶ Resume"}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            {done ? "Next Set ▶" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main StrengthLogger
// ============================================================
export default function StrengthLogger({ cycleStep, template, pastLogs, onDone, mode = "home" }: Props) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState("45");
  const [effort, setEffort] = useState("6");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lastPerf, setLastPerf] = useState<Record<string, LastPerformance | null>>({});
  const [illnessFlag, setIllnessFlag] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const [exerciseSets, setExerciseSets] = useState<Record<string, SetRow[]>>(() => {
    const init: Record<string, SetRow[]> = {};
    template.exercises.forEach((ex) => {
      init[ex.name] = Array.from({ length: ex.default_sets }, () => ({
        reps: ex.timed ? "" : String(ex.default_reps_range[0]),
        weight: "",
        unit: "lb",
        perceived_difficulty: "",
        notes: "",
      }));
    });
    return init;
  });

  useEffect(() => {
    const loadHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setIllnessFlag(hasRecentIllness(pastLogs));

      const { data: logs } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: false })
        .limit(30);

      if (!logs || logs.length === 0) return;
      const logIds = logs.map((l: { id: string }) => l.id);

      const results: Record<string, LastPerformance | null> = {};

      for (const ex of template.exercises) {
        const { data: sets } = await supabase
          .from("strength_exercises")
          .select("*")
          .eq("exercise_name", ex.name)
          .in("workout_log_id", logIds)
          .order("created_at", { ascending: false })
          .limit(10);

        results[ex.name] = getLastPerformance((sets ?? []) as StrengthExercise[]);
      }

      setLastPerf(results);

      setExerciseSets((prev) => {
        const updated = { ...prev };
        for (const ex of template.exercises) {
          const perf = results[ex.name];
          if (perf?.weight !== null && perf?.weight !== undefined) {
            updated[ex.name] = updated[ex.name].map((row) => ({
              ...row,
              weight: String(perf.weight),
              unit: perf.unit,
            }));
          }
        }
        return updated;
      });
    };
    loadHistory();
  }, []);

  const updateSet = (exerciseName: string, setIdx: number, field: keyof SetRow, value: string) => {
    setExerciseSets((prev) => {
      const sets = [...prev[exerciseName]];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      return { ...prev, [exerciseName]: sets };
    });
  };

  // When difficulty is selected — start timer automatically
  const logSetAndStartTimer = (exerciseName: string, setIdx: number, difficulty: string) => {
    updateSet(exerciseName, setIdx, "perceived_difficulty", difficulty);
    if (difficulty) setShowTimer(true);
  };

  const addSet = (exerciseName: string) => {
    setExerciseSets((prev) => {
      const sets = prev[exerciseName];
      const last = sets[sets.length - 1];
      return {
        ...prev,
        [exerciseName]: [...sets, { ...last, perceived_difficulty: "", notes: "" }],
      };
    });
  };

  const removeSet = (exerciseName: string) => {
    setExerciseSets((prev) => {
      const sets = prev[exerciseName];
      if (sets.length <= 1) return prev;
      return { ...prev, [exerciseName]: sets.slice(0, -1) };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Not logged in");
      setSaving(false);
      return;
    }

    const workoutPayload = {
      user_id: session.user.id,
      workout_type: cycleStep,
      logged_at: date,
      duration: parseInt(duration) || 0,
      effort: effort ? parseInt(effort) : null,
      notes: notes.trim() || null,
      advances_cycle: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: logData, error: logError } = await (supabase.from("workout_logs") as any)
      .insert(workoutPayload)
      .select()
      .single();

    if (logError || !logData) {
      setError(logError?.message ?? "Failed to save workout");
      setSaving(false);
      return;
    }

    const setsToInsert: StrengthExerciseInsert[] = [];

    for (const ex of template.exercises) {
      exerciseSets[ex.name].forEach((row, i) => {
        if (!row.reps && !row.weight) return;
        setsToInsert.push({
          workout_log_id: logData.id,
          exercise_name: ex.name,
          set_number: i + 1,
          reps: row.reps ? parseInt(row.reps) : null,
          weight: row.weight ? parseFloat(row.weight) : null,
          unit: row.unit,
          perceived_difficulty: row.perceived_difficulty || null,
          notes: row.notes.trim() || null,
        });
      });
    }

  if (setsToInsert.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: setsError } = await (supabase.from("strength_exercises") as any)
        .insert(setsToInsert);

      if (setsError) {
        setError(setsError.message);
        setSaving(false);
        return;
      }
    }

    // Save persistent cycle state
    const completedStep = workoutTypeToCycleStep(cycleStep, cycleStep);
    if (completedStep) {
      await saveCycleState(supabase, session.user.id, completedStep);
    }

    onDone();
  };

  const EMOJI: Record<string, string> = { A: "💪", B: "🏋️", C: "🔥" };

  return (
    <div className="flex flex-col flex-1 pb-10">
      {/* Rest timer overlay */}
      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}

      <div className="flex items-center justify-between px-4 pt-10 pb-4">
        <div>
          <p className="text-muted text-xs mb-0.5">
            {mode === "travel" ? "✈️ Travel workout" : "Starting workout"}
          </p>
          <h1 className="text-xl font-bold">
            {EMOJI[cycleStep]} {template.name}
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowTimer(true)}
            className="text-muted text-xs border border-border rounded-lg px-3 py-1.5 hover:text-white transition-colors"
          >
            ⏱ Timer
          </button>
          <button
            onClick={onDone}
            className="text-muted text-xs border border-border rounded-lg px-3 py-1.5 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>

      {illnessFlag && (
        <div className="mx-4 mb-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-2">
          <p className="text-yellow-300 text-xs">
            ⚠️ Illness logged recently — suggestions are conservative.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5 px-4">
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Duration (min)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Overall Effort — RPE {effort}/10</label>
            <input type="range" min="1" max="10" value={effort}
              onChange={(e) => setEffort(e.target.value)}
              className="w-full accent-[#6c63ff]" />
            <div className="flex justify-between text-xs text-muted mt-0.5">
              <span>Easy</span><span>Moderate</span><span>Max</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel?" rows={2}
              className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm placeholder:text-muted focus:outline-none focus:border-accent resize-none" />
          </div>
        </div>

        {template.exercises.map((ex) => {
          const perf = lastPerf[ex.name] ?? null;
          const suggestion = getSuggestion(perf, illnessFlag);

          return (
            <div key={ex.name} className="bg-surface border border-border rounded-2xl p-4">
              <div className="mb-2">
                <p className="font-semibold text-sm">
                  {ex.name}
                  {ex.optional && <span className="ml-2 text-xs text-muted font-normal">optional</span>}
                </p>
                <p className="text-xs text-muted mt-0.5">{ex.notes}</p>
              </div>

              {perf ? (
                <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-accent font-medium">
                    {suggestion.suggested_weight !== null
                      ? `Suggested: ${suggestion.suggested_weight} ${suggestion.unit} × ${suggestion.suggested_reps} reps`
                      : "Suggested: bodyweight"}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{suggestion.note}</p>
                  <p className="text-xs text-muted/60 mt-0.5">
                    Last: {perf.weight !== null ? `${perf.weight} ${perf.unit}` : "—"} × {perf.reps ?? "—"} reps
                    {perf.difficulty ? ` · ${perf.difficulty}` : ""}
                  </p>
                </div>
              ) : (
                <div className="bg-white/5 border border-border rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-muted">
                    No previous data —{" "}
                    {ex.timed
                      ? `${ex.default_reps_range[0]}–${ex.default_reps_range[1]} sec`
                      : `${ex.default_reps_range[0]}–${ex.default_reps_range[1]} reps`}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-12 gap-1.5 mb-1.5">
                <p className="col-span-1 text-xs text-muted">Set</p>
                <p className="col-span-3 text-xs text-muted">{ex.timed ? "Secs" : "Reps"}</p>
                <p className="col-span-3 text-xs text-muted">Weight</p>
                <p className="col-span-2 text-xs text-muted">Unit</p>
                <p className="col-span-3 text-xs text-muted">Feel</p>
              </div>

              {exerciseSets[ex.name].map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5 mb-1.5 items-center">
                  <p className="col-span-1 text-xs text-muted font-medium">{i + 1}</p>
                  <input type="number" value={row.reps}
                    onChange={(e) => updateSet(ex.name, i, "reps", e.target.value)}
                    placeholder={ex.timed ? "45" : String(suggestion.suggested_reps ?? ex.default_reps_range[0])}
                    className="col-span-3 bg-card border border-border rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent text-center" />
                  <input type="number" value={row.weight}
                    onChange={(e) => updateSet(ex.name, i, "weight", e.target.value)}
                    placeholder={suggestion.suggested_weight !== null ? String(suggestion.suggested_weight) : "0"}
                    className="col-span-3 bg-card border border-border rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent text-center" />
                  <select value={row.unit}
                    onChange={(e) => updateSet(ex.name, i, "unit", e.target.value)}
                    className="col-span-2 bg-card border border-border rounded-lg px-1 py-1.5 text-white text-xs focus:outline-none">
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                  </select>
                  <select
                    value={row.perceived_difficulty}
                    onChange={(e) => logSetAndStartTimer(ex.name, i, e.target.value)}
                    className="col-span-3 bg-card border border-border rounded-lg px-1 py-1.5 text-white text-xs focus:outline-none">
                    <option value="">—</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Mod</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => addSet(ex.name)}
                  className="text-xs text-accent hover:text-white transition-colors">
                  + Add set
                </button>
                {exerciseSets[ex.name].length > 1 && (
                  <button type="button" onClick={() => removeSet(ex.name)}
                    className="text-xs text-muted hover:text-red-400 transition-colors">
                    − Remove set
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-accent text-white font-semibold py-4 rounded-2xl text-sm disabled:opacity-50 hover:bg-accent/90 transition-colors">
          {saving ? "Saving…" : "Complete Workout ✓"}
        </button>
      </div>
    </div>
  );
}