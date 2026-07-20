import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { getStoredTokens, getValidAccessToken, isYouTubeOAuthConfigured } from "@/lib/youtube-auth";
import { fetchChannelInfo } from "@/lib/youtube-api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  if (!isYouTubeOAuthConfigured()) {
    return NextResponse.json({ configured: false, connected: false });
  }
  if (!getStoredTokens(artist.id)) {
    return NextResponse.json({ configured: true, connected: false });
  }

  try {
    const accessToken = await getValidAccessToken(artist.id);
    if (!accessToken) return NextResponse.json({ configured: true, connected: false });
    const channel = await fetchChannelInfo(accessToken);
    return NextResponse.json({ configured: true, connected: true, channel });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ configured: true, connected: false, error: reason });
  }
}
