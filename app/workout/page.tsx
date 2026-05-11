"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WorkoutLog, CycleStep, CYCLE_SEQUENCE, WorkoutTemplate } from "@/lib/types";
import { CARDIO_TEMPLATES } from "@/lib/templates";
import { loadAllUserTemplates, loadWorkoutMode, WorkoutMode } from "@/lib/userTemplates";
import StrengthLogger from "@/components/StrengthLogger";
import CardioLogger from "@/components/CardioLogger";
import RecoveryLogger from "@/components/RecoveryLogger";

function getLastCycleStep(logs: WorkoutLog[]): CycleStep | null {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );
  let lastStep: CycleStep | null = null;
  for (const log of sorted) {
    if (!log.advances_cycle) continue;
    if (log.workout_type === "A") lastStep = "A";
    else if (log.workout_type === "Cardio")
      lastStep = lastStep === "A" ? "Cardio1" : "Cardio2";
    else if (log.workout_type === "B") lastStep = "B";
    else if (log.workout_type === "C") lastStep = "C";
    else if (
      log.workout_type === "Rest" ||
      log.workout_type === "Sauna" ||
      log.workout_type === "Mobility" ||
      log.workout_type === "Illness" ||
      log.workout_type === "Other" ||
      log.workout_type === "Red Light" ||
      log.workout_type === "PEMF"
    ) {
      if (lastStep === "C") lastStep = "Rest1";
      else if (lastStep === "Rest1") lastStep = "Rest2";
    }
  }
  return lastStep;
}

function getNextStep(lastStep: CycleStep | null): CycleStep {
  if (!lastStep) return "A";
  const idx = CYCLE_SEQUENCE.indexOf(lastStep);
  return CYCLE_SEQUENCE[(idx + 1) % CYCLE_SEQUENCE.length];
}

export default function WorkoutPage() {
  const [loading, setLoading] = useState(true);
  const [nextStep, setNextStep] = useState<CycleStep>("A");
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [userTemplates, setUserTemplates] = useState<Record<"A" | "B" | "C", WorkoutTemplate> | null>(null);
  const [mode, setMode] = useState<WorkoutMode>("home");
  const router = useRouter();

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }

      const [logsRes, currentMode] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("workout_logs") as any)
        .select("*")
        .eq("user_id", session.user.id)
        .eq("advances_cycle", true)
        .order("logged_at", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(200),
        loadWorkoutMode(supabase, session.user.id),
      ]);
      "use client";

      import { useEffect, useState, useRef } from "react";
      import { createClient } from "@/lib/supabase/client";
      import { useRouter } from "next/navigation";
      import { WorkoutLog, CycleStep, WorkoutTemplate } from "@/lib/types";
      import { CARDIO_TEMPLATES } from "@/lib/templates";
      import { loadAllUserTemplates, loadWorkoutMode, WorkoutMode } from "@/lib/userTemplates";
      import { resolveNextCycleStep, getNextCycleStepFromLogs } from "@/lib/cycle";
      import StrengthLogger from "@/components/StrengthLogger";
      import CardioLogger from "@/components/CardioLogger";
      import RecoveryLogger from "@/components/RecoveryLogger";

      export default function WorkoutPage() {
        const [loading, setLoading] = useState(true);
        const [nextStep, setNextStep] = useState<CycleStep>("A");
        const [logs, setLogs] = useState<WorkoutLog[]>([]);
        const [userTemplates, setUserTemplates] = useState<Record<"A" | "B" | "C", WorkoutTemplate> | null>(null);
        const [mode, setMode] = useState<WorkoutMode>("home");
        const router = useRouter();

        const supabaseRef = useRef(createClient());
        const supabase = supabaseRef.current;

        useEffect(() => {
          const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/auth"); return; }

            // Fetch advancing logs in chronological order — no limit issues
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [logsRes, currentMode] = await Promise.all([
              (supabase.from("workout_logs") as any)
                .select("*")
                .eq("user_id", session.user.id)
                .eq("advances_cycle", true)
                .order("logged_at", { ascending: true })
                .order("created_at", { ascending: true })
                .limit(500),
              loadWorkoutMode(supabase, session.user.id),
            ]);

            const fetchedLogs = (logsRes.data as WorkoutLog[]) ?? [];
            setLogs(fetchedLogs);
            setMode(currentMode);

            const [templates, next] = await Promise.all([
              loadAllUserTemplates(supabase, session.user.id, currentMode),
              resolveNextCycleStep(supabase, session.user.id, fetchedLogs),
            ]);

            setUserTemplates(templates);
            setNextStep(next);
            setLoading(false);
          };
          init();
        }, []);

        const handleDone = () => router.push("/dashboard");

        if (loading) {
          return (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted text-sm">Loading your next workout…</p>
            </div>
          );
        }

        if (nextStep === "A" || nextStep === "B" || nextStep === "C") {
          const template = userTemplates?.[nextStep];
          if (!template) return null;
          return (
            <StrengthLogger
              cycleStep={nextStep}
              template={template}
              pastLogs={logs}
              onDone={handleDone}
              mode={mode}
            />
          );
        }

        if (nextStep === "Cardio1" || nextStep === "Cardio2") {
          return (
            <CardioLogger
              cycleStep={nextStep}
              template={CARDIO_TEMPLATES[nextStep]}
              onDone={handleDone}
            />
          );
        }

        return (
          <RecoveryLogger
            cycleStep={nextStep}
            onDone={handleDone}
          />
        );
      }
      const fetchedLogs = (logsRes.data as WorkoutLog[]) ?? [];
      setLogs(fetchedLogs);
      setMode(currentMode);

      const templates = await loadAllUserTemplates(supabase, session.user.id, currentMode);
      setUserTemplates(templates);

      const lastStep = getLastCycleStep(fetchedLogs);
      const next = getNextStep(lastStep);
      console.log("[workout] fetchedLogs count:", fetchedLogs.length);
      console.log("[workout] lastStep:", lastStep);
      console.log("[workout] nextStep:", next);
      setNextStep(next);
      setLoading(false);
    };
    init();
  }, []);

  const handleDone = () => router.push("/dashboard");

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted text-sm">Loading your next workout…</p>
      </div>
    );
  }

  if (nextStep === "A" || nextStep === "B" || nextStep === "C") {
    const template = userTemplates?.[nextStep];
    if (!template) return null;
    return (
      <StrengthLogger
        cycleStep={nextStep}
        template={template}
        pastLogs={logs}
        onDone={handleDone}
        mode={mode}
      />
    );
  }

  if (nextStep === "Cardio1" || nextStep === "Cardio2") {
    return (
      <CardioLogger
        cycleStep={nextStep}
        template={CARDIO_TEMPLATES[nextStep]}
        onDone={handleDone}
      />
    );
  }

  return (
    <RecoveryLogger
      cycleStep={nextStep}
      onDone={handleDone}
    />
  );
}