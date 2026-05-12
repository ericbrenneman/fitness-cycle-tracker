"use client";

import { useRouter } from "next/navigation";
import CardioLogger from "@/components/CardioLogger";
import { CardioTemplate } from "@/lib/types";

const EXTRA_CARDIO_TEMPLATE: CardioTemplate = {
  name: "Extra Cardio",
  instructions:
    "Log off-cycle movement like a family walk, easy ride, hike, recovery spin, or other activity. This will not advance your workout cycle.",
  duration_range: [10, 60],
  effort: "Easy to moderate",
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