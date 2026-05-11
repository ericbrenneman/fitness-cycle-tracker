"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WorkoutLog, CycleStep, WorkoutTemplate } from "@/lib/types";
import { CARDIO_TEMPLATES } from "@/lib/templates";
import { loadAllUserTemplates, loadWorkoutMode, WorkoutMode } from "@/lib/userTemplates";
import { resolveNextCycleStep } from "@/lib/cycle";
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