"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { CycleStep, WorkoutType } from "@/lib/types";

interface Props {
    cycleStep: "Rest1" | "Rest2";
    onDone: () => void;
    standalone?: boolean;
  }

const RECOVERY_TYPES: { type: WorkoutType; emoji: string; label: string }[] = [
  { type: "Rest",     emoji: "😴", label: "Rest" },
  { type: "Sauna",    emoji: "🧖", label: "Sauna" },
  { type: "Mobility", emoji: "🤸", label: "Mobility" },
  { type: "Illness",  emoji: "🤒", label: "Illness" },
  { type: "Other",    emoji: "📝", label: "Other" },
];

export default function RecoveryLogger({ cycleStep, onDone, standalone = false }: Props) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [workoutType, setWorkoutType] = useState<WorkoutType>("Rest");
  const [advancesCycle, setAdvancesCycle] = useState(!standalone);
  const [saunaMinutes, setSaunaMinutes] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [hrv, setHrv] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [soreness, setSoreness] = useState("");
  const [illnessSymptoms, setIllnessSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Not logged in"); setSaving(false); return; }

    const { data: logData, error: logError } = await supabase
      .from("workout_logs")
      .insert({
        user_id: session.user.id,
        workout_type: workoutType,
        logged_at: date,
        duration: saunaMinutes ? parseInt(saunaMinutes) : 0,
        effort: null,
        notes: notes.trim() || null,
        advances_cycle: advancesCycle,
      })
      .select()
      .single();

    if (logError || !logData) {
      setError(logError?.message ?? "Failed to save");
      setSaving(false);
      return;
    }

    const { error: recoveryError } = await supabase
      .from("recovery_details")
      .insert({
        workout_log_id: logData.id,
        sauna_minutes: saunaMinutes ? parseInt(saunaMinutes) : null,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        hrv: hrv ? parseInt(hrv) : null,
        resting_hr: restingHr ? parseInt(restingHr) : null,
        soreness: soreness.trim() || null,
        illness_symptoms: illnessSymptoms.trim() || null,
        notes: notes.trim() || null,
      });

    if (recoveryError) {
      setError(recoveryError.message);
      setSaving(false);
      return;
    }

    onDone();
  };

  return (
    <div className="flex flex-col flex-1 pb-10">
      <div className="flex items-center justify-between px-4 pt-10 pb-4">
        <div>
          <p className="text-muted text-xs mb-0.5">
            {standalone ? "Recovery log" : cycleStep === "Rest1" ? "First rest day" : "Second rest day"}
          </p>
          <h1 className="text-xl font-bold">😴 Rest & Recovery</h1>
        </div>
        <button
          onClick={onDone}
          className="text-muted text-xs border border-border rounded-lg px-3 py-1.5 hover:text-white"
        >
          Cancel
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {/* Type */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Activity type
          </p>
          <div className="grid grid-cols-5 gap-2">
            {RECOVERY_TYPES.map(({ type, emoji, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setWorkoutType(type)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                  workoutType === type
                    ? "border-accent bg-accent/10 text-white"
                    : "border-border text-muted hover:text-white"
                }`}
              >
                <span className="text-lg">{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Recovery metrics
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Sauna (min)</label>
              <input type="number" value={saunaMinutes} onChange={(e) => setSaunaMinutes(e.target.value)} placeholder="optional"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Sleep (hrs)</label>
              <input type="number" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="optional"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">HRV</label>
              <input type="number" value={hrv} onChange={(e) => setHrv(e.target.value)} placeholder="optional"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Resting HR</label>
              <input type="number" value={restingHr} onChange={(e) => setRestingHr(e.target.value)} placeholder="optional"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Soreness</label>
            <input type="text" value={soreness} onChange={(e) => setSoreness(e.target.value)} placeholder="e.g. legs, shoulders"
              className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
          </div>
          {workoutType === "Illness" && (
            <div>
              <label className="block text-xs text-muted mb-1">Illness symptoms</label>
              <input type="text" value={illnessSymptoms} onChange={(e) => setIllnessSymptoms(e.target.value)} placeholder="e.g. sore throat, fatigue"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
          )}
          <div>
            <label className="block text-xs text-muted mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling?" rows={2}
              className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm placeholder:text-muted focus:outline-none focus:border-accent resize-none" />
          </div>
        </div>

        {/* Advances cycle toggle */}
        <div
          className="flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3 cursor-pointer"
          onClick={() => setAdvancesCycle(!advancesCycle)}
        >
          <div>
            <p className="text-sm font-medium">Count as cycle day</p>
            <p className="text-xs text-muted mt-0.5">Manually advance the cycle</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors flex items-center ${advancesCycle ? "bg-accent" : "bg-border"}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${advancesCycle ? "translate-x-5" : "translate-x-0"}`} />
          </div>
        </div>

        {error && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-accent text-white font-semibold py-4 rounded-2xl text-sm disabled:opacity-50 hover:bg-accent/90 transition-colors"
        >
          {saving ? "Saving…" : "Log Recovery Day ✓"}
        </button>
      </div>
    </div>
  );
}