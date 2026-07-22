import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const artistId = body?.artistId as string | undefined;
  const invoiceId = body?.invoiceId as string | undefined;
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist || !invoiceId) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Los pagos con tarjeta todavia no estan configurados" }, { status: 503 });
  }

  try {
    await getStripe().invoices.voidInvoice(invoiceId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: reason }, { status: 502 });
  }
}
