import { mulberry32, randInt } from "./rng";

export interface InstagramPost {
  id: string;
  caption: string;
  thumbSeed: string;
  thumbnailUrl?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  likes: number;
  comments: number;
  publishedAt: string;
}

const CAPTIONS = [
  "Nuevo sencillo ya disponible",
  "Detras de camaras del video oficial",
  "En el estudio grabando",
  "Gracias por el apoyo en el show de anoche",
  "Adelanto del proximo lanzamiento",
  "Sesion acustica",
  "Con el equipo de gira",
  "Momento favorito del ano",
  "Video oficial ya en YouTube",
  "Behind the scenes",
];

function dateDaysAgo(days: number): string {
  const d = new Date("2026-07-20T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function getInstagramPosts(artistId: string): InstagramPost[] {
  const rng = mulberry32(`${artistId}:instagram-studio:v1`);
  return CAPTIONS.map((caption, i) => {
    const likes = randInt(rng, 900, 48_000);
    return {
      id: `${artistId}-ig-${i}`,
      caption,
      thumbSeed: `${artistId}-${caption}`,
      mediaType: (["IMAGE", "VIDEO", "CAROUSEL_ALBUM"] as const)[i % 3],
      likes,
      comments: Math.round(likes * (0.01 + rng() * 0.04)),
      publishedAt: dateDaysAgo(randInt(rng, 1, 300)),
    };
  }).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
