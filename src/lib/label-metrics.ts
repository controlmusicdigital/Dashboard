import { ArtistData, PlatformId } from "./types";
import { formatCompact, formatUSD } from "./format";

export function buildLabelMetricsContext(dataList: ArtistData[]): string {
  const sum = (pick: (d: ArtistData) => number) => dataList.reduce((acc, d) => acc + pick(d), 0);
  const socialReach = sum((d) =>
    (["instagram", "tiktok", "facebook", "x"] as PlatformId[]).reduce((s, p) => s + (d.platforms[p].headline.raw ?? 0), 0)
  );
  const kpis = [
    { label: "Oyentes mensuales (Spotify)", raw: sum((d) => d.platforms.spotify.headline.raw ?? 0), format: formatCompact },
    { label: "Suscriptores (YouTube)", raw: sum((d) => d.platforms.youtube.headline.raw ?? 0), format: formatCompact },
    { label: "Alcance social cruzado", raw: socialReach, format: formatCompact },
    { label: "Inversion en Google Ads", raw: sum((d) => d.platforms.googleAds.headline.raw ?? 0), format: formatUSD },
    { label: "Ingresos brutos DistroKid", raw: sum((d) => d.platforms.distrokid.headline.raw ?? 0), format: formatUSD },
  ];
  return kpis.map((k) => `${k.label}: ${k.format(k.raw)}`).join(" · ");
}
