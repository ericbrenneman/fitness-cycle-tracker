import { StrengthExercise, PerceivedDifficulty, Unit } from "@/lib/types";

// ============================================================
// PROGRESSION ENGINE
// ============================================================

const WEIGHT_INCREMENT_LB = 5;
const WEIGHT_INCREMENT_KG = 2.5;
const REP_INCREMENT = 1;
const REP_CEILING = 12;
const REP_FLOOR = 8;

export interface LastPerformance {
  weight: number | null;
  reps: number | null;
  unit: Unit;
  difficulty: PerceivedDifficulty | null;
}

export interface ProgressionSuggestion {
  suggested_weight: number | null;
  suggested_reps: number | null;
  unit: Unit;
  note: string;
  previous_weight: number | null;
  previous_reps: number | null;
}

/**
 * Given the last set logged for an exercise, suggest what to do next.
 */
export function getSuggestion(
  last: LastPerformance | null,
  hasRecentIllness: boolean,
  preferredUnit: Unit = "lb"
): ProgressionSuggestion {
  // No history
  if (!last || last.weight === null) {
    return {
      suggested_weight: null,
      suggested_reps: null,
      unit: preferredUnit,
      note: "No previous data — start with a comfortable weight.",
      previous_weight: null,
      previous_reps: null,
    };
  }

  const { weight, reps, unit, difficulty } = last;
  const increment = unit === "lb" ? WEIGHT_INCREMENT_LB : WEIGHT_INCREMENT_KG;

  // Recent illness — back off
  if (hasRecentIllness) {
    return {
      suggested_weight: Math.max(0, weight - increment),
      suggested_reps: reps,
      unit,
      note: "Recent illness — drop weight slightly and focus on form.",
      previous_weight: weight,
      previous_reps: reps,
    };
  }

  // Hard last time — match previous
  if (difficulty === "Hard") {
    return {
      suggested_weight: weight,
      suggested_reps: reps,
      unit,
      note: "Last effort was Hard — match previous weight and focus on quality.",
      previous_weight: weight,
      previous_reps: reps,
    };
  }

  // Hit rep ceiling — increase weight, reset reps
  if (reps !== null && reps >= REP_CEILING) {
    return {
      suggested_weight: weight + increment,
      suggested_reps: REP_FLOOR,
      unit,
      note: `Hit ${REP_CEILING} reps — add ${increment}${unit} and aim for ${REP_FLOOR} reps.`,
      previous_weight: weight,
      previous_reps: reps,
    };
  }

  // Easy or Moderate — add a rep
  return {
    suggested_weight: weight,
    suggested_reps: reps !== null ? reps + REP_INCREMENT : REP_FLOOR,
    unit,
    note: `Add ${REP_INCREMENT} rep at the same weight. Focus on smooth control.`,
    previous_weight: weight,
    previous_reps: reps,
  };
}

/**
 * Check if any illness was logged in the last N days.
 */
export function hasRecentIllness(
  logs: { workout_type: string; logged_at: string }[],
  days: number = 3
): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return logs.some(
    (l) =>
      l.workout_type === "Illness" &&
      new Date(l.logged_at) >= cutoff
  );
}

/**
 * Extract the last set for a given exercise from a list of sets.
 * Uses the highest set_number as the representative set.
 */
export function getLastPerformance(
  sets: StrengthExercise[]
): LastPerformance | null {
  if (sets.length === 0) return null;
  const sorted = [...sets].sort((a, b) => b.set_number - a.set_number);
  const last = sorted[0];
  return {
    weight: last.weight,
    reps: last.reps,
    unit: last.unit,
    difficulty: last.perceived_difficulty,
  };
}