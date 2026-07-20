import { NextRequest, NextResponse } from "next/server";
import { getSession, isAuthConfigured } from "@/lib/auth";
import { getArtist } from "@/lib/artists";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ session: null, authConfigured: false });
  }
  const session = getSession(req);
  if (!session) return NextResponse.json({ session: null, authConfigured: true });
  if (session.role === "artist") {
    const artist = getArtist(session.artistId);
    return NextResponse.json({
      session: { role: "artist", artistId: session.artistId, artistName: artist?.name },
      authConfigured: true,
    });
  }
  return NextResponse.json({ session: { role: "admin" }, authConfigured: true });
}
