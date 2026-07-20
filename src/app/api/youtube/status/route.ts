import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { getStoredTokens, getValidAccessToken, isYouTubeOAuthConfigured, setTokensCookie } from "@/lib/youtube-auth";
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
  if (!getStoredTokens(req, artist.id)) {
    return NextResponse.json({ configured: true, connected: false });
  }

  try {
    const token = await getValidAccessToken(req, artist.id);
    if (!token) return NextResponse.json({ configured: true, connected: false });
    const channel = await fetchChannelInfo(token.accessToken);
    const res = NextResponse.json({ configured: true, connected: true, channel });
    if (token.refreshed) setTokensCookie(res, artist.id, token.refreshed);
    return res;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ configured: true, connected: false, error: reason });
  }
}
