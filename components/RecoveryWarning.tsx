import { WorkoutLog } from "@/lib/types";

interface Props {
  logs: WorkoutLog[];
}

function getHardStreak(logs: WorkoutLog[]): number {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );
  let streak = 0;
  for (const log of sorted) {
    if (log.effort !== null && log.effort >= 8) {
      streak++;
    } else if (log.effort !== null) {
      break;
    }
  }
  return streak;
}

function hasRecentIllness(logs: WorkoutLog[], days: number = 3): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return logs.some(
    (l) =>
      l.workout_type === "Illness" &&
      new Date(l.logged_at) >= cutoff
  );
}

function hasRecentHighVolume(logs: WorkoutLog[]): boolean {
  // More than 5 advancing workouts in the last 7 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recentAdvancing = logs.filter(
    (l) => l.advances_cycle && new Date(l.logged_at) >= cutoff
  );
  return recentAdvancing.length >= 5;
}

export default function RecoveryWarning({ logs }: Props) {
  const hardStreak = getHardStreak(logs);
  const illness = hasRecentIllness(logs);
  const highVolume = hasRecentHighVolume(logs);

  if (!illness && hardStreak < 3 && !highVolume) return null;

  const warnings: string[] = [];

  if (illness) {
    warnings.push("Illness logged recently — consider a lighter session or rest day.");
  }
  if (hardStreak >= 3) {
    warnings.push(`${hardStreak} hard efforts in a row — your body may need recovery time.`);
  }
  if (highVolume) {
    warnings.push("High training volume this week — consider dialing back intensity.");
  }

  return (
    <div className="bg-orange-400/10 border border-orange-400/30 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">⚠️</span>
        <p className="text-orange-300 text-xs font-semibold uppercase tracking-wider">
          Recovery check
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {warnings.map((w, i) => (
          <p key={i} className="text-orange-200/80 text-xs leading-relaxed">
            · {w}
          </p>
        ))}
      </div>
    </div>
  );
}