import { mulberry32, randInt } from "./rng";

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbSeed: string;
  views: number;
  likes: number;
  comments: number;
  durationSec: number;
  publishedAt: string;
  status: "publico" | "no listado" | "borrador";
}

const TITLES = [
  "Video Oficial",
  "Sesion en Vivo",
  "Detras de Camaras",
  "Freestyle",
  "Visualizer",
  "Entrevista Exclusiva",
  "Reaccion",
  "Adelanto del Album",
  "Vlog de Gira",
  "Behind the Beat",
];

function dateDaysAgo(days: number): string {
  const d = new Date("2026-07-20T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function getYouTubeVideos(artistId: string): YouTubeVideo[] {
  const rng = mulberry32(`${artistId}:youtube-studio:v1`);
  return TITLES.map((title, i) => {
    const views = randInt(rng, 8_000, 420_000);
    return {
      id: `${artistId}-yt-${i}`,
      title,
      thumbSeed: `${artistId}-${title}`,
      views,
      likes: Math.round(views * (0.02 + rng() * 0.05)),
      comments: Math.round(views * (0.002 + rng() * 0.006)),
      durationSec: randInt(rng, 45, 720),
      publishedAt: dateDaysAgo(randInt(rng, 3, 400)),
      status: (i === TITLES.length - 1 ? "borrador" : "publico") as YouTubeVideo["status"],
    };
  }).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} k`;
  return `${n}`;
}
