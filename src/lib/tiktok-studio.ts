import { mulberry32, randInt } from "./rng";

export interface TikTokPost {
  id: string;
  title: string;
  thumbSeed: string;
  thumbnailUrl?: string;
  durationSec: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt: string;
}

const TITLES = [
  "POV: llego el drop del sencillo",
  "Reto de baile con el equipo",
  "Detras de camaras del video",
  "Freestyle de improviso",
  "Storytime del ultimo show",
  "Transicion con el nuevo look",
  "Fan edit favorito de la semana",
  "Sound check antes del concierto",
  "Duo con un fan",
  "Behind the scenes del estudio",
];

function dateDaysAgo(days: number): string {
  const d = new Date("2026-07-20T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function getTikTokPosts(artistId: string): TikTokPost[] {
  const rng = mulberry32(`${artistId}:tiktok-studio:v1`);
  return TITLES.map((title, i) => {
    const viewCount = randInt(rng, 12_000, 890_000);
    return {
      id: `${artistId}-tt-${i}`,
      title,
      thumbSeed: `${artistId}-${title}`,
      durationSec: randInt(rng, 8, 90),
      viewCount,
      likeCount: Math.round(viewCount * (0.05 + rng() * 0.1)),
      commentCount: Math.round(viewCount * (0.002 + rng() * 0.006)),
      shareCount: Math.round(viewCount * (0.005 + rng() * 0.015)),
      publishedAt: dateDaysAgo(randInt(rng, 1, 250)),
    };
  }).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
