import { PLATFORM_META, PlatformIcon } from "@/lib/platforms";
import { PlatformSnapshot } from "@/lib/types";
import { DeltaBadge, StatTile } from "./StatTile";
import { TrendChart } from "./TrendChart";

export function PlatformCard({ snapshot }: { snapshot: PlatformSnapshot }) {
  const meta = PLATFORM_META[snapshot.platform];
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-5"
      style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <PlatformIcon platform={snapshot.platform} />
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {meta.label}
            </div>
            <div className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
              {meta.category}
            </div>
          </div>
        </div>
        {!snapshot.connected && (
          <span
            className="rounded-full px-2 py-1 text-xs font-medium"
            style={{ color: "var(--status-warning)", border: "1px solid var(--status-warning)" }}
          >
            Sin conectar
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {snapshot.headline.value}
        </span>
        <DeltaBadge deltaPct={snapshot.headline.deltaPct} />
      </div>
      <div className="-mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
        {snapshot.headline.label} · ultimos 30 dias
      </div>

      <TrendChart data={snapshot.series} seriesLabel={snapshot.seriesLabel} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {snapshot.stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} deltaPct={s.deltaPct} />
        ))}
      </div>

      <div>
        <div className="mb-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Mejor contenido / campanas
        </div>
        <ul className="flex flex-col gap-1.5">
          {snapshot.topItems.map((item) => (
            <li key={item.title} className="flex items-center justify-between text-sm">
              <span className="truncate pr-2" style={{ color: "var(--text-secondary)" }}>
                {item.title}
              </span>
              <span className="shrink-0 tabular-nums" style={{ color: "var(--text-primary)" }}>
                {item.metricValue} <span style={{ color: "var(--text-muted)" }}>{item.metricLabel}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
