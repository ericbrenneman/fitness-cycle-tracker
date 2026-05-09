"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { STRENGTH_TEMPLATES } from "@/lib/templates";
import {
  loadAllUserTemplates,
  saveUserTemplate,
  resetUserTemplate,
  UserExercise,
} from "@/lib/userTemplates";
import { WorkoutTemplate } from "@/lib/types";

const WORKOUT_TYPES: ("A" | "B" | "C")[] = ["A", "B", "C"];

const TYPE_META = {
  A: { emoji: "💪", label: "Workout A — Push + Legs" },
  B: { emoji: "🏋️", label: "Workout B — Pull + Hinge" },
  C: { emoji: "🔥", label: "Workout C — Full Body" },
};

export default function SettingsPage() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Record<"A" | "B" | "C", WorkoutTemplate> | null>(null);
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C">("A");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Editable exercises for each workout type
  const [exercises, setExercises] = useState<Record<"A" | "B" | "C", UserExercise[]>>({
    A: [],
    B: [],
    C: [],
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }
      setUserId(session.user.id);

      const loaded = await loadAllUserTemplates(supabase, session.user.id);
      setTemplates(loaded);

      setExercises({
        A: loaded.A.exercises.map(ex => ({ ...ex })),
        B: loaded.B.exercises.map(ex => ({ ...ex })),
        C: loaded.C.exercises.map(ex => ({ ...ex })),
      });

      setLoading(false);
    };
    init();
  }, []);

  const updateExercise = (
    type: "A" | "B" | "C",
    idx: number,
    field: keyof UserExercise,
    value: string | number | boolean | [number, number]
  ) => {
    setExercises((prev) => {
      const updated = [...prev[type]];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, [type]: updated };
    });
  };

  const addExercise = (type: "A" | "B" | "C") => {
    setExercises((prev) => ({
      ...prev,
      [type]: [
        ...prev[type],
        {
          name: "",
          default_sets: 3,
          default_reps_range: [8, 12] as [number, number],
          timed: false,
          optional: false,
          notes: "",
        },
      ],
    }));
  };

  const removeExercise = (type: "A" | "B" | "C", idx: number) => {
    setExercises((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== idx),
    }));
  };

  const moveExercise = (type: "A" | "B" | "C", idx: number, dir: -1 | 1) => {
    setExercises((prev) => {
      const arr = [...prev[type]];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...prev, [type]: arr };
    });
  };

  const handleSave = async (type: "A" | "B" | "C") => {
    if (!userId) return;
    setSaving(true);
    setSaveMsg(null);
    const err = await saveUserTemplate(supabase, userId, type, exercises[type]);
    setSaving(false);
    setSaveMsg(err ? `Error: ${err}` : "Saved ✓");
    setTimeout(() => setSaveMsg(null), 2000);
  };

  const handleReset = async (type: "A" | "B" | "C") => {
    if (!userId) return;
    await resetUserTemplate(supabase, userId, type);
    const defaults = STRENGTH_TEMPLATES[type].exercises.map(ex => ({ ...ex }));
    setExercises((prev) => ({ ...prev, [type]: defaults }));
    setSaveMsg("Reset to default ✓");
    setTimeout(() => setSaveMsg(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted text-sm">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="flex items-center justify-between px-4 pt-10 pb-6">
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-muted text-xs mt-0.5">Customize your workout templates</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 bg-surface border border-border rounded-xl p-1">
        {WORKOUT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === type
                ? "bg-accent text-white"
                : "text-muted hover:text-white"
            }`}
          >
            {TYPE_META[type].emoji} {type}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            {TYPE_META[activeTab].label}
          </p>
          <p className="text-xs text-muted mb-4">
            Customize the exercises for this workout. Changes only affect your account.
          </p>

          {/* Exercise list */}
          <div className="flex flex-col gap-3">
            {exercises[activeTab].map((ex, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2"
              >
                {/* Exercise name */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveExercise(activeTab, idx, -1)}
                      disabled={idx === 0}
                      className="text-muted hover:text-white disabled:opacity-20 text-xs leading-none"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveExercise(activeTab, idx, 1)}
                      disabled={idx === exercises[activeTab].length - 1}
                      className="text-muted hover:text-white disabled:opacity-20 text-xs leading-none"
                    >
                      ▼
                    </button>
                  </div>
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => updateExercise(activeTab, idx, "name", e.target.value)}
                    placeholder="Exercise name"
                    className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => removeExercise(activeTab, idx)}
                    className="text-red-400/60 hover:text-red-400 text-xs px-2"
                  >
                    ✕
                  </button>
                </div>

                {/* Sets + reps */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-muted mb-1">Sets</label>
                    <input
                      type="number"
                      value={ex.default_sets}
                      onChange={(e) => updateExercise(activeTab, idx, "default_sets", parseInt(e.target.value) || 3)}
                      className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Reps min</label>
                    <input
                      type="number"
                      value={ex.default_reps_range[0]}
                      onChange={(e) => updateExercise(activeTab, idx, "default_reps_range", [parseInt(e.target.value) || 8, ex.default_reps_range[1]])}
                      className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Reps max</label>
                    <input
                      type="number"
                      value={ex.default_reps_range[1]}
                      onChange={(e) => updateExercise(activeTab, idx, "default_reps_range", [ex.default_reps_range[0], parseInt(e.target.value) || 12])}
                      className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent text-center"
                    />
                  </div>
                </div>

                {/* Notes */}
                <input
                  type="text"
                  value={ex.notes}
                  onChange={(e) => updateExercise(activeTab, idx, "notes", e.target.value)}
                  placeholder="Notes / cues (optional)"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-accent"
                />

                {/* Toggles */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ex.timed}
                      onChange={(e) => updateExercise(activeTab, idx, "timed", e.target.checked)}
                      className="accent-[#6c63ff]"
                    />
                    <span className="text-xs text-muted">Timed (seconds)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ex.optional}
                      onChange={(e) => updateExercise(activeTab, idx, "optional", e.target.checked)}
                      className="accent-[#6c63ff]"
                    />
                    <span className="text-xs text-muted">Optional</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Add exercise */}
          <button
            onClick={() => addExercise(activeTab)}
            className="w-full mt-3 border border-dashed border-border rounded-xl py-3 text-sm text-muted hover:text-white hover:border-accent/50 transition-colors"
          >
            + Add Exercise
          </button>
        </div>

        {/* Save / Reset */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(activeTab)}
            disabled={saving}
            className="flex-1 bg-accent text-white font-semibold py-3 rounded-2xl text-sm disabled:opacity-50 hover:bg-accent/90 transition-colors"
          >
            {saving ? "Saving…" : "Save Workout " + activeTab}
          </button>
          <button
            onClick={() => handleReset(activeTab)}
            className="border border-border text-muted text-sm font-medium px-4 py-3 rounded-2xl hover:text-white hover:border-accent/50 transition-colors"
          >
            Reset
          </button>
        </div>

        {saveMsg && (
          <p className={`text-xs text-center ${saveMsg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
            {saveMsg}
          </p>
        )}
      </div>
    </div>
  );
}