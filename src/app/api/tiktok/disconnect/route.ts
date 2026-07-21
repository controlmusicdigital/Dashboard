import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { deleteTokens } from "@/lib/tiktok-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const artistId = body?.artistId as string | undefined;
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  await deleteTokens(artist.id);
  return NextResponse.json({ ok: true });
}
