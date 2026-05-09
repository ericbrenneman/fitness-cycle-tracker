"use client";

import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import RecoveryLogger from "@/components/RecoveryLogger";

export default function RecoveryPage() {
  const router = useRouter();
  return (
    <RecoveryLogger
      cycleStep="Rest1"
      onDone={() => router.push("/dashboard")}
      standalone={true}
    />
  );
}