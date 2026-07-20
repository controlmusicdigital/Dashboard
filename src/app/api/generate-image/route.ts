import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { requestGeminiImage } from "@/lib/ai/providers";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const artistId = body?.artistId as string | undefined;
  const prompt = body?.prompt as string | undefined;

  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) {
    return NextResponse.json({ error: "Artista invalido" }, { status: 400 });
  }
  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;
  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: "Escribe que imagen quieres generar" }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY no esta configurada" }, { status: 400 });
  }

  try {
    const image = await requestGeminiImage(prompt.trim());
    return NextResponse.json({ dataUrl: `data:${image.mimeType};base64,${image.base64}`, source: "gemini" });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `No se pudo generar la imagen (${reason})` }, { status: 502 });
  }
}
