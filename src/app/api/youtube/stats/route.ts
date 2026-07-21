import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { getValidAccessToken, setTokensCookie } from "@/lib/youtube-auth";
import { fetchChannelAnalytics, fetchChannelInfo, fetchChannelVideos } from "@/lib/youtube-api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  const token = await getValidAccessToken(req, artist.id);
  if (!token) return NextResponse.json({ error: "Cuenta de YouTube no conectada" }, { status: 404 });

  try {
    const [channel, analytics, videos] = await Promise.all([
      fetchChannelInfo(token.accessToken, artist.youtubeHandle),
      fetchChannelAnalytics(token.accessToken, artist.youtubeHandle),
      fetchChannelVideos(token.accessToken, artist.youtubeHandle),
    ]);
    const res = NextResponse.json({ channel, analytics, videos });
    if (token.refreshed) setTokensCookie(res, artist.id, token.refreshed);
    return res;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: reason }, { status: 502 });
  }
}
