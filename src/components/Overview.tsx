import { ArtistData } from "@/lib/types";
import { formatCompact, formatUSD } from "@/lib/format";
import { FuturisticKpiCard } from "./FuturisticKpiCard";
import { ComparisonChart } from "./ComparisonChart";
import { PlatformIcon } from "@/lib/platforms";

const AUDIENCE_PLATFORMS = [
  { id: "spotify" as const, label: "Spotify" },
  { id: "youtube" as const, label: "YouTube" },
  { id: "instagram" as const, label: "Instagram" },
  { id: "tiktok" as const, label: "TikTok" },
  { id: "facebook" as const, label: "Facebook" },
  { id: "x" as const, label: "X" },
];

export function Overview({ dataList, onSelectArtist }: { dataList: ArtistData[]; onSelectArtist: (id: string) => void }) {
  const sum = (pick: (d: ArtistData) => number) => dataList.reduce((acc, d) => acc + pick(d), 0);
  const avgDelta = (pick: (d: ArtistData) => number) => sum(pick) / (dataList.length || 1);
  const combinedSeries = (pick: (d: ArtistData) => number[]) => {
    const series = dataList.map(pick);
    const len = series[0]?.length ?? 0;
    return Array.from({ length: len }, (_, i) => series.reduce((acc, s) => acc + s[i], 0));
  };

  const totalSpotify = sum((d) => d.platforms.spotify.headline.raw ?? 0);
  const totalYoutube = sum((d) => d.platforms.youtube.headline.raw ?? 0);
  const totalSocial = sum(
    (d) =>
      (d.platforms.instagram.headline.raw ?? 0) +
      (d.platforms.tiktok.headline.raw ?? 0) +
      (d.platforms.facebook.headline.raw ?? 0) +
      (d.platforms.x.headline.raw ?? 0)
  );
  const totalAdsSpend = sum((d) => d.platforms.googleAds.headline.raw ?? 0);
  const totalDistroRevenue = sum((d) => d.platforms.distrokid.headline.raw ?? 0);

  const spotifyDelta = avgDelta((d) => d.platforms.spotify.headline.deltaPct);
  const youtubeDelta = avgDelta((d) => d.platforms.youtube.headline.deltaPct);
  const adsDelta = avgDelta((d) => d.platforms.googleAds.headline.deltaPct);
  const distroDelta = avgDelta((d) => d.platforms.distrokid.headline.deltaPct);

  const spotifySeries = combinedSeries((d) => d.platforms.spotify.series.map((p) => p.value));
  const youtubeSeries = combinedSeries((d) => d.platforms.youtube.series.map((p) => p.value));
  const adsSeries = combinedSeries((d) => d.platforms.googleAds.series.map((p) => p.value));
  const distroSeries = combinedSeries((d) => d.platforms.distrokid.series.map((p) => p.value));

  const comparisonRows = AUDIENCE_PLATFORMS.map(({ id, label }) => {
    const row: Record<string, string | number> = { platform: label };
    for (const d of dataList) row[d.artist.id] = d.platforms[id].headline.raw ?? 0;
    return row as { platform: string } & Record<string, number>;
  });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Sello en conjunto · ultimos 30 dias
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <FuturisticKpiCard
            label="Oyentes mensuales (Spotify)"
            raw={totalSpotify}
            format={formatCompact}
            deltaPct={spotifyDelta}
            series={spotifySeries}
            accent="var(--accent-cyan)"
          />
          <FuturisticKpiCard
            label="Suscriptores (YouTube)"
            raw={totalYoutube}
            format={formatCompact}
            deltaPct={youtubeDelta}
            series={youtubeSeries}
            accent="var(--accent-red-dr)"
          />
          <FuturisticKpiCard label="Seguidores en redes" raw={totalSocial} format={formatCompact} accent="var(--accent-magenta)" />
          <FuturisticKpiCard
            label="Inversion en Ads"
            raw={totalAdsSpend}
            format={formatUSD}
            deltaPct={adsDelta}
            series={adsSeries}
            accent="var(--accent-blue-dr)"
          />
          <FuturisticKpiCard
            label="Ingresos DistroKid"
            raw={totalDistroRevenue}
            format={formatUSD}
            deltaPct={distroDelta}
            series={distroSeries}
            accent="var(--accent-amber)"
          />
        </div>
      </section>

      <section
        className="rounded-2xl p-5"
        style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
      >
        <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Audiencia por plataforma y artista
        </h2>
        <ComparisonChart rows={comparisonRows} artists={dataList.map((d) => d.artist)} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Artistas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {dataList.map((d) => (
            <button
              key={d.artist.id}
              onClick={() => onSelectArtist(d.artist.id)}
              className="flex flex-col gap-3 rounded-2xl p-5 text-left transition-colors hover:brightness-110"
              style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: d.artist.accent, color: "#0b0b0b" }}
                >
                  {d.artist.initials}
                </span>
                <div>
                  <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {d.artist.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {d.artist.genre}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="flex items-center gap-1">
                  <PlatformIcon platform="spotify" /> {d.platforms.spotify.headline.value}
                </span>
                <span className="flex items-center gap-1">
                  <PlatformIcon platform="instagram" /> {d.platforms.instagram.headline.value}
                </span>
                <span className="flex items-center gap-1">
                  <PlatformIcon platform="distrokid" /> {d.platforms.distrokid.headline.value}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
