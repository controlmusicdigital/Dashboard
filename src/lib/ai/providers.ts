import "server-only";
import { buildPrompt, parseGenerationJSON, ParsedGeneration } from "./prompt";
import { Artist } from "../types";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const RETRYABLE_STATUS = new Set([429, 503]);

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastRes: Response | undefined;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const res = await fetch(url, init);
    if (res.ok || !RETRYABLE_STATUS.has(res.status) || attempt === attempts - 1) return res;
    lastRes = res;
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }
  return lastRes!;
}

export async function requestGeminiText(promptText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no esta configurada");

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini respondio ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new Error("Gemini no devolvio texto");
  return text;
}

export async function requestChatGPTText(promptText: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no esta configurada");

  const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: promptText }],
      response_format: { type: "json_object" },
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ChatGPT respondio ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("ChatGPT no devolvio texto");
  return text;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function* streamChatGPTText(systemPrompt: string, messages: ChatTurn[]): AsyncGenerator<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no esta configurada");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      temperature: 0.9,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`ChatGPT respondio ${res.status}: ${body.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") return;
      if (!jsonStr) continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === "string") yield delta;
      } catch {
        // partial SSE line, wait for more data
      }
    }
  }
}

export async function callGemini(artist: Artist, userPrompt: string): Promise<ParsedGeneration> {
  const text = await requestGeminiText(buildPrompt(artist, userPrompt));
  return parseGenerationJSON(text);
}

export async function callChatGPT(artist: Artist, userPrompt: string): Promise<ParsedGeneration> {
  const text = await requestChatGPTText(buildPrompt(artist, userPrompt));
  return parseGenerationJSON(text);
}
