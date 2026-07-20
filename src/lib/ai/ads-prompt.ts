import { Artist } from "../types";
import { CampaignObjective, OBJECTIVE_LABEL } from "../campaign-types";

export interface AdBrief {
  artist: Artist;
  objective: CampaignObjective;
  audience: string;
  topic: string;
}

export function buildAdPrompt(brief: AdBrief): string {
  const { artist, objective, audience, topic } = brief;
  return `Eres un estratega de publicidad digital para el artista urbano dominicano "${artist.name}"
(${artist.genre}, ${artist.location}), del sello Control Music Digital.

Vas a redactar el copy de una campana publicitaria paga con este objetivo: "${OBJECTIVE_LABEL[objective]}".
Publico objetivo: ${audience || "fans de musica urbana dominicana en RD y diaspora, 16-34 anos"}.
Tema/gancho de la campana: "${topic}"

Responde UNICAMENTE con un objeto JSON valido (sin markdown, sin backticks) con esta forma exacta:
{
  "headline": "titular corto y directo, maximo 40 caracteres",
  "description": "descripcion del anuncio, 1-2 frases persuasivas",
  "cta": "llamado a la accion corto (ej. Escuchar ahora, Ver mas, Reservar)",
  "variants": {
    "googleAds": "texto de anuncio de busqueda, formal y directo, con la llamada a la accion",
    "instagram": "copy para anuncio de Instagram, calido y visual, con emojis moderados",
    "tiktok": "copy para anuncio de TikTok, muy corto y con gancho inmediato",
    "facebook": "copy para anuncio de Facebook, un poco mas descriptivo",
    "youtube": "copy para anuncio pre-roll de YouTube, una frase de gancho + CTA",
    "x": "copy para anuncio de X, muy corto y directo, maximo 280 caracteres"
  }
}`;
}

export interface ParsedAd {
  headline: string;
  description: string;
  cta: string;
  variants: {
    googleAds: string;
    instagram: string;
    tiktok: string;
    facebook: string;
    youtube: string;
    x: string;
  };
}

export function parseAdJSON(raw: string): ParsedAd {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (
    typeof parsed.headline !== "string" ||
    typeof parsed.description !== "string" ||
    typeof parsed.cta !== "string" ||
    typeof parsed.variants !== "object" ||
    typeof parsed.variants.googleAds !== "string" ||
    typeof parsed.variants.instagram !== "string" ||
    typeof parsed.variants.tiktok !== "string" ||
    typeof parsed.variants.facebook !== "string" ||
    typeof parsed.variants.youtube !== "string" ||
    typeof parsed.variants.x !== "string"
  ) {
    throw new Error("Forma de JSON inesperada");
  }
  return parsed as ParsedAd;
}
