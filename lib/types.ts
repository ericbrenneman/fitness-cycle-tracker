// ============================================================
// WORKOUT TYPES
// ============================================================

export type WorkoutType =
  | "A"
  | "B"
  | "C"
  | "Cardio"
  | "Rest"
  | "Sauna"
  | "Red Light"
  | "PEMF"
  | "Mobility"
  | "Illness"
  | "Other";

export type CycleStep =
  | "A"
  | "Cardio1"
  | "B"
  | "Cardio2"
  | "C"
  | "Rest1"
  | "Rest2";

export type Unit = "lb" | "kg";

export type Effort = "Easy" | "Moderate" | "Hard";

export type PerceivedDifficulty = "Easy" | "Moderate" | "Hard";

export type CardioModality =
  | "Peloton"
  | "Treadmill"
  | "Bike"
  | "Rower"
  | "Elliptical"
  | "Outdoor Walk"
  | "Other";

// ============================================================
// DATABASE ROW TYPES
// ============================================================

export interface WorkoutLog {
  id: string;
  user_id: string;
  logged_at: string;
  workout_type: WorkoutType;
  duration: number;
  effort: number | null;
  notes: string | null;
  advances_cycle: boolean;
  created_at: string;
}

export interface WorkoutLogInsert {
  workout_type: WorkoutType;
  duration: number;
  effort: number | null;
  notes: string | null;
  advances_cycle: boolean;
  logged_at: string;
}

export interface StrengthExercise {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  unit: Unit;
  perceived_difficulty: PerceivedDifficulty | null;
  notes: string | null;
  created_at: string;
}

export interface StrengthExerciseInsert {
  workout_log_id: string;
  exercise_name: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  unit: Unit;
  perceived_difficulty: PerceivedDifficulty | null;
  notes: string | null;
}

export interface CardioDetail {
  id: string;
  workout_log_id: string;
  modality: CardioModality | null;
  distance: number | null;
  avg_watts: number | null;
  total_output_kj: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  notes: string | null;
  created_at: string;
}

export interface CardioDetailInsert {
  workout_log_id: string;
  modality: CardioModality | null;
  distance: number | null;
  avg_watts: number | null;
  total_output_kj: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  notes: string | null;
}

export interface RecoveryDetail {
  id: string;
  workout_log_id: string;
  sauna_minutes: number | null;
  sleep_hours: number | null;
  hrv: number | null;
  resting_hr: number | null;
  soreness: string | null;
  illness_symptoms: string | null;
  notes: string | null;
  created_at: string;
}

export interface RecoveryDetailInsert {
  workout_log_id: string;
  sauna_minutes: number | null;
  sleep_hours: number | null;
  hrv: number | null;
  resting_hr: number | null;
  soreness: string | null;
  illness_symptoms: string | null;
  notes: string | null;
}

// ============================================================
// JOINED TYPES
// ============================================================

export interface WorkoutLogFull extends WorkoutLog {
  strength_exercises: StrengthExercise[];
  cardio_detail: CardioDetail | null;
  recovery_detail: RecoveryDetail | null;
}

// ============================================================
// TEMPLATE TYPES
// ============================================================

export interface ExerciseTemplate {
  name: string;
  default_sets: number;
  default_reps_range: [number, number];
  timed: boolean;
  optional: boolean;
  notes: string;
}

export interface WorkoutTemplate {
  cycle_step: "A" | "B" | "C";
  name: string;
  description: string;
  exercises: ExerciseTemplate[];
}

export interface CardioTemplate {
  cycle_step: "Cardio1" | "Cardio2";
  name: string;
  description: string;
  duration_range: [number, number];
  effort: string;
  instructions: string;
  suggested_modalities: CardioModality[];
}

// ============================================================
// PROGRESSION TYPES
// ============================================================

export interface ExerciseHistory {
  exercise_name: string;
  last_weight: number | null;
  last_reps: number | null;
  last_unit: Unit;
  last_difficulty: PerceivedDifficulty | null;
  last_date: string | null;
}

export interface ProgressionSuggestion {
  exercise_name: string;
  suggested_weight: number | null;
  suggested_reps: number | null;
  unit: Unit;
  note: string;
  previous_weight: number | null;
  previous_reps: number | null;
}

// ============================================================
// CYCLE CONSTANTS
// ============================================================

export const CYCLE_SEQUENCE: CycleStep[] = [
  "A",
  "Cardio1",
  "B",
  "Cardio2",
  "C",
  "Rest1",
  "Rest2",
];

export const ADVANCING_TYPES: WorkoutType[] = ["A", "B", "C", "Cardio"];

export const CYCLE_STEP_LABELS: Record<CycleStep, string> = {
  A:       "Workout A — Push + Legs",
  Cardio1: "Cardio 1 — Zone 2",
  B:       "Workout B — Pull + Hinge",
  Cardio2: "Cardio 2 — Intervals",
  C:       "Workout C — Full Body",
  Rest1:   "Rest / Recovery",
  Rest2:   "Rest / Recovery",
};

export const CYCLE_STEP_EMOJI: Record<CycleStep, string> = {
  A:       "💪",
  Cardio1: "🚴",
  B:       "🏋️",
  Cardio2: "⚡",
  C:       "🔥",
  Rest1:   "😴",
  Rest2:   "😴",
};