import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { getStoredTokens, getValidAccessToken, isInstagramOAuthConfigured } from "@/lib/instagram-auth";
import { fetchProfile } from "@/lib/instagram-api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  if (!isInstagramOAuthConfigured()) {
    return NextResponse.json({ configured: false, connected: false });
  }
  if (!(await getStoredTokens(artist.id))) {
    return NextResponse.json({ configured: true, connected: false });
  }

  try {
    const accessToken = await getValidAccessToken(artist.id);
    if (!accessToken) return NextResponse.json({ configured: true, connected: false });
    const profile = await fetchProfile(accessToken);
    return NextResponse.json({ configured: true, connected: true, profile });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ configured: true, connected: false, error: reason });
  }
}
