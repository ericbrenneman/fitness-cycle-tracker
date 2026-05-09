import { WorkoutLog } from "@/lib/types";

export default function WeekSummary({ logs }: { logs: WorkoutLog[] }) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekLogs = logs.filter((l) => {
    const [year, month, day] = l.logged_at.split("-").map(Number);
    const entryDate = new Date(year, month - 1, day);
    return entryDate >= startOfWeek;
  });

  const trainingLogs = weekLogs.filter((l) =>
    ["A", "B", "C", "Cardio"].includes(l.workout_type)
  );
  const recoveryLogs = weekLogs.filter((l) =>
    ["Rest", "Sauna", "Mobility"].includes(l.workout_type)
  );

  const trainingMinutes = trainingLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0);
  const recoveryMinutes = recoveryLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0);
  const totalMinutes = weekLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0);

  const trainingDays = new Set(trainingLogs.map((l) => l.logged_at)).size;
  const recoveryDays = new Set(recoveryLogs.map((l) => l.logged_at)).size;

  function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        This Week
      </p>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatItem value={formatTime(totalMinutes)} label="Total Time" color="#6c63ff" />
        <StatItem value={String(trainingDays)} label="Training Days" color="#2ecc71" />
        <StatItem value={String(recoveryDays)} label="Recovery Days" color="#06b6d4" />
      </div>

      {/* Training vs Recovery bar */}
      {totalMinutes > 0 && (
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>🏋️ Training — {formatTime(trainingMinutes)}</span>
            <span>🧖 Recovery — {formatTime(recoveryMinutes)}</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full rounded-l-full transition-all"
              style={{
                width: `${Math.round((trainingMinutes / totalMinutes) * 100)}%`,
                background: "#6c63ff",
              }}
            />
            <div
              className="h-full rounded-r-full transition-all"
              style={{
                width: `${Math.round((recoveryMinutes / totalMinutes) * 100)}%`,
                background: "#06b6d4",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>{Math.round((trainingMinutes / totalMinutes) * 100)}% training</span>
            <span>{Math.round((recoveryMinutes / totalMinutes) * 100)}% recovery</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-muted text-xs mt-0.5">{label}</p>
    </div>
  );
}