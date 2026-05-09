"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { CardioTemplate, CycleStep, CardioModality } from "@/lib/types";

interface Props {
  cycleStep: "Cardio1" | "Cardio2";
  template: CardioTemplate;
  onDone: () => void;
}

const MODALITIES: CardioModality[] = [
  "Peloton", "Treadmill", "Bike", "Rower", "Elliptical", "Outdoor Walk", "Other",
];

export default function CardioLogger({ cycleStep, template, onDone }: Props) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState(String(template.duration_range[0]));
  const [effort, setEffort] = useState(cycleStep === "Cardio1" ? "4" : "7");
  const [modality, setModality] = useState<CardioModality | "">("");
  const [distance, setDistance] = useState("");
  const [avgWatts, setAvgWatts] = useState("");
  const [totalKj, setTotalKj] = useState("");
  const [avgHr, setAvgHr] = useState("");
  const [maxHr, setMaxHr] = useState("");
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
        workout_type: "Cardio",
        logged_at: date,
        duration: parseInt(duration) || 0,
        effort: effort ? parseInt(effort) : null,
        notes: notes.trim() || null,
        advances_cycle: true,
      })
      .select()
      .single();

    if (logError || !logData) {
      setError(logError?.message ?? "Failed to save");
      setSaving(false);
      return;
    }

    const { error: cardioError } = await supabase
      .from("cardio_details")
      .insert({
        workout_log_id: logData.id,
        modality: modality || null,
        distance: distance ? parseFloat(distance) : null,
        avg_watts: avgWatts ? parseInt(avgWatts) : null,
        total_output_kj: totalKj ? parseInt(totalKj) : null,
        avg_heart_rate: avgHr ? parseInt(avgHr) : null,
        max_heart_rate: maxHr ? parseInt(maxHr) : null,
        notes: notes.trim() || null,
      });

    if (cardioError) {
      setError(cardioError.message);
      setSaving(false);
      return;
    }

    onDone();
  };

  return (
    <div className="flex flex-col flex-1 pb-10">
      <div className="flex items-center justify-between px-4 pt-10 pb-4">
        <div>
          <p className="text-muted text-xs mb-0.5">Starting workout</p>
          <h1 className="text-xl font-bold">
            {cycleStep === "Cardio1" ? "🚴" : "⚡"} {template.name}
          </h1>
        </div>
        <button
          onClick={onDone}
          className="text-muted text-xs border border-border rounded-lg px-3 py-1.5 hover:text-white"
        >
          Cancel
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {/* Instructions card */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Today's prescription
          </p>
          <p className="text-sm leading-relaxed text-white/80">{template.instructions}</p>
          <div className="flex gap-3 mt-3">
            <span className="text-xs bg-white/10 rounded-lg px-2 py-1">
              {template.duration_range[0]}–{template.duration_range[1]} min
            </span>
            <span className="text-xs bg-white/10 rounded-lg px-2 py-1">
              {template.effort}
            </span>
          </div>
        </div>

        {/* Modality */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Activity
          </p>
          <div className="grid grid-cols-3 gap-2">
            {MODALITIES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModality(m)}
                className={`py-2 px-2 rounded-xl border text-xs font-medium transition-all ${
                  modality === m
                    ? "border-accent bg-accent/10 text-white"
                    : "border-border text-muted hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Metrics
          </p>
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
            <div>
              <label className="block text-xs text-muted mb-1">Distance (mi/km)</label>
              <input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="optional"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Avg Watts</label>
              <input type="number" value={avgWatts} onChange={(e) => setAvgWatts(e.target.value)} placeholder="optional"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Total Output (kJ)</label>
              <input type="number" value={totalKj} onChange={(e) => setTotalKj(e.target.value)} placeholder="optional"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Avg Heart Rate</label>
              <input type="number" value={avgHr} onChange={(e) => setAvgHr(e.target.value)} placeholder="optional"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Max Heart Rate</label>
              <input type="number" value={maxHr} onChange={(e) => setMaxHr(e.target.value)} placeholder="optional"
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Effort — RPE {effort}/10
            </label>
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
          {saving ? "Saving…" : "Complete Cardio ✓"}
        </button>
      </div>
    </div>
  );
}