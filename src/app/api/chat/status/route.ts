import { NextResponse } from "next/server";

export async function GET() {
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const claude = Boolean(process.env.ANTHROPIC_API_KEY);
  const chatgpt = Boolean(process.env.OPENAI_API_KEY);
  return NextResponse.json({ gemini, claude, chatgpt, connected: gemini || claude || chatgpt });
}
