import { WorkoutLog, WorkoutType } from "@/lib/types";

const CYCLE_SEQUENCE: WorkoutType[] = ["A", "B", "C"];

const TYPE_META: Record<WorkoutType, { emoji: string; description: string }> = {
  A:        { emoji: "💪", description: "Strength session A" },
  B:        { emoji: "🏋️", description: "Strength session B" },
  C:        { emoji: "⚡", description: "Strength session C" },
  Cardio:   { emoji: "🏃", description: "Cardio session" },
  Rest:     { emoji: "😴", description: "Rest day" },
  Sauna:    { emoji: "🧖", description: "Recovery sauna" },
  Mobility: { emoji: "🤸", description: "Mobility work" },
  Illness:  { emoji: "🤒", description: "Rest — take care" },
  Other:    { emoji: "📝", description: "Other activity" },
};

export default function NextWorkout({ logs }: { logs: WorkoutLog[] }) {
  const cycleLogs = logs.filter((l) => CYCLE_SEQUENCE.includes(l.workout_type));
  const lastCycle = cycleLogs[0];

  let next: WorkoutType = "A";
  if (lastCycle) {
    const idx = CYCLE_SEQUENCE.indexOf(lastCycle.workout_type as WorkoutType);
    next = CYCLE_SEQUENCE[(idx + 1) % CYCLE_SEQUENCE.length];
  }

  const lastLogDate = logs[0] ? new Date(logs[0].logged_at) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isRestDay =
    lastLogDate !== null &&
    (() => {
      const d = new Date(lastLogDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })();

  const meta = TYPE_META[next];

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        {isRestDay ? "Logged Today" : "Next Up"}
      </p>
      {isRestDay ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center text-xl">✅</div>
          <div>
            <p className="font-semibold text-sm">Workout logged</p>
            <p className="text-muted text-xs mt-0.5">Great work — rest up or log another session</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl">
            {meta.emoji}
          </div>
          <div>
            <p className="font-semibold text-sm">
              Workout {next}
              {lastCycle && (
                <span className="text-muted font-normal">
                  {" "}· follows {lastCycle.workout_type}
                </span>
              )}
            </p>
            <p className="text-muted text-xs mt-0.5">{meta.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
