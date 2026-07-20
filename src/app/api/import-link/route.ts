import { NextRequest, NextResponse } from "next/server";
import { importFromLink } from "@/lib/claude/link-import";
import { getArtist } from "@/lib/artists";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const artistId = body?.artistId as string | undefined;
  const url = body?.url as string | undefined;

  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) {
    return NextResponse.json({ error: "Artista invalido" }, { status: 400 });
  }
  if (!url || !url.trim()) {
    return NextResponse.json({ error: "Pega un enlace para analizar" }, { status: 400 });
  }
  try {
    new URL(url.trim());
  } catch {
    return NextResponse.json({ error: "El enlace no es una URL valida" }, { status: 400 });
  }

  const content = await importFromLink(artist, url.trim());
  return NextResponse.json(content);
}
