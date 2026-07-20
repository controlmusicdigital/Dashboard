import { Artist } from "../types";

export function buildPrompt(artist: Artist, userPrompt: string): string {
  return `Eres el community manager del artista urbano dominicano "${artist.name}" (${artist.realName}),
genero ${artist.genre}, con base en ${artist.location}, que forma parte del sello Control Music Digital.
Bio: ${artist.bio}

Escribe contenido para una publicacion en redes sociales sobre esta idea del artista:
"${userPrompt}"

Responde UNICAMENTE con un objeto JSON valido (sin markdown, sin backticks) con esta forma exacta:
{
  "caption": "caption principal en espanol dominicano, con personalidad, 2-4 frases, puede usar emojis",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "variants": {
    "instagram": "version para Instagram, calida, puede tener saltos de linea y emojis",
    "tiktok": "version para TikTok, corta, directa, con gancho en la primera frase",
    "facebook": "version para Facebook, un poco mas descriptiva/informativa",
    "youtube": "titulo + descripcion corta estilo YouTube Shorts, en una sola linea",
    "x": "version para X, muy corta y directa, maximo 280 caracteres"
  }
}`;
}

export interface ParsedGeneration {
  caption: string;
  hashtags: string[];
  variants: {
    instagram: string;
    tiktok: string;
    facebook: string;
    youtube: string;
    x: string;
  };
}

export function parseGenerationJSON(raw: string): ParsedGeneration {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (
    typeof parsed.caption !== "string" ||
    !Array.isArray(parsed.hashtags) ||
    typeof parsed.variants !== "object" ||
    typeof parsed.variants.instagram !== "string" ||
    typeof parsed.variants.tiktok !== "string" ||
    typeof parsed.variants.facebook !== "string" ||
    typeof parsed.variants.youtube !== "string" ||
    typeof parsed.variants.x !== "string"
  ) {
    throw new Error("Forma de JSON inesperada");
  }
  return parsed as ParsedGeneration;
}
