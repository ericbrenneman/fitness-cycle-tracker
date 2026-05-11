        "use client";

        import { saveCycleState, workoutTypeToCycleStep, loadCycleState } from "@/lib/cycle";
        import { useState, useRef } from "react";
        import { createClient } from "@/lib/supabase/client";
        import { WorkoutType } from "@/lib/types";

        interface Props {
          cycleStep: "Rest1" | "Rest2";
          onDone: () => void;
          standalone?: boolean;
        }

        const RECOVERY_TYPES: { type: WorkoutType; emoji: string; label: string }[] = [
          { type: "Rest",       emoji: "😴", label: "Rest" },
          { type: "Sauna",      emoji: "🧖", label: "Sauna" },
          { type: "Mobility",   emoji: "🤸", label: "Mobility" },
          { type: "Illness",    emoji: "🤒", label: "Illness" },
          { type: "Red Light",  emoji: "💡", label: "Red Light" },
          { type: "PEMF",       emoji: "🔋", label: "PEMF" },
          { type: "Other",      emoji: "📝", label: "Other" },
        ];

        const RECOVERY_TAGS: { label: string; emoji: string; color: string }[] = [
          { label: "Energized",   emoji: "⚡", color: "#2ecc71" },
          { label: "Sore",        emoji: "😬", color: "#f59e0b" },
          { label: "Tired",       emoji: "😴", color: "#6b7280" },
          { label: "Stressed",    emoji: "😤", color: "#ef4444" },
          { label: "Poor Sleep",  emoji: "🌙", color: "#8b5cf6" },
          { label: "Bloated",     emoji: "🫠", color: "#f97316" },
          { label: "Strong",      emoji: "💪", color: "#06b6d4" },
          { label: "Motivated",   emoji: "🔥", color: "#6c63ff" },
          { label: "Cycle Phase", emoji: "🌸", color: "#ec4899" },
          { label: "Sick",        emoji: "🤒", color: "#94a3b8" },
          { label: "Calm",        emoji: "🧘", color: "#2ecc71" },
          { label: "Achy",        emoji: "🩹", color: "#f59e0b" },
        ];

        export default function RecoveryLogger({ cycleStep, onDone, standalone = false }: Props) {
          const supabaseRef = useRef(createClient());
          const supabase = supabaseRef.current;

          const [saving, setSaving] = useState(false);
          const [saveError, setSaveError] = useState<string | null>(null);
          const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
          const [selectedTypes, setSelectedTypes] = useState<WorkoutType[]>(["Rest"]);

          const toggleType = (type: WorkoutType) => {
            setSelectedTypes((prev) =>
              prev.includes(type)
                ? prev.length > 1 ? prev.filter((t) => t !== type) : prev
                : [...prev, type]
            );
          };
          const [advancesCycle, setAdvancesCycle] = useState(!standalone);
          const [saunaMinutes, setSaunaMinutes] = useState("");
          const [sleepHours, setSleepHours] = useState("");
          const [hrv, setHrv] = useState("");
          const [restingHr, setRestingHr] = useState("");
          const [soreness, setSoreness] = useState("");
          const [illnessSymptoms, setIllnessSymptoms] = useState("");
          const [notes, setNotes] = useState("");
          const [selectedTags, setSelectedTags] = useState<string[]>([]);
          const [saunaTemp, setSaunaTemp] = useState<string>("");

          const toggleTag = (tag: string) => {
            setSelectedTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            );
          };

          const handleSave = async () => {
            setSaving(true);
            setSaveError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              setSaveError("Not logged in");
              setSaving(false);
              return;
            }

            const workoutPayload = {
              user_id: session.user.id,
              workout_type: selectedTypes[0],
              logged_at: date,
              duration: saunaMinutes ? parseInt(saunaMinutes) : 0,
              effort: null,
              notes: selectedTypes.length > 1
                ? `${selectedTypes.join(" + ")}${notes.trim() ? " — " + notes.trim() : ""}`
                : notes.trim() || null,
              advances_cycle: advancesCycle,
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: logData, error: logError } = await (supabase.from("workout_logs") as any)
              .insert(workoutPayload)
              .select()
              .single();

            if (logError || !logData) {
              setSaveError(logError?.message ?? "Failed to save");
              setSaving(false);
              return;
            }

            const recoveryPayload = {
              workout_log_id: logData.id,
              sauna_minutes: saunaMinutes ? parseInt(saunaMinutes) : null,
              sauna_temp: saunaTemp ? parseInt(saunaTemp) : null,
              sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
              hrv: hrv ? parseInt(hrv) : null,
              resting_hr: restingHr ? parseInt(restingHr) : null,
              soreness: soreness.trim() || null,
              illness_symptoms: illnessSymptoms.trim() || null,
              notes: notes.trim() || null,
              recovery_tags: selectedTags.length > 0 ? selectedTags : null,
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: recoveryError } = await (supabase.from("recovery_details") as any)
              .insert(recoveryPayload);

            if (recoveryError) {
              setSaveError(recoveryError.message);
              setSaving(false);
              return;
            }

            if (advancesCycle) {
              const state = await loadCycleState(supabase, session.user.id);
              const expectedNext = state?.current_step ?? "Rest1";
              const completedStep = workoutTypeToCycleStep(workoutType, expectedNext as any);
              if (completedStep) {
                await saveCycleState(supabase, session.user.id, completedStep);
              }
            }

            onDone();
          };

          return (
            <div className="flex flex-col flex-1 pb-28">
              <div className="flex items-center justify-between px-4 pt-10 pb-4">
                <div>
                  <p className="text-muted text-xs mb-0.5">
                    {standalone
                      ? "Recovery log"
                      : cycleStep === "Rest1"
                      ? "First rest day"
                      : "Second rest day"}
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

                {/* Activity type */}
                <div className="bg-surface border border-border rounded-2xl p-4">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                    Activity type
                  </p>
                  <p className="text-xs text-muted mb-2">Select all that apply</p>
                  <div className="grid grid-cols-4 gap-2">
                    {RECOVERY_TYPES.map(({ type, emoji, label }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleType(type)}
                        className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                          selectedTypes.includes(type)
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

                {/* Recovery tags */}
                <div className="bg-surface border border-border rounded-2xl p-4">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    How are you feeling?
                  </p>
                  <p className="text-xs text-muted mb-3">Select all that apply</p>
                  <div className="flex flex-wrap gap-2">
                    {RECOVERY_TAGS.map(({ label, emoji, color }) => {
                      const selected = selectedTags.includes(label);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleTag(label)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                            selected
                              ? "text-white border-transparent"
                              : "border-border text-muted hover:text-white"
                          }`}
                          style={selected ? { background: color + "33", borderColor: color } : {}}
                        >
                          <span>{emoji}</span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
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
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={saunaMinutes}
                        onChange={(e) => setSaunaMinutes(e.target.value)}
                        placeholder="optional"
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Sauna Temp (1–15)</label>
                      <select
                        value={saunaTemp}
                        onChange={(e) => setSaunaTemp(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                      >
                        <option value="">—</option>
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={String(n)}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Sleep (hrs)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value)}
                        placeholder="optional"
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">HRV</label>
                      <input
                        type="number"
                        value={hrv}
                        onChange={(e) => setHrv(e.target.value)}
                        placeholder="optional"
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Resting HR</label>
                      <input
                        type="number"
                        value={restingHr}
                        onChange={(e) => setRestingHr(e.target.value)}
                        placeholder="optional"
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Soreness</label>
                    <input
                      type="text"
                      value={soreness}
                      onChange={(e) => setSoreness(e.target.value)}
                      placeholder="e.g. legs, shoulders"
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  {selectedTypes.includes("Illness") && (
                    <div>
                      <label className="block text-xs text-muted mb-1">Illness symptoms</label>
                      <input
                        type="text"
                        value={illnessSymptoms}
                        onChange={(e) => setIllnessSymptoms(e.target.value)}
                        placeholder="e.g. sore throat, fatigue"
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-muted mb-1">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="How are you feeling?"
                      rows={2}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-white text-sm placeholder:text-muted focus:outline-none focus:border-accent resize-none"
                    />
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

                {saveError && (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                    <p className="text-red-400 text-xs">{saveError}</p>
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