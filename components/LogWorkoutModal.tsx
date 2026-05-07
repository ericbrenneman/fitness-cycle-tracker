"use client";

import { useState } from "react";
import { WorkoutLogInsert, WorkoutType } from "@/lib/types";

const WORKOUT_TYPES: WorkoutType[] = [
  "A", "B", "C", "Cardio", "Rest", "Sauna", "Mobility", "Illness", "Other",
];

const TYPE_META: Record<WorkoutType, { emoji: string; advancesCycle: boolean }> = {
  A:        { emoji: "💪", advancesCycle: true },
  B:        { emoji: "🏋️", advancesCycle: true },
  C:        { emoji: "⚡", advancesCycle: true },
  Cardio:   { emoji: "🏃", advancesCycle: false },
  Rest:     { emoji: "😴", advancesCycle: false },
  Sauna:    { emoji: "🧖", advancesCycle: false },
  Mobility: { emoji: "🤸", advancesCycle: false },
  Illness:  { emoji: "🤒", advancesCycle: false },
  Other:    { emoji: "📝", advancesCycle: false },
};

interface Props {
  onClose: () => void;
  onSubmit: (entry: WorkoutLogInsert) => Promise<string | null>;
}

export default function LogWorkoutModal({ onClose, onSubmit }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [type, setType] = useState<WorkoutType>("A");
  const [duration, setDuration] = useState("60");
  const [effort, setEffort] = useState("7");
  const [notes, setNotes] = useState("");
  const [loggedAt, setLoggedAt] = useState(today);
  const [advancesCycle, setAdvancesCycle] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (t: WorkoutType) => {
    setType(t);
    setAdvancesCycle(TYPE_META[t].advancesCycle);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await onSubmit({
      workout_type: type,
      duration: parseInt(duration) || 0,
      effort: effort ? parseInt(effort) : null,
      notes: notes.trim() || null,
      advances_cycle: advancesCycle,
      logged_at: loggedAt,
    });
    setLoading(false);
    if (err) setError(err);
  };

  const effortLabels: Record<number, string> = {
    1: "Very easy", 2: "Easy", 3: "Light", 4: "Moderate", 5: "Somewhat hard",
    6: "Hard", 7: "Harder", 8: "Very hard", 9: "Very very hard", 10: "Max effort",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[480px] bg-[#1a1d27] rounded-t-3xl border border-border border-b-0 p-6 pb-10 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Log Workout</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {WORKOUT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    type === t
                      ? "border-accent bg-accent/10 text-white"
                      : "border-border bg-card text-muted hover:text-white"
                  }`}
                >
                  <span className="text-lg">{TYPE_META[t].emoji}</span>
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="480"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Effort */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Effort (RPE) — {effort ? `${effort}/10 · ${effortLabels[parseInt(effort)] ?? ""}` : "Optional"}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={effort}
              onChange={(e) => setEffort(e.target.value)}
              className="w-full accent-[#6c63ff]"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel?"
              rows={3}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {/* Advances Cycle */}
          <div
            className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 cursor-pointer"
            onClick={() => setAdvancesCycle(!advancesCycle)}
          >
            <div>
              <p className="text-sm font-medium">Advances cycle</p>
              <p className="text-xs text-muted mt-0.5">Counts toward your training progression</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors flex items-center ${advancesCycle ? "bg-accent" : "bg-border"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${advancesCycle ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-semibold py-3.5 rounded-xl text-sm disabled:opacity-50 hover:bg-accent/90 transition-colors"
          >
            {loading ? "Saving…" : "Save Workout"}
          </button>
        </form>
      </div>
    </div>
  );
}
