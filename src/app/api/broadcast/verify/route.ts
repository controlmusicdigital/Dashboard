import { NextRequest, NextResponse } from "next/server";
import { BroadcastPlatform } from "@/lib/broadcast-types";
import { verifyTelegramConnection } from "@/lib/broadcast/telegram";
import { verifyWhatsappConnection } from "@/lib/broadcast/whatsapp";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const platform = body?.platform as BroadcastPlatform | undefined;

  if (platform !== "telegram" && platform !== "whatsapp") {
    return NextResponse.json({ error: "Plataforma invalida" }, { status: 400 });
  }

  const result = platform === "telegram" ? await verifyTelegramConnection() : await verifyWhatsappConnection();
  return NextResponse.json(result);
}
