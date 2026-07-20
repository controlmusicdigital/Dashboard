import { NextResponse } from "next/server";

export async function GET() {
  const claude = Boolean(process.env.ANTHROPIC_API_KEY);
  const chatgpt = Boolean(process.env.OPENAI_API_KEY);
  return NextResponse.json({ claude, chatgpt, connected: claude || chatgpt });
}
