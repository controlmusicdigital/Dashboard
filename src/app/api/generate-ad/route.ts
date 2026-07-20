import { NextRequest, NextResponse } from "next/server";
import { generateAdContent } from "@/lib/ai/ads";
import { getArtist } from "@/lib/artists";
import { AIProvider } from "@/lib/studio-types";
import { CampaignObjective } from "@/lib/campaign-types";
import { requireArtistAccess } from "@/lib/auth";

const OBJECTIVES: CampaignObjective[] = ["reconocimiento", "trafico", "conversiones", "streams"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const provider = body?.provider as AIProvider | undefined;
  const artistId = body?.artistId as string | undefined;
  const objective = body?.objective as CampaignObjective | undefined;
  const audience = (body?.audience as string | undefined) ?? "";
  const topic = body?.topic as string | undefined;

  if (provider !== "gemini" && provider !== "chatgpt") {
    return NextResponse.json({ error: "Proveedor invalido" }, { status: 400 });
  }
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) {
    return NextResponse.json({ error: "Artista invalido" }, { status: 400 });
  }
  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;
  if (!objective || !OBJECTIVES.includes(objective)) {
    return NextResponse.json({ error: "Objetivo invalido" }, { status: 400 });
  }
  if (!topic || !topic.trim()) {
    return NextResponse.json({ error: "Escribe el tema o gancho de la campana" }, { status: 400 });
  }

  const content = await generateAdContent(provider, { artist, objective, audience, topic: topic.trim() });
  return NextResponse.json(content);
}
