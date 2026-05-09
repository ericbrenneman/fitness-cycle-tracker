"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WorkoutLog, StrengthExercise, CardioDetail, RecoveryDetail } from "@/lib/types";

interface WorkoutLogFull extends WorkoutLog {
  strength_exercises: StrengthExercise[];
  cardio_detail: CardioDetail | null;
  recovery_detail: RecoveryDetail | null;
}

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  A:        { emoji: "💪", color: "#6c63ff" },
  B:        { emoji: "🏋️", color: "#a78bfa" },
  C:        { emoji: "🔥", color: "#f59e0b" },
  Cardio:   { emoji: "🚴", color: "#2ecc71" },
  Rest:     { emoji: "😴", color: "#06b6d4" },
  Sauna:    { emoji: "🧖", color: "#f97316" },
  Mobility: { emoji: "🤸", color: "#06b6d4" },
  Illness:  { emoji: "🤒", color: "#94a3b8" },
  Other:    { emoji: "📝", color: "#8b8fa8" },
};

const TYPE_LABELS: Record<string, string> = {
  A: "Workout A — Push + Legs",
  B: "Workout B — Pull + Hinge",
  C: "Workout C — Full Body",
  Cardio: "Cardio",
  Rest: "Rest",
  Sauna: "Sauna",
  Mobility: "Mobility",
  Illness: "Illness",
  Other: "Other",
};

async function fetchAllLogs(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<WorkoutLogFull[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logsData, error: logsError } = await (supabase.from("workout_logs") as any)
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (logsError) {
    console.error("[history workout_logs error]", logsError);
    return [];
  }

  if (!logsData || logsData.length === 0) return [];

  const logs = logsData as WorkoutLog[];
  const logIds = logs.map((l) => l.id);

  const [strengthRes, cardioRes, recoveryRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("strength_exercises") as any)
      .select("*")
      .in("workout_log_id", logIds),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("cardio_details") as any)
      .select("*")
      .in("workout_log_id", logIds),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("recovery_details") as any)
      .select("*")
      .in("workout_log_id", logIds),
  ]);

  if (strengthRes.error) {
    console.error("[history strength_exercises error]", strengthRes.error);
  }

  if (cardioRes.error) {
    console.error("[history cardio_details error]", cardioRes.error);
  }

  if (recoveryRes.error) {
    console.error("[history recovery_details error]", recoveryRes.error);
  }

  const strengthByLog = new Map<string, StrengthExercise[]>();

  for (const s of (strengthRes.data ?? []) as StrengthExercise[]) {
    if (!strengthByLog.has(s.workout_log_id)) {
      strengthByLog.set(s.workout_log_id, []);
    }

    strengthByLog.get(s.workout_log_id)!.push(s);
  }

  const cardioByLog = new Map<string, CardioDetail>();

  for (const c of (cardioRes.data ?? []) as CardioDetail[]) {
    cardioByLog.set(c.workout_log_id, c);
  }

  const recoveryByLog = new Map<string, RecoveryDetail>();

  for (const r of (recoveryRes.data ?? []) as RecoveryDetail[]) {
    recoveryByLog.set(r.workout_log_id, r);
  }

  return logs.map((log) => ({
    ...log,
    strength_exercises: strengthByLog.get(log.id) ?? [],
    cardio_detail: cardioByLog.get(log.id) ?? null,
    recovery_detail: recoveryByLog.get(log.id) ?? null,
  }));
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<WorkoutLogFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WorkoutLogFull | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const reload = async (uid: string) => {
    const fresh = await fetchAllLogs(supabase, uid);
    setLogs(fresh);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }
      setUserId(session.user.id);
      const fresh = await fetchAllLogs(supabase, session.user.id);
      setLogs(fresh);
      setLoading(false);
    };
    init();
  }, []);

  const handleDelete = async (log: WorkoutLogFull) => {
    const { error } = await supabase
      .from("workout_logs")
      .delete()
      .eq("id", log.id);
    if (!error && userId) {
      setSelected(null);
      await reload(userId);
    }
  };

  const handleUpdate = async (log: WorkoutLogFull) => {
    setSelected(null);
    if (userId) await reload(userId);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted text-sm">Loading history…</p>
      </div>
    );
  }

  if (selected) {
    return (
      <DetailView
        log={selected}
        onBack={() => setSelected(null)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        supabase={supabase}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="flex items-center justify-between px-4 pt-10 pb-6">
        <div>
          <h1 className="text-xl font-bold">History</h1>
          <p className="text-muted text-xs mt-0.5">{logs.length} entries</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4">
        {logs.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <p className="text-muted text-sm">No workouts logged yet.</p>
          </div>
        ) : (
          logs.map((log) => {
            const meta = TYPE_META[log.workout_type] ?? TYPE_META.Other;
            const [yr, mo, dy] = log.logged_at.split("-").map(Number);
            const date = new Date(yr, mo - 1, dy).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            });
            return (
              <button
                key={log.id}
                onClick={() => setSelected(log)}
                className="bg-surface border border-border rounded-2xl px-4 py-3.5 flex items-start gap-3 text-left hover:border-accent/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                  style={{ background: meta.color + "22" }}
                >
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                 <span className="font-semibold text-sm">
                    {TYPE_LABELS[log.workout_type] ?? log.workout_type}
                 </span>
                    <span className="text-muted text-xs flex-shrink-0">{date}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-muted text-xs">{log.duration} min</span>
                    {log.effort !== null && (
                      <span className="text-muted text-xs">RPE {log.effort}/10</span>
                    )}
                    {log.strength_exercises.length > 0 && (
                      <span className="text-muted text-xs">
                        {log.strength_exercises.length} sets logged
                      </span>
                    )}
                    {log.cardio_detail?.modality && (
                      <span className="text-muted text-xs">{log.cardio_detail.modality}</span>
                    )}
                    {log.advances_cycle && (
                      <span className="text-xs font-medium" style={{ color: meta.color }}>
                        ↑ cycle
                      </span>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-muted text-xs mt-1 truncate">{log.notes}</p>
                  )}
                </div>
                <span className="text-muted text-xs mt-1">›</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================
// Detail + Edit view
// ============================================================
function DetailView({
  log,
  onBack,
  onDelete,
  onUpdate,
  supabase,
}: {
  log: WorkoutLogFull;
  onBack: () => void;
  onDelete: (log: WorkoutLogFull) => void;
  onUpdate: (log: WorkoutLogFull) => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const meta = TYPE_META[log.workout_type] ?? TYPE_META.Other;
  const [yr, mo, dy] = log.logged_at.split("-").map(Number);
  const date = new Date(yr, mo - 1, dy).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [editDate, setEditDate] = useState(log.logged_at);
  const [editDuration, setEditDuration] = useState(String(log.duration));
  const [editEffort, setEditEffort] = useState(String(log.effort ?? ""));
  const [editNotes, setEditNotes] = useState(log.notes ?? "");
  const [editAdvances, setEditAdvances] = useState(log.advances_cycle);

  const handleSave = async () => {
    setSaving(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("workout_logs") as any)
      .update({
        logged_at: editDate,
        duration: parseInt(editDuration) || 0,
        effort: editEffort ? parseInt(editEffort) : null,
        notes: editNotes || null,
        advances_cycle: editAdvances,
      })
      .eq("id", log.id);

    setSaving(false);

    if (!error) {
      setEditing(false);
      onUpdate(log);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    onDelete(log);
  };

  const exerciseMap = new Map<string, StrengthExercise[]>();
  for (const s of log.strength_exercises) {
    if (!exerciseMap.has(s.exercise_name)) exerciseMap.set(s.exercise_name, []);
    exerciseMap.get(s.exercise_name)!.push(s);
  }

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4">
        <button onClick={onBack} className="text-muted text-sm hover:text-white transition-colors">
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
              editing
                ? "border-accent text-accent"
                : "border-border text-muted hover:text-white"
            }`}
          >
            {editing ? "Cancel" : "✏️ Edit"}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs border border-red-400/30 text-red-400 rounded-lg px-3 py-1.5 hover:bg-red-400/10 transition-colors"
          >
            🗑 Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mx-4 mb-4 bg-red-400/10 border border-red-400/30 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-300 mb-1">Delete this entry?</p>
          <p className="text-xs text-red-300/70 mb-3">
            This will permanently delete the workout and all its sets. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-500 text-white text-xs font-semibold py-2 rounded-xl disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 bg-surface border border-border text-white text-xs font-semibold py-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 px-4">
        {/* Title / edit card */}
        <div
          className="rounded-2xl p-4 border"
          style={{ background: meta.color + "18", borderColor: meta.color + "44" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{meta.emoji}</span>
            <div>
              <p className="font-bold text-base">{TYPE_LABELS[log.workout_type] ?? log.workout_type}</p>
              <p className="text-muted text-xs mt-0.5">{date}</p>
            </div>
          </div>

          {editing ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">
                  Effort — RPE {editEffort || "—"}/10
                </label>
                <input
                  type="range" min="1" max="10"
                  value={editEffort || "5"}
                  onChange={(e) => setEditEffort(e.target.value)}
                  className="w-full accent-[#6c63ff]"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent resize-none"
                />
              </div>
              <div
                className="flex items-center justify-between bg-black/20 border border-white/20 rounded-xl px-3 py-2 cursor-pointer"
                onClick={() => setEditAdvances(!editAdvances)}
              >
                <p className="text-xs text-white">Advances cycle</p>
                <div className={`w-9 h-5 rounded-full flex items-center transition-colors ${editAdvances ? "bg-accent" : "bg-white/20"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${editAdvances ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-accent text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          ) : (
            <div className="flex gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted">Duration</p>
                <p className="text-sm font-semibold">{log.duration} min</p>
              </div>
              {log.effort !== null && (
                <div>
                  <p className="text-xs text-muted">Effort</p>
                  <p className="text-sm font-semibold">RPE {log.effort}/10</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted">Cycle</p>
                <p className="text-sm font-semibold">
                  {log.advances_cycle ? "↑ Advances" : "— No change"}
                </p>
              </div>
              {log.notes && (
                <p className="text-sm text-white/70 mt-1 leading-relaxed w-full">{log.notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Strength exercises */}
        {exerciseMap.size > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Exercises
            </p>
            <div className="flex flex-col gap-4">
              {Array.from(exerciseMap.entries()).map(([name, sets]) => (
                <div key={name}>
                  <p className="text-sm font-semibold mb-2">{name}</p>
                  <div className="flex flex-col gap-1">
                    {sets
                      .sort((a, b) => a.set_number - b.set_number)
                      .map((set) => (
                        <div key={set.id} className="flex items-center gap-3 text-xs text-muted">
                          <span className="w-10 text-white font-medium">Set {set.set_number}</span>
                          <span>{set.weight !== null ? `${set.weight} ${set.unit}` : "—"}</span>
                          <span>×</span>
                          <span>{set.reps !== null ? `${set.reps} reps` : "—"}</span>
                          {set.perceived_difficulty && (
                            <span className={`ml-auto font-medium ${
                              set.perceived_difficulty === "Easy" ? "text-green-400"
                              : set.perceived_difficulty === "Moderate" ? "text-yellow-400"
                              : "text-red-400"
                            }`}>
                              {set.perceived_difficulty}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cardio details */}
        {log.cardio_detail && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Cardio Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              {log.cardio_detail.modality && <Stat label="Modality" value={log.cardio_detail.modality} />}
              {log.cardio_detail.distance !== null && <Stat label="Distance" value={`${log.cardio_detail.distance}`} />}
              {log.cardio_detail.avg_watts !== null && <Stat label="Avg Watts" value={`${log.cardio_detail.avg_watts} W`} />}
              {log.cardio_detail.total_output_kj !== null && <Stat label="Total Output" value={`${log.cardio_detail.total_output_kj} kJ`} />}
              {log.cardio_detail.avg_heart_rate !== null && <Stat label="Avg HR" value={`${log.cardio_detail.avg_heart_rate} bpm`} />}
              {log.cardio_detail.max_heart_rate !== null && <Stat label="Max HR" value={`${log.cardio_detail.max_heart_rate} bpm`} />}
            </div>
            {log.cardio_detail.notes && (
              <p className="text-sm text-white/70 mt-3">{log.cardio_detail.notes}</p>
            )}
          </div>
        )}

        {/* Recovery details */}
        {log.recovery_detail && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Recovery Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              {log.recovery_detail.sauna_minutes !== null && <Stat label="Sauna" value={`${log.recovery_detail.sauna_minutes} min`} />}
              {log.recovery_detail.sleep_hours !== null && <Stat label="Sleep" value={`${log.recovery_detail.sleep_hours} hrs`} />}
              {log.recovery_detail.hrv !== null && <Stat label="HRV" value={`${log.recovery_detail.hrv}`} />}
              {log.recovery_detail.resting_hr !== null && <Stat label="Resting HR" value={`${log.recovery_detail.resting_hr} bpm`} />}
              {log.recovery_detail.soreness && <Stat label="Soreness" value={log.recovery_detail.soreness} />}
              {log.recovery_detail.illness_symptoms && <Stat label="Symptoms" value={log.recovery_detail.illness_symptoms} />}
            </div>
            {(log.recovery_detail as any).recovery_tags?.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-3">
    {(log.recovery_detail as any).recovery_tags.map((tag: string) => (
      <span
        key={tag}
        className="text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white"
      >
        {tag}
      </span>
    ))}
  </div>
)}
{log.recovery_detail.notes && (
  <p className="text-sm text-white/70 mt-3">{log.recovery_detail.notes}</p>
)}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}