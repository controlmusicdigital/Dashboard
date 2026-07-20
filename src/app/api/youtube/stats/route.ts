import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/youtube-auth";
import { fetchChannelAnalytics, fetchChannelInfo } from "@/lib/youtube-api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  const accessToken = await getValidAccessToken(artist.id);
  if (!accessToken) return NextResponse.json({ error: "Cuenta de YouTube no conectada" }, { status: 404 });

  try {
    const [channel, analytics] = await Promise.all([fetchChannelInfo(accessToken), fetchChannelAnalytics(accessToken)]);
    return NextResponse.json({ channel, analytics });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: reason }, { status: 502 });
  }
}
