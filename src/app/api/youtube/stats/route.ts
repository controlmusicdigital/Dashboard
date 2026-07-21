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

  // Each of these can fail independently (e.g. the stricter YouTube Analytics quota running
  // out shouldn't hide a channel/video fetch that succeeded), so settle them separately
  // instead of failing the whole response on Promise.all if just one of the three errors.
  const [channelResult, analyticsResult, videosResult] = await Promise.allSettled([
    fetchChannelInfo(token.accessToken, artist.youtubeHandle),
    fetchChannelAnalytics(token.accessToken, artist.youtubeHandle),
    fetchChannelVideos(token.accessToken, artist.youtubeHandle),
  ]);

  const reasonOf = (r: PromiseSettledResult<unknown>) =>
    r.status === "rejected" ? (r.reason instanceof Error ? r.reason.message : String(r.reason)) : undefined;

  if (channelResult.status === "rejected") {
    return NextResponse.json({ error: reasonOf(channelResult) }, { status: 502 });
  }

  const res = NextResponse.json({
    channel: channelResult.value,
    analytics: analyticsResult.status === "fulfilled" ? analyticsResult.value : null,
    analyticsError: reasonOf(analyticsResult),
    videos: videosResult.status === "fulfilled" ? videosResult.value : null,
    videosError: reasonOf(videosResult),
  });
  if (token.refreshed) setTokensCookie(res, artist.id, token.refreshed);
  return res;
}
