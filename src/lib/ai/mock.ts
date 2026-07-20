import { Artist } from "../types";
import { GeneratedContent } from "../studio-types";

const OPENERS = ["Llego lo nuevo", "Esto se estaba cocinando", "Sin previo aviso", "Directo desde RD", "Lo que pediste"];
const EMOJIS = ["🔥", "🎧", "🇩🇴", "🎤", "⚡"];
const HASHTAG_BASE = ["#ControlMusicDigital", "#MusicaDominicana", "#RD"];

function genreHashtags(genre: string): string[] {
  const g = genre.toLowerCase();
  if (g.includes("dembow")) return ["#Dembow", "#DembowRD", "#UrbanoRD"];
  if (g.includes("bachata")) return ["#Bachata", "#BachataUrbana", "#Aventura"];
  return ["#UrbanoRD"];
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateMockContent(artist: Artist, userPrompt: string): GeneratedContent {
  const seed = Math.floor(Math.random() * 100000);
  const opener = pick(OPENERS, seed);
  const emoji = pick(EMOJIS, seed + 1);
  const topic = userPrompt.trim().replace(/\.$/, "");

  const caption = `${opener}: ${topic}. ${artist.name} sigue representando ${artist.genre} desde ${artist.location} ${emoji}`;
  const hashtags = [...HASHTAG_BASE, ...genreHashtags(artist.genre), `#${artist.name.replace(/\s+/g, "")}`].slice(0, 6);

  return {
    caption,
    hashtags,
    variants: {
      instagram: `${caption}\n\n${hashtags.join(" ")}`,
      tiktok: `${topic} 👀 ${emoji} #parati #${artist.name.replace(/\s+/g, "")}`,
      facebook: `${artist.name} comparte: ${topic}. Sigue todo el movimiento de Control Music Digital.`,
      youtube: `${artist.name} - ${topic} | Control Music Digital`,
    },
    source: "mock",
    note: "Generado con datos de ejemplo porque no hay una API key configurada para este proveedor.",
  };
}
