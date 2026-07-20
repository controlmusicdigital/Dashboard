import "server-only";
import { AIProvider } from "../studio-types";
import { AdContent } from "../campaign-types";
import { requestChatGPTText, requestGeminiText } from "./providers";
import { AdBrief, buildAdPrompt, parseAdJSON } from "./ads-prompt";
import { mockAdContent } from "./ads-mock";

export async function generateAdContent(provider: AIProvider, brief: AdBrief): Promise<AdContent> {
  try {
    const promptText = buildAdPrompt(brief);
    const raw = provider === "gemini" ? await requestGeminiText(promptText) : await requestChatGPTText(promptText);
    const parsed = parseAdJSON(raw);
    return { ...parsed, source: provider };
  } catch (err) {
    const mock = mockAdContent(brief);
    const reason = err instanceof Error ? err.message : String(err);
    mock.note = `No se pudo generar con ${provider === "gemini" ? "Gemini" : "ChatGPT"} (${reason}). Mostrando contenido de ejemplo.`;
    return mock;
  }
}
