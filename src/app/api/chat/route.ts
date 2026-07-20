import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getArtist } from "@/lib/artists";
import { buildSystemPrompt } from "@/lib/claude/persona";
import { mockReply } from "@/lib/claude/mock";

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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const artistId = body?.artistId as string | undefined;
  const messages = body?.messages as ChatMessage[] | undefined;

  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist || !Array.isArray(messages) || messages.length === 0) {
    return new Response("Solicitud invalida", { status: 400 });
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const mock = mockReply(artist, lastUserMessage);
    const words = mock.split(" ").map((w, i) => (i === 0 ? w : ` ${w}`));
    return new Response(textStream(words, 45), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Source": "mock" },
    });
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 1024,
          system: buildSystemPrompt(artist),
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
        claudeStream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        await claudeStream.finalMessage();
        controller.close();
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        const mock = mockReply(artist, lastUserMessage);
        controller.enqueue(encoder.encode(`${mock}\n\n[Nota: no se pudo contactar a Claude: ${reason}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Source": "claude-opus-4-8" },
  });
}
