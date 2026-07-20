import { artists } from "./artists";
import { formatCompact, formatInt, formatPct, formatUSD } from "./format";
import { mulberry32, randRange } from "./rng";
import { ArtistData, PlatformId, PlatformSnapshot, TimePoint } from "./types";

const ANCHOR = new Date("2026-07-20T00:00:00Z");

function last30Dates(): string[] {
  const out: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(ANCHOR);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function series(rng: () => number, base: number, volatility: number, driftPct: number): TimePoint[] {
  const dates = last30Dates();
  const n = dates.length;
  let level = base * (1 - driftPct / 100);
  const step = (base * (driftPct / 100)) / n;
  return dates.map((date) => {
    level += step + level * randRange(rng, -volatility, volatility);
    return { date, value: Math.max(0, Math.round(level)) };
  });
}

const ARTIST_MULTIPLIER: Record<string, number> = {
  pacheman: 1.35,
  "max-aventura": 1.85,
  "el-real-soprano": 0.55,
};

interface Base {
  spotifyListeners: number;
  youtubeSubs: number;
  igFollowers: number;
  ttFollowers: number;
  fbFollowers: number;
  xFollowers: number;
  adsSpend: number;
  distroRevenue: number;
}

const BASE: Base = {
  spotifyListeners: 380_000,
  youtubeSubs: 210_000,
  igFollowers: 520_000,
  ttFollowers: 340_000,
  fbFollowers: 150_000,
  xFollowers: 95_000,
  adsSpend: 3_200,
  distroRevenue: 5_400,
};

const TRACK_NAMES = ["Perreo Intenso", "Fuego en la Pista", "Noche de RD", "Bachata del Alma", "Sin Frenos", "Dembow 24/7"];
const VIDEO_TITLES = ["Video Oficial", "Sesion en Vivo", "Detras de Camaras", "Freestyle", "Visualizer"];
const POST_TYPES = ["Reel", "Carrusel", "Foto"];
const CAMPAIGN_NAMES = ["Lanzamiento sencillo", "Remarketing streams", "Alcance RD", "Conversion pre-save"];

function buildSpotify(artistId: string, rng: () => number, mult: number): PlatformSnapshot {
  const listeners = BASE.spotifyListeners * mult * randRange(rng, 0.85, 1.15);
  const followers = listeners * randRange(rng, 0.32, 0.42);
  const streams30d = listeners * randRange(rng, 3.4, 4.6);
  const saves = streams30d * randRange(rng, 0.04, 0.07);
  const delta = randRange(rng, -4, 14);
  return {
    platform: "spotify",
    connected: true,
    headline: { label: "Oyentes mensuales", value: formatCompact(listeners), deltaPct: delta, raw: listeners },
    stats: [
      { label: "Seguidores", value: formatCompact(followers), deltaPct: randRange(rng, -1, 9) },
      { label: "Streams (30d)", value: formatCompact(streams30d), deltaPct: randRange(rng, -3, 12) },
      { label: "Canciones guardadas", value: formatCompact(saves), deltaPct: randRange(rng, -2, 10) },
    ],
    series: series(rng, streams30d / 30, 0.18, delta),
    seriesLabel: "Streams por dia",
    topItems: TRACK_NAMES.slice(0, 4).map((t) => ({
      title: t,
      metricLabel: "streams",
      metricValue: formatCompact(streams30d * randRange(rng, 0.08, 0.3)),
    })),
  };
}

function buildYoutube(artistId: string, rng: () => number, mult: number): PlatformSnapshot {
  const subs = BASE.youtubeSubs * mult * randRange(rng, 0.85, 1.2);
  const views30d = subs * randRange(rng, 1.6, 2.6);
  const watchHours = views30d * randRange(rng, 0.045, 0.07);
  const delta = randRange(rng, -3, 13);
  return {
    platform: "youtube",
    connected: true,
    headline: { label: "Suscriptores", value: formatCompact(subs), deltaPct: delta, raw: subs },
    stats: [
      { label: "Vistas (30d)", value: formatCompact(views30d), deltaPct: randRange(rng, -2, 15) },
      { label: "Horas vistas", value: formatCompact(watchHours), deltaPct: randRange(rng, -2, 11) },
      { label: "Comentarios (30d)", value: formatCompact(views30d * 0.006), deltaPct: randRange(rng, -4, 9) },
    ],
    series: series(rng, views30d / 30, 0.22, delta),
    seriesLabel: "Vistas por dia",
    topItems: VIDEO_TITLES.slice(0, 4).map((t) => ({
      title: artistId === "max-aventura" ? `${t} - Max` : t,
      metricLabel: "vistas",
      metricValue: formatCompact(views30d * randRange(rng, 0.06, 0.28)),
    })),
  };
}

function buildInstagram(rng: () => number, mult: number): PlatformSnapshot {
  const followers = BASE.igFollowers * mult * randRange(rng, 0.8, 1.2);
  const reach30d = followers * randRange(rng, 1.1, 2.1);
  const engagementRate = randRange(rng, 2.5, 6.5);
  const delta = randRange(rng, -2, 9);
  return {
    platform: "instagram",
    connected: true,
    headline: { label: "Seguidores", value: formatCompact(followers), deltaPct: delta, raw: followers },
    stats: [
      { label: "Alcance (30d)", value: formatCompact(reach30d), deltaPct: randRange(rng, -3, 14) },
      { label: "Interaccion", value: formatPct(engagementRate), deltaPct: randRange(rng, -8, 8) },
      { label: "Publicaciones (30d)", value: formatInt(randRange(rng, 10, 28)), deltaPct: 0 },
    ],
    series: series(rng, followers, 0.01, delta * 0.6),
    seriesLabel: "Seguidores acumulados",
    topItems: POST_TYPES.map((t) => ({
      title: t,
      metricLabel: "interacciones",
      metricValue: formatCompact(reach30d * randRange(rng, 0.03, 0.09)),
    })),
  };
}

function buildTiktok(rng: () => number, mult: number): PlatformSnapshot {
  const followers = BASE.ttFollowers * mult * randRange(rng, 0.75, 1.3);
  const views30d = followers * randRange(rng, 2.5, 5.5);
  const likesTotal = followers * randRange(rng, 3.5, 6.5);
  const delta = randRange(rng, -1, 22);
  return {
    platform: "tiktok",
    connected: true,
    headline: { label: "Seguidores", value: formatCompact(followers), deltaPct: delta, raw: followers },
    stats: [
      { label: "Vistas (30d)", value: formatCompact(views30d), deltaPct: randRange(rng, -4, 26) },
      { label: "Me gusta totales", value: formatCompact(likesTotal), deltaPct: randRange(rng, -2, 14) },
      { label: "Videos publicados (30d)", value: formatInt(randRange(rng, 8, 20)), deltaPct: 0 },
    ],
    series: series(rng, views30d / 30, 0.3, delta),
    seriesLabel: "Vistas por dia",
    topItems: VIDEO_TITLES.slice(1, 5).map((t) => ({
      title: t,
      metricLabel: "vistas",
      metricValue: formatCompact(views30d * randRange(rng, 0.07, 0.32)),
    })),
  };
}

function buildFacebook(rng: () => number, mult: number): PlatformSnapshot {
  const followers = BASE.fbFollowers * mult * randRange(rng, 0.7, 1.25);
  const reach30d = followers * randRange(rng, 0.6, 1.4);
  const delta = randRange(rng, -3, 7);
  return {
    platform: "facebook",
    connected: true,
    headline: { label: "Seguidores de pagina", value: formatCompact(followers), deltaPct: delta, raw: followers },
    stats: [
      { label: "Alcance (30d)", value: formatCompact(reach30d), deltaPct: randRange(rng, -5, 10) },
      { label: "Interacciones (30d)", value: formatCompact(reach30d * randRange(rng, 0.02, 0.05)), deltaPct: randRange(rng, -6, 9) },
      { label: "Nuevos seguidores (30d)", value: formatCompact(followers * randRange(rng, 0.005, 0.02)), deltaPct: 0 },
    ],
    series: series(rng, reach30d / 30, 0.2, delta),
    seriesLabel: "Alcance por dia",
    topItems: POST_TYPES.map((t) => ({
      title: `${t} de pagina`,
      metricLabel: "alcance",
      metricValue: formatCompact(reach30d * randRange(rng, 0.05, 0.15)),
    })),
  };
}

function buildX(rng: () => number, mult: number): PlatformSnapshot {
  const followers = BASE.xFollowers * mult * randRange(rng, 0.7, 1.3);
  const impressions30d = followers * randRange(rng, 3.5, 7);
  const engagementRate = randRange(rng, 1.2, 3.8);
  const delta = randRange(rng, -4, 12);
  return {
    platform: "x",
    connected: true,
    headline: { label: "Seguidores", value: formatCompact(followers), deltaPct: delta, raw: followers },
    stats: [
      { label: "Impresiones (30d)", value: formatCompact(impressions30d), deltaPct: randRange(rng, -6, 20) },
      { label: "Interaccion", value: formatPct(engagementRate), deltaPct: randRange(rng, -8, 8) },
      { label: "Publicaciones (30d)", value: formatInt(randRange(rng, 15, 40)), deltaPct: 0 },
    ],
    series: series(rng, impressions30d / 30, 0.28, delta),
    seriesLabel: "Impresiones por dia",
    topItems: TRACK_NAMES.slice(1, 5).map((t) => ({
      title: `Post: ${t}`,
      metricLabel: "impresiones",
      metricValue: formatCompact(impressions30d * randRange(rng, 0.05, 0.2)),
    })),
  };
}

function buildGoogleAds(rng: () => number, mult: number): PlatformSnapshot {
  const spend = BASE.adsSpend * mult * randRange(rng, 0.6, 1.5);
  const impressions = spend * randRange(rng, 850, 1400);
  const clicks = impressions * randRange(rng, 0.012, 0.028);
  const ctr = (clicks / impressions) * 100;
  const cpc = spend / clicks;
  const conversions = clicks * randRange(rng, 0.03, 0.08);
  const delta = randRange(rng, -12, 20);
  return {
    platform: "googleAds",
    connected: true,
    headline: { label: "Inversion (30d)", value: formatUSD(spend), deltaPct: delta, raw: spend },
    stats: [
      { label: "Impresiones", value: formatCompact(impressions), deltaPct: randRange(rng, -6, 18) },
      { label: "Clics", value: formatCompact(clicks), deltaPct: randRange(rng, -8, 22) },
      { label: "CTR", value: formatPct(ctr), deltaPct: randRange(rng, -10, 10) },
      { label: "CPC promedio", value: `$${cpc.toFixed(2)}`, deltaPct: randRange(rng, -15, 8) },
      { label: "Conversiones", value: formatInt(conversions), deltaPct: randRange(rng, -5, 25) },
    ],
    series: series(rng, spend / 30, 0.25, delta),
    seriesLabel: "Gasto por dia (USD)",
    topItems: CAMPAIGN_NAMES.map((c) => ({
      title: c,
      metricLabel: "clics",
      metricValue: formatInt(clicks * randRange(rng, 0.1, 0.4)),
    })),
  };
}

function buildDistrokid(rng: () => number, mult: number): PlatformSnapshot {
  const revenue = BASE.distroRevenue * mult * randRange(rng, 0.7, 1.4);
  const streamsTotal = revenue * randRange(rng, 260, 340);
  const downloads = streamsTotal * randRange(rng, 0.002, 0.006);
  const delta = randRange(rng, -6, 16);
  return {
    platform: "distrokid",
    connected: true,
    headline: { label: "Ingresos (30d)", value: formatUSD(revenue), deltaPct: delta, raw: revenue },
    stats: [
      { label: "Streams totales", value: formatCompact(streamsTotal), deltaPct: randRange(rng, -3, 15) },
      { label: "Descargas", value: formatCompact(downloads), deltaPct: randRange(rng, -8, 12) },
      { label: "Plataformas activas", value: "12", deltaPct: 0 },
      { label: "Proximo pago", value: "1 ago 2026", deltaPct: 0 },
    ],
    series: series(rng, revenue / 30, 0.2, delta),
    seriesLabel: "Ingresos por dia (USD)",
    topItems: TRACK_NAMES.slice(2, 6).map((t) => ({
      title: t,
      metricLabel: "ingresos",
      metricValue: formatUSD(revenue * randRange(rng, 0.08, 0.32)),
    })),
  };
}

function buildPlatform(id: PlatformId, artistId: string, rng: () => number, mult: number): PlatformSnapshot {
  switch (id) {
    case "spotify":
      return buildSpotify(artistId, rng, mult);
    case "youtube":
      return buildYoutube(artistId, rng, mult);
    case "instagram":
      return buildInstagram(rng, mult);
    case "tiktok":
      return buildTiktok(rng, mult);
    case "facebook":
      return buildFacebook(rng, mult);
    case "x":
      return buildX(rng, mult);
    case "googleAds":
      return buildGoogleAds(rng, mult);
    case "distrokid":
      return buildDistrokid(rng, mult);
  }
}

const PLATFORM_IDS: PlatformId[] = ["spotify", "youtube", "instagram", "tiktok", "facebook", "x", "googleAds", "distrokid"];

function buildArtistData(artistId: string): ArtistData {
  const artist = artists.find((a) => a.id === artistId)!;
  const mult = ARTIST_MULTIPLIER[artistId] ?? 1;
  const platforms = {} as Record<PlatformId, PlatformSnapshot>;
  for (const id of PLATFORM_IDS) {
    const rng = mulberry32(`${artistId}:${id}:v1`);
    platforms[id] = buildPlatform(id, artistId, rng, mult);
  }
  return { artist, platforms };
}

let cache: Record<string, ArtistData> | null = null;

export function getAllArtistData(): Record<string, ArtistData> {
  if (!cache) {
    cache = {};
    for (const a of artists) cache[a.id] = buildArtistData(a.id);
  }
  return cache;
}

export function getArtistData(artistId: string): ArtistData {
  return getAllArtistData()[artistId];
}
