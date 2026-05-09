import type {
  WorkoutTemplate,
  CardioTemplate,
  ExerciseTemplate,
} from "@/lib/types";

// ============================================================
// WORKOUT A — Push + Legs
// ============================================================
export const WORKOUT_A: WorkoutTemplate = {
  cycle_step: "A",
  name: "Workout A — Push + Legs",
  description: "Quad-dominant lower body + horizontal and vertical push.",
  exercises: [
    {
      name: "Leg Press",
      default_sets: 3,
      default_reps_range: [8, 12],
      timed: false,
      optional: false,
      notes: "Full range of motion. Control the descent.",
    },
    {
      name: "Dumbbell Bench Press",
      default_sets: 3,
      default_reps_range: [8, 12],
      timed: false,
      optional: false,
      notes: "Full chest stretch at bottom. Control descent.",
    },
    {
      name: "Seated Dumbbell Shoulder Press",
      default_sets: 3,
      default_reps_range: [8, 12],
      timed: false,
      optional: false,
      notes: "Do not flare elbows. Control descent.",
    },
    {
      name: "Plank",
      default_sets: 3,
      default_reps_range: [30, 60],
      timed: true,
      optional: false,
      notes: "Hold 30–60 seconds. Neutral spine.",
    },
    {
      name: "Incline Treadmill Walk",
      default_sets: 1,
      default_reps_range: [10, 15],
      timed: true,
      optional: true,
      notes: "10–15 minutes at moderate incline, easy pace.",
    },
  ],
};

// ============================================================
// WORKOUT B — Pull + Hinge
// ============================================================
export const WORKOUT_B: WorkoutTemplate = {
  cycle_step: "B",
  name: "Workout B — Pull + Hinge",
  description: "Posterior chain focus with vertical and horizontal pull.",
  exercises: [
    {
      name: "Lat Pulldown",
      default_sets: 3,
      default_reps_range: [8, 12],
      timed: false,
      optional: false,
      notes: "Pull to upper chest. Avoid swinging.",
    },
    {
      name: "Seated Cable Row",
      default_sets: 3,
      default_reps_range: [8, 12],
      timed: false,
      optional: false,
      notes: "Retract scapula. Keep torso upright.",
    },
    {
      name: "Dumbbell Romanian Deadlift",
      default_sets: 3,
      default_reps_range: [8, 12],
      timed: false,
      optional: false,
      notes: "Hinge at hips. Neutral spine throughout.",
    },
    {
      name: "Farmer Carry",
      default_sets: 3,
      default_reps_range: [30, 60],
      timed: true,
      optional: false,
      notes: "30–60 seconds. Stand tall, grip tight.",
    },
    {
      name: "Bike, Rower, or Sled Push",
      default_sets: 1,
      default_reps_range: [10, 15],
      timed: true,
      optional: true,
      notes: "10–15 minutes easy effort as finisher.",
    },
  ],
};

// ============================================================
// WORKOUT C — Full Body Athletic
// ============================================================
export const WORKOUT_C: WorkoutTemplate = {
  cycle_step: "C",
  name: "Workout C — Full Body Athletic",
  description: "Functional full-body movements. Builds athleticism and conditioning.",
  exercises: [
    {
      name: "Goblet Squat",
      default_sets: 3,
      default_reps_range: [8, 12],
      timed: false,
      optional: false,
      notes: "Hold dumbbell or kettlebell at chest. Deep squat.",
    },
    {
      name: "Walking Lunges",
      default_sets: 3,
      default_reps_range: [10, 12],
      timed: false,
      optional: false,
      notes: "Per leg. Keep front knee over ankle.",
    },
    {
      name: "Pushups",
      default_sets: 3,
      default_reps_range: [8, 15],
      timed: false,
      optional: false,
      notes: "Full range. Elevate hands to modify.",
    },
    {
      name: "Step Ups",
      default_sets: 3,
      default_reps_range: [8, 12],
      timed: false,
      optional: false,
      notes: "Per leg. Use a box or bench. Control descent.",
    },
    {
      name: "Air Bike or Treadmill Intervals",
      default_sets: 1,
      default_reps_range: [10, 15],
      timed: true,
      optional: true,
      notes: "10–15 minutes moderate effort intervals.",
    },
  ],
};

// ============================================================
// CARDIO 1 — Zone 2
// ============================================================
export const CARDIO_1: CardioTemplate = {
  cycle_step: "Cardio1",
  name: "Cardio 1 — Zone 2",
  description: "Steady-state aerobic work. Builds fat-burning base and heart health.",
  duration_range: [30, 45],
  effort: "Easy to Moderate",
  instructions:
    "Keep effort easy enough to hold a full conversation. " +
    "This is Zone 2 — never breathless. " +
    "Heart rate roughly 60–70% of max. " +
    "30–45 minutes total.",
  suggested_modalities: [
    "Peloton",
    "Treadmill",
    "Bike",
    "Rower",
    "Elliptical",
    "Outdoor Walk",
  ],
};

// ============================================================
// CARDIO 2 — Intervals
// ============================================================
export const CARDIO_2: CardioTemplate = {
  cycle_step: "Cardio2",
  name: "Cardio 2 — Intervals",
  description: "Moderate intensity intervals. Builds cardiovascular capacity.",
  duration_range: [20, 30],
  effort: "Moderate to Hard",
  instructions:
    "1 minute hard effort, 2 minutes easy recovery. " +
    "Repeat 8–10 rounds. " +
    "Hard = uncomfortable but sustainable. " +
    "Easy = active recovery, not stopping. " +
    "20–30 minutes total including warm-up and cool-down.",
  suggested_modalities: ["Peloton", "Bike", "Rower", "Treadmill", "Elliptical"],
};

// ============================================================
// LOOKUP HELPERS
// ============================================================

export const STRENGTH_TEMPLATES: Record<"A" | "B" | "C", WorkoutTemplate> = {
  A: WORKOUT_A,
  B: WORKOUT_B,
  C: WORKOUT_C,
};

export const CARDIO_TEMPLATES: Record<"Cardio1" | "Cardio2", CardioTemplate> = {
  Cardio1: CARDIO_1,
  Cardio2: CARDIO_2,
};

export function getStrengthTemplate(step: "A" | "B" | "C"): ExerciseTemplate[] {
  return STRENGTH_TEMPLATES[step].exercises;
}

export function getAllExerciseNames(): string[] {
  const names = new Set<string>();
  [WORKOUT_A, WORKOUT_B, WORKOUT_C].forEach((t) =>
    t.exercises.forEach((e) => names.add(e.name))
  );
  return Array.from(names);
}