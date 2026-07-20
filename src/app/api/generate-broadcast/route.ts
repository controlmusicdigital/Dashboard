import { NextRequest, NextResponse } from "next/server";
import { generateBroadcastMessage } from "@/lib/ai/broadcast";
import { AIProvider } from "@/lib/studio-types";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const provider = body?.provider as AIProvider | undefined;
  const topic = body?.topic as string | undefined;

  if (provider !== "gemini" && provider !== "chatgpt") {
    return NextResponse.json({ error: "Proveedor invalido" }, { status: 400 });
  }
  if (!topic || !topic.trim()) {
    return NextResponse.json({ error: "Escribe un tema para el mensaje" }, { status: 400 });
  }

  const content = await generateBroadcastMessage(provider, topic.trim());
  return NextResponse.json(content);
}
