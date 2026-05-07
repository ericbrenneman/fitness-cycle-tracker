import { WorkoutLog } from "@/lib/types";

export default function WeekSummary({ logs }: { logs: WorkoutLog[] }) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekLogs = logs.filter((l) => new Date(l.logged_at) >= startOfWeek);
  const totalMinutes = weekLogs.reduce((sum, l) => sum + l.duration, 0);
  const totalSessions = weekLogs.length;
  const cycleWorkouts = weekLogs.filter((l) => l.advances_cycle).length;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">This Week</p>
      <div className="grid grid-cols-3 gap-3">
        <StatItem value={timeStr} label="Total Time" accent="#6c63ff" />
        <StatItem value={String(totalSessions)} label="Sessions" accent="#2ecc71" />
        <StatItem value={String(cycleWorkouts)} label="Cycle Days" accent="#f59e0b" />
      </div>
    </div>
  );
}

function StatItem({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold" style={{ color: accent }}>{value}</p>
      <p className="text-muted text-xs mt-0.5">{label}</p>
    </div>
  );
}
