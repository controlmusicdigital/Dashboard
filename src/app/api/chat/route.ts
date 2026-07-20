import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getArtist } from "@/lib/artists";
import { buildSystemPrompt } from "@/lib/claude/persona";
import { mockReply } from "@/lib/claude/mock";
import { requireArtistAccess } from "@/lib/auth";
import { streamChatGPTText, streamGeminiText } from "@/lib/ai/providers";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function textStream(chunks: string[], delayMs: number): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, delayMs));
      }
      controller.close();
    },
  });
}

function providerStream(
  generate: () => AsyncGenerator<string>,
  providerLabel: string,
  fallback: () => string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of generate()) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`${fallback()}\n\n[Nota: no se pudo contactar a ${providerLabel}: ${reason}]`));
        controller.close();
      }
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const artistId = body?.artistId as string | undefined;
  const messages = body?.messages as ChatMessage[] | undefined;

  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist || !Array.isArray(messages) || messages.length === 0) {
    return new Response("Solicitud invalida", { status: 400 });
  }
  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const fallback = () => mockReply(artist, lastUserMessage);

  // Gemini first: it has a free tier, so it works without any billing configured.
  if (geminiKey) {
    return new Response(providerStream(() => streamGeminiText(buildSystemPrompt(artist), messages), "Gemini", fallback), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Source": "gemini" },
    });
  }

  if (anthropicKey) {
    const client = new Anthropic({ apiKey: anthropicKey });
    const systemPrompt = buildSystemPrompt(artist);
    const claudeMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    async function* streamClaude() {
      const claudeStream = client.messages.stream({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
      });
      for await (const event of claudeStream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
    }
    return new Response(providerStream(streamClaude, "Claude", fallback), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Source": "claude-opus-4-8" },
    });
  }

  if (openaiKey) {
    return new Response(providerStream(() => streamChatGPTText(buildSystemPrompt(artist), messages), "ChatGPT", fallback), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Source": "chatgpt" },
    });
  }

  const mock = fallback();
  const words = mock.split(" ").map((w, i) => (i === 0 ? w : ` ${w}`));
  return new Response(textStream(words, 45), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Source": "mock" },
  });
}
