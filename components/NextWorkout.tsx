import { WorkoutLog } from "@/lib/types";
import { getNextCycleStepFromLogs, sortLogsChronologically } from "@/lib/cycle";

type CycleStep = "A" | "Cardio1" | "B" | "Cardio2" | "C" | "Rest1" | "Rest2";

const CYCLE_SEQUENCE: CycleStep[] = [
  "A", "Cardio1", "B", "Cardio2", "C", "Rest1", "Rest2",
];

const STEP_META: Record<CycleStep, {
  emoji: string;
  label: string;
  description: string;
  color: string;
}> = {
  A:       { emoji: "💪", label: "Workout A", description: "Push + Legs — Leg Press, Bench, Shoulder Press, Plank", color: "#6c63ff" },
  Cardio1: { emoji: "🚴", label: "Cardio 1",  description: "Zone 2 — 30–45 min easy effort, conversational pace", color: "#2ecc71" },
  B:       { emoji: "🏋️", label: "Workout B", description: "Pull + Hinge — Lat Pulldown, Cable Row, RDL, Farmer Carry", color: "#a78bfa" },
  Cardio2: { emoji: "⚡", label: "Cardio 2",  description: "Intervals — 20–30 min, 1 min hard / 2 min easy x8–10", color: "#f59e0b" },
  C:       { emoji: "🔥", label: "Workout C", description: "Full Body — Goblet Squat, Lunges, Pushups, Step Ups", color: "#ff6584" },
  Rest1:   { emoji: "😴", label: "Rest",      description: "Recovery day — sleep, sauna, or easy walk", color: "#06b6d4" },
  Rest2:   { emoji: "😴", label: "Rest",      description: "Recovery day — sleep, sauna, or easy walk", color: "#06b6d4" },
};

function getDaysSince(logs: WorkoutLog[]): number | null {
  if (!logs[0]) return null;
  const sorted = sortLogsChronologically(logs);
  const last = sorted[sorted.length - 1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = last.logged_at.split("-").map(Number);
  const lastDate = new Date(y, m - 1, d);
  lastDate.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}

export default function NextWorkout({ logs }: { logs: WorkoutLog[] }) {
  const nextStep = getNextCycleStepFromLogs(logs);
  const meta = STEP_META[nextStep];
  const nextIdx = CYCLE_SEQUENCE.indexOf(nextStep);
  const daysSinceLast = getDaysSince(logs);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const loggedToday = logs.some((l) => {
    const [y, m, d] = l.logged_at.split("-").map(Number);
    const entryDate = new Date(y, m - 1, d);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        Next Up
      </p>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: meta.color + "22" }}
        >
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base">{meta.label}</p>
          <p className="text-muted text-xs mt-0.5 leading-relaxed">
            {meta.description}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted mb-1.5">
          <span>Cycle progress</span>
          <span>{nextIdx} / {CYCLE_SEQUENCE.length} done</span>
        </div>
        <div className="flex gap-1">
          {CYCLE_SEQUENCE.map((step, i) => (
            <div
              key={step}
              className="flex-1 h-1.5 rounded-full transition-colors"
              style={{
                background:
                  i < nextIdx
                    ? meta.color
                    : i === nextIdx
                    ? meta.color + "88"
                    : "#ffffff18",
              }}
            />
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {CYCLE_SEQUENCE.map((step) => (
            <div key={step} className="flex-1 text-center">
              <span style={{ fontSize: "9px", color: "#ffffff33" }}>
                {step === "Cardio1" || step === "Cardio2"
                  ? "C"
                  : step === "Rest1" || step === "Rest2"
                  ? "R"
                  : step}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border">
        <span>
          {loggedToday
            ? "✅ Activity Logged today"
            : daysSinceLast === 0
            ? "Ready to train"
            : daysSinceLast === 1
            ? "Last trained yesterday"
            : daysSinceLast !== null
            ? `Last trained ${daysSinceLast} days ago`
            : "No workouts yet — start with A"}
        </span>
      </div>
    </div>
  );
}