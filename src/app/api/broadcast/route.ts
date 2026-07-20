import { NextRequest, NextResponse } from "next/server";
import { broadcast } from "@/lib/broadcast";
import { BroadcastMedia, BroadcastPlatform } from "@/lib/broadcast-types";

const VALID_PLATFORMS: BroadcastPlatform[] = ["telegram", "whatsapp"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = body?.message as string | undefined;
  const platforms = (body?.platforms as string[] | undefined)?.filter((p): p is BroadcastPlatform =>
    VALID_PLATFORMS.includes(p as BroadcastPlatform)
  );
  const media = body?.media as BroadcastMedia | undefined;

  if (!message?.trim() && !media) {
    return NextResponse.json({ error: "Escribe un mensaje o adjunta una imagen/video para difundir" }, { status: 400 });
  }
  if (!platforms || platforms.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos una plataforma" }, { status: 400 });
  }

  const results = await broadcast(message?.trim() || "", platforms, media);
  return NextResponse.json({ results });
}
