import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { buildAuthUrl, createOAuthState, isTikTokOAuthConfigured } from "@/lib/tiktok-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  if (!isTikTokOAuthConfigured()) {
    return NextResponse.json({ error: "La conexion con TikTok no esta configurada todavia" }, { status: 503 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/tiktok/auth/callback`;
  const state = createOAuthState(artist.id);
  return NextResponse.redirect(buildAuthUrl(redirectUri, state));
}
