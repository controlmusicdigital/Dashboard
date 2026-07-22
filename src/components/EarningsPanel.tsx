"use client";

import { ArtistData, PlatformId, PlatformSnapshot, TimePoint } from "@/lib/types";
import { PLATFORM_META, PlatformIcon } from "@/lib/platforms";
import { formatUSD } from "@/lib/format";
import { FuturisticKpiCard } from "./FuturisticKpiCard";
import { TrendChart } from "./TrendChart";

// Platforms that pay the artist directly through distribution/royalty statements.
const DISTRIBUTION_PLATFORMS: PlatformId[] = ["distrokid", "ascap", "bmi"];

// Social platforms with a real (or plausible) creator ad-revenue-share program —
// exposed on their PlatformSnapshot as `monetization` (see lib/mock-data.ts).
const SOCIAL_PLATFORMS: PlatformId[] = ["youtube", "tiktok", "instagram", "facebook", "x"];

interface EarningsRow {
  id: PlatformId;
  sourceLabel: string;
  total: number;
  deltaPct: number;
  series: TimePoint[];
  nextPayout?: string;
}

function distributionRow(id: PlatformId, snapshot: PlatformSnapshot): EarningsRow {
  return {
    id,
    sourceLabel: PLATFORM_META[id].label,
    total: snapshot.headline.raw ?? 0,
    deltaPct: snapshot.headline.deltaPct,
    series: snapshot.series,
    nextPayout: snapshot.stats.find((s) => s.label === "Proximo pago")?.value,
  };
}

function socialRow(id: PlatformId, snapshot: PlatformSnapshot): EarningsRow | null {
  if (!snapshot.monetization) return null;
  return {
    id,
    sourceLabel: snapshot.monetization.label,
    total: snapshot.monetization.total,
    deltaPct: snapshot.monetization.deltaPct,
    series: snapshot.monetization.series,
    nextPayout: snapshot.monetization.nextPayout,
  };
}

function sumSeries(rows: EarningsRow[]): TimePoint[] {
  const base = rows[0]?.series ?? [];
  return base.map((point, i) => ({
    date: point.date,
    value: rows.reduce((sum, r) => sum + (r.series[i]?.value ?? 0), 0),
  }));
}

export function EarningsPanel({ data }: { data: ArtistData }) {
  const { artist, platforms } = data;

  const distributionRows = DISTRIBUTION_PLATFORMS.map((id) => distributionRow(id, platforms[id]));
  const socialRows = SOCIAL_PLATFORMS.map((id) => socialRow(id, platforms[id])).filter((r): r is EarningsRow => r !== null);
  const allRows = [...distributionRows, ...socialRows];

  const total = allRows.reduce((sum, r) => sum + r.total, 0);
  const avgDelta = allRows.reduce((sum, r) => sum + r.deltaPct, 0) / (allRows.length || 1);
  const socialTotal = socialRows.reduce((sum, r) => sum + r.total, 0);

  const combinedSeries = sumSeries(allRows);

  const upcomingPayouts = allRows
    .map((r) => ({ label: PLATFORM_META[r.id].label, value: r.nextPayout }))
    .filter((p): p is { label: string; value: string } => Boolean(p.value));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Ingresos
        </h2>
        <p className="mt-1 max-w-2xl text-xs" style={{ color: "var(--text-muted)" }}>
          Cuanto ha generado {artist.name} en total y de donde viene, sumando distribucion de streaming (DistroKid),
          regalias de interpretacion publica (ASCAP, BMI), y los programas de monetizacion de cada red social
          (YouTube, TikTok, Instagram, Facebook, X). Datos de ejemplo hasta conectar cada cuenta real (ver pestana
          &quot;Conexiones&quot;).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[280px_1fr]">
        <FuturisticKpiCard label="Ingresos totales (30 dias)" raw={total} format={formatUSD} deltaPct={avgDelta} accent="var(--accent-amber)" />
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
          <TrendChart data={combinedSeries} seriesLabel="Ingresos combinados por dia (USD)" />
        </div>
      </div>

      <EarningsGroup
        title="Distribucion y regalias"
        rows={distributionRows}
        total={total}
        emptyText="Sin datos de distribucion."
      />

      <EarningsGroup
        title="Monetizacion en redes sociales"
        subtitle={`${formatUSD(socialTotal)} en total, ${total > 0 ? ((socialTotal / total) * 100).toFixed(0) : 0}% de los ingresos`}
        rows={socialRows}
        total={total}
        emptyText="Ninguna red social tiene monetizacion activa todavia."
      />

      {upcomingPayouts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Proximos pagos
          </h3>
          <div className="flex flex-wrap gap-3">
            {upcomingPayouts.map((p) => (
              <div key={p.label} className="rounded-xl px-3.5 py-2" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {p.label}
                </div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {p.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EarningsGroup({
  title,
  subtitle,
  rows,
  total,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  rows: EarningsRow[];
  total: number;
  emptyText: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {rows.length === 0 ? (
        <div
          className="rounded-2xl px-4 py-6 text-center text-xs"
          style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-muted)" }}
        >
          {emptyText}
        </div>
      ) : (
        rows.map((row) => {
          const pct = total > 0 ? (row.total / total) * 100 : 0;
          return (
            <div
              key={row.id}
              className="flex flex-col gap-2 rounded-2xl p-4"
              style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <PlatformIcon platform={row.id} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {PLATFORM_META[row.id].label}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {row.sourceLabel}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {formatUSD(row.total)}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {pct.toFixed(0)}% del total
                  </div>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PLATFORM_META[row.id].brandColor }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
