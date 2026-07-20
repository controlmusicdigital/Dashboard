import "server-only";
import { Artist } from "../types";
import { AIProvider, GeneratedContent } from "../studio-types";
import { callChatGPT, callGemini } from "./providers";
import { generateMockContent } from "./mock";

export function providerStatus() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    chatgpt: Boolean(process.env.OPENAI_API_KEY),
  };
}

export async function generateContent(
  provider: AIProvider,
  artist: Artist,
  userPrompt: string
): Promise<GeneratedContent> {
  try {
    const parsed = provider === "gemini" ? await callGemini(artist, userPrompt) : await callChatGPT(artist, userPrompt);
    return { ...parsed, source: provider };
  } catch (err) {
    const mock = generateMockContent(artist, userPrompt);
    const reason = err instanceof Error ? err.message : String(err);
    mock.note = `No se pudo generar con ${provider === "gemini" ? "Gemini" : "ChatGPT"} (${reason}). Mostrando contenido de ejemplo.`;
    return mock;
  }
}
