"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Artist } from "@/lib/types";
import { formatCompact } from "@/lib/format";

interface Row {
  platform: string;
  [artistId: string]: string | number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
    >
      <div className="mb-1 font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5 tabular-nums">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: "var(--text-secondary)" }}>{p.name}:</span>
          <span className="font-semibold">{formatCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ComparisonChart({ rows, artists }: { rows: Row[]; artists: Artist[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--gridline)" />
        <XAxis dataKey="platform" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={{ stroke: "var(--baseline)" }} tickLine={false} />
        <YAxis
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatCompact(v)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-2)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
        {artists.map((a) => (
          <Bar key={a.id} dataKey={a.id} name={a.name} fill={a.accent} radius={[4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
