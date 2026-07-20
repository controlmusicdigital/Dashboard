import "server-only";
import { AIProvider } from "../studio-types";
import { requestChatGPTText, requestGeminiText } from "./providers";
import { buildBroadcastPrompt, parseBroadcastJSON } from "./broadcast-prompt";
import { mockBroadcastMessage } from "./broadcast-mock";

export interface BroadcastGeneration {
  message: string;
  source: AIProvider | "mock";
  note?: string;
}

export async function generateBroadcastMessage(provider: AIProvider, topic: string): Promise<BroadcastGeneration> {
  try {
    const promptText = buildBroadcastPrompt(topic);
    const raw = provider === "gemini" ? await requestGeminiText(promptText) : await requestChatGPTText(promptText);
    const parsed = parseBroadcastJSON(raw);
    return { ...parsed, source: provider };
  } catch (err) {
    const mock = mockBroadcastMessage(topic);
    const reason = err instanceof Error ? err.message : String(err);
    return {
      message: mock.message,
      source: "mock",
      note: `No se pudo generar con ${provider === "gemini" ? "Gemini" : "ChatGPT"} (${reason}). Mostrando contenido de ejemplo.`,
    };
  }
}
