import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/instagram-auth";
import { fetchMedia, fetchProfile } from "@/lib/instagram-api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  const accessToken = await getValidAccessToken(artist.id);
  if (!accessToken) return NextResponse.json({ error: "Cuenta de Instagram no conectada" }, { status: 404 });

  // The profile fetch tells us the userId needed for the media fetch, so it can't be settled in
  // parallel with it — but a media failure shouldn't hide a profile that loaded fine.
  let profile;
  try {
    profile = await fetchProfile(accessToken);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: reason }, { status: 502 });
  }

  try {
    const media = await fetchMedia(accessToken, profile.id);
    return NextResponse.json({ profile, media });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ profile, media: null, mediaError: reason });
  }
}
