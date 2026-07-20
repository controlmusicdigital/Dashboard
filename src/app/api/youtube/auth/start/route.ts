import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { buildAuthUrl, createOAuthState, isYouTubeOAuthConfigured } from "@/lib/youtube-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  if (!isYouTubeOAuthConfigured()) {
    return NextResponse.json({ error: "La conexion con YouTube no esta configurada todavia" }, { status: 503 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/youtube/auth/callback`;
  const state = createOAuthState(artist.id);
  return NextResponse.redirect(buildAuthUrl(redirectUri, state));
}
