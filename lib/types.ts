export type WorkoutType =
  | "A"
  | "B"
  | "C"
  | "Cardio"
  | "Rest"
  | "Sauna"
  | "Mobility"
  | "Illness"
  | "Other";

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
