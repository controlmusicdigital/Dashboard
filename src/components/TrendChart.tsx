"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TimePoint } from "@/lib/types";
import { formatCompact } from "@/lib/format";

function formatDateShort(d: string) {
  const date = new Date(`${d}T00:00:00Z`);
  return date.toLocaleDateString("es-DO", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
    >
      <div style={{ color: "var(--text-muted)" }}>{label ? formatDateShort(label) : ""}</div>
      <div className="font-semibold tabular-nums">{formatCompact(payload[0].value)}</div>
    </div>
  );
}

export function TrendChart({ data, seriesLabel }: { data: TimePoint[]; seriesLabel: string }) {
  return (
    <div>
      <div className="mb-1 text-xs" style={{ color: "var(--text-muted)" }}>
        {seriesLabel}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--seq-500)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--seq-500)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--seq-500)"
            strokeWidth={2}
            fill="url(#trendFill)"
            activeDot={{ r: 4, stroke: "var(--surface-1)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
