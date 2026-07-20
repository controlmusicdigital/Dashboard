import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { Artist } from "../types";
import { GeneratedContent } from "../studio-types";
import { parseGenerationJSON } from "../ai/prompt";
import { generateMockContent } from "../ai/mock";

function buildLinkPrompt(artist: Artist, url: string): string {
  return `Eres el community manager del artista urbano dominicano "${artist.name}" (${artist.realName}),
genero ${artist.genre}, con base en ${artist.location}, que forma parte del sello Control Music Digital.
Bio: ${artist.bio}

Usa la herramienta de busqueda/lectura web para leer el contenido de este enlace: ${url}

Basandote en lo que encuentres ahi (un video, un articulo, un post), escribe un post para las redes de
${artist.name} inspirado en ese contenido — por ejemplo reaccionando, compartiendo, o comentando sobre el tema.

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

export async function importFromLink(artist: Artist, url: string): Promise<GeneratedContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const mock = generateMockContent(artist, `contenido de ${url}`);
    mock.note = "No hay ANTHROPIC_API_KEY configurada. Mostrando contenido de ejemplo.";
    return { ...mock, source: "mock" };
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      tools: [{ type: "web_fetch_20260209", name: "web_fetch", max_uses: 1 }],
      messages: [{ role: "user", content: buildLinkPrompt(artist, url) }],
    });

    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    const lastText = textBlocks[textBlocks.length - 1];
    if (!lastText) throw new Error("Claude no devolvio texto");

    const parsed = parseGenerationJSON(lastText.text);
    return { ...parsed, source: "claude" };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const mock = generateMockContent(artist, `contenido de ${url}`);
    mock.note = `No se pudo leer el enlace con Claude (${reason}). Mostrando contenido de ejemplo.`;
    return { ...mock, source: "mock" };
  }
}
