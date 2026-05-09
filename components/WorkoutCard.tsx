import { WorkoutLog } from "@/lib/types";

const TYPE_META: Record<string, { emoji: string; color: string; label: string }> = {
  A: {
    emoji: "💪",
    color: "#6c63ff",
    label: "Workout A",
  },
  B: {
    emoji: "🏋️",
    color: "#a78bfa",
    label: "Workout B",
  },
  C: {
    emoji: "⚡",
    color: "#f59e0b",
    label: "Workout C",
  },
  Cardio: {
    emoji: "🏃",
    color: "#ff6584",
    label: "Cardio",
  },
  Rest: {
    emoji: "😴",
    color: "#2ecc71",
    label: "Rest",
  },
  Sauna: {
    emoji: "🧖",
    color: "#f97316",
    label: "Sauna",
  },
  Mobility: {
    emoji: "🤸",
    color: "#06b6d4",
    label: "Mobility",
  },
  Illness: {
    emoji: "🤒",
    color: "#94a3b8",
    label: "Illness",
  },
  Other: {
    emoji: "📝",
    color: "#8b8fa8",
    label: "Other",
  },
  "Red Light": {
    emoji: "💡",
    color: "#ef4444",
    label: "Red Light Therapy",
  },
  PEMF: {
    emoji: "🔋",
    color: "#8b5cf6",
    label: "PEMF Therapy",
  },
};

export default function WorkoutCard({ log }: { log: WorkoutLog }) {
  const workoutType = String(log.workout_type ?? "Other");
  const meta = TYPE_META[workoutType] ?? TYPE_META.Other;

  const [year, month, day] = log.logged_at.split("-").map(Number);
  const date = new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-3.5 flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
        style={{ background: `${meta.color}22` }}
      >
        {meta.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm">
            {meta.label}
          </span>

          <span className="text-muted text-xs flex-shrink-0">
            {date}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-muted text-xs">
            {log.duration ?? 0} min
          </span>

          {log.effort !== null && log.effort !== undefined && (
            <span className="text-muted text-xs">
              RPE {log.effort}/10
            </span>
          )}

          {log.advances_cycle && (
            <span
              className="text-xs font-medium"
              style={{ color: meta.color }}
            >
              ↑ cycle
            </span>
          )}
        </div>

        {log.notes && (
          <p className="text-muted text-xs mt-1 truncate">
            {log.notes}
          </p>
        )}
      </div>
    </div>
  );
}