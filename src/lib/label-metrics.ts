import { getLabelData } from "./label-data";
import { PlatformId } from "./types";
import { formatCompact, formatUSD } from "./format";

export function buildLabelMetricsContext(): string {
  const labelData = getLabelData();
  const socialReach = (["instagram", "tiktok", "facebook", "x"] as PlatformId[]).reduce(
    (sum, p) => sum + (labelData.platforms[p].headline.raw ?? 0),
    0
  );
  const kpis = [
    { label: "Oyentes mensuales (Spotify)", raw: labelData.platforms.spotify.headline.raw ?? 0, format: formatCompact },
    { label: "Suscriptores (YouTube)", raw: labelData.platforms.youtube.headline.raw ?? 0, format: formatCompact },
    { label: "Alcance social cruzado", raw: socialReach, format: formatCompact },
    { label: "Inversion en Google Ads", raw: labelData.platforms.googleAds.headline.raw ?? 0, format: formatUSD },
    { label: "Ingresos brutos DistroKid", raw: labelData.platforms.distrokid.headline.raw ?? 0, format: formatUSD },
  ];
  return kpis.map((k) => `${k.label}: ${k.format(k.raw)}`).join(" · ");
}
