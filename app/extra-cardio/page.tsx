"use client";

import { useRouter } from "next/navigation";
import CardioLogger from "@/components/CardioLogger";
import { CardioTemplate } from "@/lib/types";

const EXTRA_CARDIO_TEMPLATE: CardioTemplate = {
  cycle_step: "Cardio1",
  name: "Extra Cardio",
  description: "Off-cycle movement that does not advance your workout plan.",
  instructions:
    "Log off-cycle movement like a family walk, easy ride, hike, recovery spin, or other activity. This will not advance your workout cycle.",
  duration_range: [10, 60],
  effort: "Easy to moderate",
  suggested_modalities: ["Outdoor Walk", "Bike", "Peloton", "Treadmill", "Other"],
};

export default function ExtraCardioPage() {
  const router = useRouter();

  return (
    <CardioLogger
      cycleStep="Cardio1"
      template={EXTRA_CARDIO_TEMPLATE}
      onDone={() => router.push("/dashboard")}
      advancesCycle={false}
      title="🚶 Extra Cardio"
      subtitle="Off-cycle activity"
      saveLabel="Log Extra Cardio ✓"
    />
  );
}