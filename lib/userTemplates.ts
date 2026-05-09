import { createClient } from "@/lib/supabase/client";
import { ExerciseTemplate, WorkoutTemplate } from "@/lib/types";
import { STRENGTH_TEMPLATES } from "@/lib/templates";

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
}

/**
 * Load user's custom template for a given workout type.
 * Returns null if no custom template exists.
 */
export async function loadUserTemplate(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  workoutType: "A" | "B" | "C"
): Promise<UserTemplate | null> {
  const { data, error } = await supabase
    .from("user_templates")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_type", workoutType)
    .single();

  if (error || !data) return null;
  return {
    workout_type: workoutType,
    exercises: data.exercises as UserExercise[],
  };
}

/**
 * Load all three user templates (A, B, C) at once.
 * Falls back to built-in defaults for any that don't exist.
 */
export async function loadAllUserTemplates(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Record<"A" | "B" | "C", WorkoutTemplate>> {
  const { data } = await supabase
    .from("user_templates")
    .select("*")
    .eq("user_id", userId);

  const result: Record<"A" | "B" | "C", WorkoutTemplate> = {
    A: { ...STRENGTH_TEMPLATES.A },
    B: { ...STRENGTH_TEMPLATES.B },
    C: { ...STRENGTH_TEMPLATES.C },
  };

  if (!data) return result;

  for (const row of data) {
    const type = row.workout_type as "A" | "B" | "C";
    result[type] = {
      ...STRENGTH_TEMPLATES[type],
      exercises: row.exercises as ExerciseTemplate[],
    };
  }

  return result;
}

/**
 * Save a user's custom template for a workout type.
 * Uses upsert so it creates or updates.
 */
export async function saveUserTemplate(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  workoutType: "A" | "B" | "C",
  exercises: UserExercise[]
): Promise<string | null> {
  const { error } = await supabase
    .from("user_templates")
    .upsert({
      user_id: userId,
      workout_type: workoutType,
      exercises,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,workout_type",
    });

  return error?.message ?? null;
}

/**
 * Reset a user's custom template back to the built-in default.
 */
export async function resetUserTemplate(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  workoutType: "A" | "B" | "C"
): Promise<string | null> {
  const { error } = await supabase
    .from("user_templates")
    .delete()
    .eq("user_id", userId)
    .eq("workout_type", workoutType);

  return error?.message ?? null;
}