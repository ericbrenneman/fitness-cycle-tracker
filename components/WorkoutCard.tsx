import { WorkoutLog, WorkoutType } from "@/lib/types";

const TYPE_META: Record<WorkoutType, { emoji: string; color: string }> = {
  A:        { emoji: "💪", color: "#6c63ff" },
  B:        { emoji: "🏋️", color: "#a78bfa" },
  C:        { emoji: "⚡", color: "#f59e0b" },
  Cardio:   { emoji: "🏃", color: "#ff6584" },
  Rest:     { emoji: "😴", color: "#2ecc71" },
  Sauna:    { emoji: "🧖", color: "#f97316" },
  Mobility: { emoji: "🤸", color: "#06b6d4" },
  Illness:  { emoji: "🤒", color: "#94a3b8" },
  Other:    { emoji: "📝", color: "#8b8fa8" },
};

export default function WorkoutCard({ log }: { log: WorkoutLog }) {
  const meta = TYPE_META[log.workout_type];
  const date = new Date(log.logged_at);
  const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-3.5 flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
        style={{ background: meta.color + "22" }}
      >
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm">{log.workout_type}</span>
          <span className="text-muted text-xs flex-shrink-0">{dateStr}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-muted text-xs">{log.duration} min</span>
          {log.effort !== null && (
            <span className="text-muted text-xs">RPE {log.effort}/10</span>
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
    </div>
  );
}
