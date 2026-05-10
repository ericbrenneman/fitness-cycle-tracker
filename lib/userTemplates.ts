import { createClient } from "@/lib/supabase/client";
import { ExerciseTemplate, WorkoutTemplate } from "@/lib/types";
import { STRENGTH_TEMPLATES, TRAVEL_TEMPLATES } from "@/lib/templates";

export type WorkoutMode = "home" | "travel";

export interface UserExercise {
  name: string;
  default_sets: number;
  default_reps_range: [number, number];
  timed: boolean;
  optional: boolean;
  notes: string;
}

export interface UserTemplate {
  workout_type: "A" | "B" | "C";
  exercises: UserExercise[];
  mode: WorkoutMode;
}

/**
 * Load the current workout mode for a user.
 * Defaults to 'home' if no setting exists.
 */
export async function loadWorkoutMode(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<WorkoutMode> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("user_settings") as any)
    .select("workout_mode")
    .eq("user_id", userId)
    .single();
  return (data?.workout_mode as WorkoutMode) ?? "home";
}

/**
 * Save the current workout mode for a user.
 */
export async function saveWorkoutMode(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  mode: WorkoutMode
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("user_settings") as any).upsert(
    {
      user_id: userId,
      workout_mode: mode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return error?.message ?? null;
}

/**
 * Load all three user templates (A, B, C) for a given mode.
 * Falls back to built-in defaults for any that don't exist.
 */
export async function loadAllUserTemplates(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  mode: WorkoutMode = "home"
): Promise<Record<"A" | "B" | "C", WorkoutTemplate>> {
  const defaults = mode === "travel" ? TRAVEL_TEMPLATES : STRENGTH_TEMPLATES;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("user_templates") as any)
    .select("*")
    .eq("user_id", userId)
    .eq("mode", mode);

  const result: Record<"A" | "B" | "C", WorkoutTemplate> = {
    A: { ...defaults.A },
    B: { ...defaults.B },
    C: { ...defaults.C },
  };

  if (!data) return result;

  const rows = data as Array<{
    workout_type: "A" | "B" | "C";
    exercises: ExerciseTemplate[];
  }>;

  for (const row of rows) {
    const type = row.workout_type;
    result[type] = {
      ...defaults[type],
      exercises: row.exercises,
    };
  }

  return result;
}

/**
 * Save a user's custom template for a workout type and mode.
 */
export async function saveUserTemplate(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  workoutType: "A" | "B" | "C",
  exercises: UserExercise[],
  mode: WorkoutMode = "home"
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("user_templates") as any).upsert(
    {
      user_id: userId,
      workout_type: workoutType,
      mode,
      exercises,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,workout_type,mode" }
  );
  return error?.message ?? null;
}

/**
 * Reset a user's custom template back to the built-in default.
 */
export async function resetUserTemplate(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  workoutType: "A" | "B" | "C",
  mode: WorkoutMode = "home"
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("user_templates") as any)
    .delete()
    .eq("user_id", userId)
    .eq("workout_type", workoutType)
    .eq("mode", mode);
  return error?.message ?? null;
}