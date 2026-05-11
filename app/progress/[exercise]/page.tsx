"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";

interface DataPoint {
  date: string;
  weight: number;
  reps: number;
  unit: string;
  estimated_1rm: number;
}

function calc1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function SVGChart({
  data,
  color,
  label,
  getValue,
}: {
  data: DataPoint[];
  color: string;
  label: string;
  getValue: (d: DataPoint) => number;
}) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center h-32 text-muted text-xs">
      Need at least 2 sessions to show chart
    </div>
  );

  const values = data.map(getValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 320;
  const H = 120;
  const PAD = 8;

  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((getValue(d) - min) / range) * (H - PAD * 2);
    return { x, y, d };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const area = `${path} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  const pr = Math.max(...values);
  const prIdx = values.indexOf(pr);

  return (
    <div>
      <p className="text-xs text-muted mb-2">{label}</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 120 }}
      >
        {/* Area fill */}
        <path d={area} fill={color + "18"} />
        {/* Line */}
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === prIdx ? 5 : 3}
            fill={i === prIdx ? color : "#1a1d27"}
            stroke={color}
            strokeWidth="2"
          />
        ))}
        {/* PR label */}
        <text
          x={points[prIdx].x}
          y={points[prIdx].y - 10}
          textAnchor="middle"
          fontSize="9"
          fill={color}
        >
          PR
        </text>
      </svg>
      <div className="flex justify-between text-xs text-muted mt-1">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

export default function ExerciseProgressPage() {
  const params = useParams();
  const exerciseName = decodeURIComponent(params.exercise as string);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState("lb");
  const router = useRouter();

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }

      // Get all workout log IDs for this user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: logs } = await (supabase.from("workout_logs") as any)
        .select("id, logged_at")
        .eq("user_id", session.user.id)
        .order("logged_at", { ascending: true });

      if (!logs || logs.length === 0) { setLoading(false); return; }

      const logIds = logs.map((l: { id: string }) => l.id);
      const logDateMap = new Map(logs.map((l: { id: string; logged_at: string }) => [l.id, l.logged_at]));

      // Get all sets for this exercise
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sets } = await (supabase.from("strength_exercises") as any)
        .select("*")
        .eq("exercise_name", exerciseName)
        .in("workout_log_id", logIds)
        .order("created_at", { ascending: true });

      if (!sets || sets.length === 0) { setLoading(false); return; }

      // Group by workout session — take the heaviest set per session
      const bySession = new Map<string, { weight: number; reps: number; unit: string; date: string }>();

      for (const set of sets) {
        const date = logDateMap.get(set.workout_log_id) as string;
        if (!date || !set.weight) continue;
        const existing = bySession.get(set.workout_log_id);
        if (!existing || set.weight > existing.weight) {
          bySession.set(set.workout_log_id, {
            weight: set.weight,
            reps: set.reps ?? 1,
            unit: set.unit ?? "lb",
            date,
          });
        }
      }

      const points: DataPoint[] = Array.from(bySession.values()).map((s) => {
        const [yr, mo, dy] = s.date.split("-").map(Number);
        const label = new Date(yr, mo - 1, dy).toLocaleDateString("en-US", {
          month: "short", day: "numeric",
        });
        return {
          date: label,
          weight: s.weight,
          reps: s.reps,
          unit: s.unit,
          estimated_1rm: calc1RM(s.weight, s.reps),
        };
      });

      if (points.length > 0) setUnit(points[0].unit);
      setData(points);
      setLoading(false);
    };
    init();
  }, [exerciseName]);

  const pr = data.length > 0 ? Math.max(...data.map((d) => d.weight)) : null;
  const pr1rm = data.length > 0 ? Math.max(...data.map((d) => d.estimated_1rm)) : null;
  const latest = data[data.length - 1];
  const first = data[0];
  const weightGain = latest && first ? latest.weight - first.weight : null;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted text-sm">Loading progress…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="flex items-center gap-3 px-4 pt-10 pb-4">
        <button onClick={() => router.back()} className="text-muted text-sm hover:text-white transition-colors">
          ← Back
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {/* Header */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">Exercise Progress</p>
          <h1 className="text-lg font-bold">{exerciseName}</h1>
          <p className="text-xs text-muted mt-0.5">{data.length} sessions logged</p>
        </div>

        {/* Stats */}
        {data.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-border rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-accent">{pr} {unit}</p>
              <p className="text-xs text-muted mt-0.5">Best Weight</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-green-400">{pr1rm} {unit}</p>
              <p className="text-xs text-muted mt-0.5">Est. 1RM</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-3 text-center">
              <p className={`text-lg font-bold ${weightGain && weightGain > 0 ? "text-green-400" : "text-muted"}`}>
                {weightGain !== null ? (weightGain > 0 ? `+${weightGain}` : weightGain) : "—"} {unit}
              </p>
              <p className="text-xs text-muted mt-0.5">Total Gain</p>
            </div>
          </div>
        )}

        {/* Charts */}
        {data.length > 0 ? (
          <>
            <div className="bg-surface border border-border rounded-2xl p-4">
              <SVGChart
                data={data}
                color="#6c63ff"
                label={`Weight (${unit})`}
                getValue={(d) => d.weight}
              />
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4">
              <SVGChart
                data={data}
                color="#2ecc71"
                label="Estimated 1RM"
                getValue={(d) => d.estimated_1rm}
              />
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4">
              <SVGChart
                data={data}
                color="#f59e0b"
                label="Reps (heaviest set)"
                getValue={(d) => d.reps}
              />
            </div>
          </>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <p className="text-muted text-sm">No weight data logged for this exercise yet.</p>
          </div>
        )}

        {/* Session history table */}
        {data.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Session History
            </p>
            <div className="flex flex-col gap-2">
              {[...data].reverse().map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{d.date}</span>
                  <span className="text-white font-medium">{d.weight} {d.unit}</span>
                  <span className="text-muted">× {d.reps} reps</span>
                  <span className="text-muted">~{d.estimated_1rm} {d.unit} 1RM</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}