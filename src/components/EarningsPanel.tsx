"use client";

import { ArtistData, PlatformId } from "@/lib/types";
import { PLATFORM_META, PlatformIcon } from "@/lib/platforms";
import { formatUSD } from "@/lib/format";
import { FuturisticKpiCard } from "./FuturisticKpiCard";
import { TrendChart } from "./TrendChart";

// Platforms that pay the artist directly (as opposed to Google Ads, which is a cost, or
// Spotify/Instagram/etc., which don't pay out on their own — Spotify streaming revenue already
// flows through DistroKid above).
const MONETIZED_PLATFORMS: PlatformId[] = ["distrokid", "ascap", "bmi"];

export function EarningsPanel({ data }: { data: ArtistData }) {
  const { artist, platforms } = data;
  const rows = MONETIZED_PLATFORMS.map((id) => ({ id, snapshot: platforms[id] }));
  const total = rows.reduce((sum, r) => sum + (r.snapshot.headline.raw ?? 0), 0);
  const avgDelta = rows.reduce((sum, r) => sum + r.snapshot.headline.deltaPct, 0) / rows.length;

  const days = platforms.distrokid.series.length;
  const combinedSeries = Array.from({ length: days }, (_, i) => ({
    date: platforms.distrokid.series[i].date,
    value: MONETIZED_PLATFORMS.reduce((sum, id) => sum + (platforms[id].series[i]?.value ?? 0), 0),
  }));

  const upcomingPayouts = rows
    .map((r) => ({ label: PLATFORM_META[r.id].label, value: r.snapshot.stats.find((s) => s.label === "Proximo pago")?.value }))
    .filter((p): p is { label: string; value: string } => Boolean(p.value));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Ingresos
        </h2>
        <p className="mt-1 max-w-2xl text-xs" style={{ color: "var(--text-muted)" }}>
          Cuanto ha generado {artist.name} en total y de donde viene, sumando todas las plataformas que le pagan
          directamente: distribucion de streaming (DistroKid) y regalias de interpretacion publica (ASCAP, BMI).
          Datos de ejemplo hasta conectar cada cuenta real (ver pestana &quot;Conexiones&quot;).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[280px_1fr]">
        <FuturisticKpiCard label="Ingresos totales (30 dias)" raw={total} format={formatUSD} deltaPct={avgDelta} accent="var(--accent-amber)" />
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
          <TrendChart data={combinedSeries} seriesLabel="Ingresos combinados por dia (USD)" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Desglose por plataforma
        </h3>
        {rows.map(({ id, snapshot }) => {
          const pct = total > 0 ? ((snapshot.headline.raw ?? 0) / total) * 100 : 0;
          return (
            <div
              key={id}
              className="flex flex-col gap-2 rounded-2xl p-4"
              style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <PlatformIcon platform={id} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {PLATFORM_META[id].label}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {snapshot.headline.value}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {pct.toFixed(0)}% del total
                  </div>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PLATFORM_META[id].brandColor }} />
              </div>
            </div>
          );
        })}
      </div>

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
