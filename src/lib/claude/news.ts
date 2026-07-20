import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { NewsItem, NewsResult } from "../news-types";
import { mockNews } from "./news-mock";
import { requestGeminiWithTools } from "../ai/providers";

const NEWS_PROMPT = `Busca las noticias mas recientes y relevantes (idealmente de las ultimas 48 horas) sobre
la industria musical y la farandula de Republica Dominicana: dembow, bachata, urbano, merengue, sellos
disqueras, giras, premios, colaboraciones y farandula de artistas dominicanos.

Usa la herramienta de busqueda web. Solo incluye noticias reales que encuentres en la busqueda, con su
URL real. No inventes titulares, fuentes ni enlaces.

Cuando termines de buscar, responde UNICAMENTE con un arreglo JSON valido (sin markdown, sin backticks,
sin texto adicional) de hasta 8 elementos con esta forma exacta:
[
  {
    "title": "titular corto en espanol",
    "summary": "resumen de 1-2 frases en espanol",
    "source": "nombre del sitio o medio",
    "url": "URL real del articulo",
    "publishedAt": "fecha o antiguedad relativa, ej. 'hace 3 horas' o '19 jul 2026'"
  }
]`;

function parseNewsJSON(raw: string): NewsItem[] {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Se esperaba un arreglo JSON");
  return parsed
    .filter(
      (item): item is NewsItem =>
        item &&
        typeof item.title === "string" &&
        typeof item.summary === "string" &&
        typeof item.source === "string" &&
        typeof item.url === "string" &&
        typeof item.publishedAt === "string"
    )
    .slice(0, 8);
}

async function fetchNewsWithGemini(): Promise<NewsItem[]> {
  const text = await requestGeminiWithTools(NEWS_PROMPT, [{ google_search: {} }]);
  const items = parseNewsJSON(text);
  if (items.length === 0) throw new Error("La busqueda no devolvio noticias");
  return items;
}

async function fetchNewsWithClaude(): Promise<NewsItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no esta configurada");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
    messages: [{ role: "user", content: NEWS_PROMPT }],
  });

  const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
  const lastText = textBlocks[textBlocks.length - 1];
  if (!lastText) throw new Error("Claude no devolvio texto");

  const items = parseNewsJSON(lastText.text);
  if (items.length === 0) throw new Error("La busqueda no devolvio noticias");
  return items;
}

export async function fetchIndustryNews(): Promise<NewsResult> {
  const generatedAt = new Date().toISOString();

  // Gemini first: it has a free tier, so this works without any billing configured.
  if (process.env.GEMINI_API_KEY) {
    try {
      const items = await fetchNewsWithGemini();
      return { items, source: "gemini", generatedAt };
    } catch (err) {
      if (!process.env.ANTHROPIC_API_KEY) {
        const reason = err instanceof Error ? err.message : String(err);
        return {
          items: mockNews(),
          source: "mock",
          generatedAt,
          note: `No se pudo buscar noticias en vivo con Gemini (${reason}). Mostrando ejemplo.`,
        };
      }
      // fall through to Claude below
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const items = await fetchNewsWithClaude();
      return { items, source: "claude", generatedAt };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return {
        items: mockNews(),
        source: "mock",
        generatedAt,
        note: `No se pudo buscar noticias en vivo con Claude (${reason}). Mostrando ejemplo.`,
      };
    }
  }

  return {
    items: mockNews(),
    source: "mock",
    generatedAt,
    note: "No hay GEMINI_API_KEY ni ANTHROPIC_API_KEY configurada. Mostrando noticias de ejemplo.",
  };
}
