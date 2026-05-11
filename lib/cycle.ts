import { WorkoutLog, CycleStep, CYCLE_SEQUENCE } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

// ============================================================
// CYCLE SEQUENCE
// A → Cardio1 → B → Cardio2 → C → Rest1 → Rest2 → (repeat)
// ============================================================

/**
 * Sort logs chronologically — oldest first.
 * Primary: logged_at ascending
 * Tiebreaker: created_at ascending
 */
export function sortLogsChronologically(logs: WorkoutLog[]): WorkoutLog[] {
  return [...logs].sort((a, b) => {
    const dateA = new Date(a.logged_at).getTime();
    const dateB = new Date(b.logged_at).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * Given a chronologically sorted list of advancing logs,
 * compute the last completed cycle step.
 *
 * Key rules:
 * - Only entries with advances_cycle === true are considered
 * - Cardio resolves to Cardio1 (after A) or Cardio2 (after B)
 * - Rest/recovery resolves to Rest1 (after C) or Rest2 (after Rest1)
 */
export function getLastCycleStep(logs: WorkoutLog[]): CycleStep | null {
  const sorted = sortLogsChronologically(logs);
  const advancing = sorted.filter((l) => l.advances_cycle);

  let lastStep: CycleStep | null = null;

  for (const log of advancing) {
    switch (log.workout_type) {
      case "A":
        lastStep = "A";
        break;
      case "B":
        lastStep = "B";
        break;
      case "C":
        lastStep = "C";
        break;
      case "Cardio":
        // Cardio1 follows A, Cardio2 follows B
        if (lastStep === "A") lastStep = "Cardio1";
        else if (lastStep === "B") lastStep = "Cardio2";
        else if (lastStep === "Cardio1") lastStep = "Cardio2"; // back-to-back cardio edge case
        // else ignore — cardio with no context
        break;
      case "Rest":
      case "Sauna":
      case "Mobility":
      case "Illness":
      case "Other":
      case "Red Light":
      case "PEMF":
        // Rest1 follows C, Rest2 follows Rest1
        if (lastStep === "C") lastStep = "Rest1";
        else if (lastStep === "Rest1") lastStep = "Rest2";
        // else ignore — rest with no context
        break;
    }
  }

  return lastStep;
}

/**
 * Given the last completed step, return the next step in the cycle.
 */
export function getNextStep(lastStep: CycleStep | null): CycleStep {
  if (!lastStep) return "A";
  const idx = CYCLE_SEQUENCE.indexOf(lastStep);
  return CYCLE_SEQUENCE[(idx + 1) % CYCLE_SEQUENCE.length];
}

/**
 * Convenience: compute next cycle step directly from a log array.
 */
export function getNextCycleStepFromLogs(logs: WorkoutLog[]): CycleStep {
  return getNextStep(getLastCycleStep(logs));
}

// ============================================================
// PERSISTENT CYCLE STATE
// ============================================================

export interface CycleState {
  current_step: CycleStep;
  last_completed_step: CycleStep | null;
  updated_at: string;
}

/**
 * Load the user's persisted cycle state from user_cycle_state.
 * Returns null if no state exists yet (new user or old user pre-migration).
 */
export async function loadCycleState(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<CycleState | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("user_cycle_state") as any)
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    current_step: data.current_step as CycleStep,
    last_completed_step: data.last_completed_step as CycleStep | null,
    updated_at: data.updated_at,
  };
}

/**
 * Save the user's cycle state after a workout is logged.
 * Uses upsert — creates or updates.
 */
export async function saveCycleState(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  completedStep: CycleStep
): Promise<string | null> {
  const nextStep = getNextStep(completedStep);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("user_cycle_state") as any).upsert(
    {
      user_id: userId,
      current_step: nextStep,
      last_completed_step: completedStep,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return error?.message ?? null;
}

/**
 * Get the next cycle step — prefers persistent state,
 * falls back to computing from logs for old/missing state.
 */
export async function resolveNextCycleStep(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  logs: WorkoutLog[]
): Promise<CycleStep> {
  const state = await loadCycleState(supabase, userId);

  if (state) {
    return state.current_step;
  }

  // Fall back to computing from logs
  return getNextCycleStepFromLogs(logs);
}

/**
 * Map a workout_type to its CycleStep given the current expected next step.
 * Used when saving a log to determine what cycle step was completed.
 */
export function workoutTypeToCycleStep(
  workoutType: string,
  expectedNextStep: CycleStep
): CycleStep | null {
  switch (workoutType) {
    case "A": return "A";
    case "B": return "B";
    case "C": return "C";
    case "Cardio":
      return expectedNextStep === "Cardio1" ? "Cardio1" : "Cardio2";
    case "Rest":
    case "Sauna":
    case "Mobility":
    case "Illness":
    case "Other":
    case "Red Light":
    case "PEMF":
      return expectedNextStep === "Rest1" ? "Rest1" : "Rest2";
    default:
      return null;
  }
}