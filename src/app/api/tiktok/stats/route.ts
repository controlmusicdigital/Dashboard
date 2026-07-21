import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/tiktok-auth";
import { fetchProfile, fetchVideos } from "@/lib/tiktok-api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  const accessToken = await getValidAccessToken(artist.id);
  if (!accessToken) return NextResponse.json({ error: "Cuenta de TikTok no conectada" }, { status: 404 });

  let profile;
  try {
    profile = await fetchProfile(accessToken);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: reason }, { status: 502 });
  }

  try {
    const videos = await fetchVideos(accessToken);
    return NextResponse.json({ profile, videos });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ profile, videos: null, videosError: reason });
  }
}
