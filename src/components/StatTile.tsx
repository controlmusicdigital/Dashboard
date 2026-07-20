import { formatDelta } from "@/lib/format";

export function DeltaBadge({ deltaPct }: { deltaPct: number }) {
  if (deltaPct === 0) return null;
  const good = deltaPct > 0;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium"
      style={{
        color: good ? "var(--success-text)" : "var(--status-critical)",
        backgroundColor: good ? "color-mix(in srgb, var(--success-text) 14%, transparent)" : "color-mix(in srgb, var(--status-critical) 14%, transparent)",
      }}
    >
      {good ? "↑" : "↓"} {formatDelta(deltaPct)}
    </span>
  );
}

export function StatTile({ label, value, deltaPct }: { label: string; value: string; deltaPct: number }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl p-3"
      style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)" }}
    >
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {value}
        </span>
        <DeltaBadge deltaPct={deltaPct} />
      </div>
    </div>
  );
}
