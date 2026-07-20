import { NextResponse } from "next/server";
import { getAdminPassword, getArtistPassword, isAuthConfigured } from "@/lib/auth";
import { artists } from "@/lib/artists";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    authConfigured: isAuthConfigured(),
    adminConfigured: Boolean(getAdminPassword()),
    artists: artists.map((a) => ({ id: a.id, name: a.name, configured: Boolean(getArtistPassword(a.id)) })),
  });
}
