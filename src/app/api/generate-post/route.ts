import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/ai";
import { getArtist } from "@/lib/artists";
import { AIProvider } from "@/lib/studio-types";
import { requireArtistAccess } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const provider = body?.provider as AIProvider | undefined;
  const artistId = body?.artistId as string | undefined;
  const prompt = body?.prompt as string | undefined;

  if (provider !== "gemini" && provider !== "chatgpt") {
    return NextResponse.json({ error: "Proveedor invalido" }, { status: 400 });
  }
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) {
    return NextResponse.json({ error: "Artista invalido" }, { status: 400 });
  }
  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;
  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: "Escribe una idea para el post" }, { status: 400 });
  }

  const content = await generateContent(provider, artist, prompt.trim());
  return NextResponse.json(content);
}
