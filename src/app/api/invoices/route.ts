import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { requireArtistAccess } from "@/lib/auth";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { getOrCreateCustomer, listArtistInvoices } from "@/lib/invoices";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  if (!isStripeConfigured()) return NextResponse.json({ configured: false, invoices: [] });

  try {
    const invoices = await listArtistInvoices(artist.id);
    return NextResponse.json({ configured: true, invoices });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ configured: true, invoices: [], error: reason }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const artistId = body?.artistId as string | undefined;
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) return NextResponse.json({ error: "Artista invalido" }, { status: 400 });

  const denied = requireArtistAccess(req, artist.id);
  if (denied) return denied;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Los pagos con tarjeta todavia no estan configurados" }, { status: 503 });
  }

  const email = (body?.email as string | undefined)?.trim();
  const description = (body?.description as string | undefined)?.trim();
  const amountInput = Number(body?.amount);
  const currency = ((body?.currency as string | undefined) || "usd").toLowerCase();
  const daysUntilDue = Number(body?.daysUntilDue) || 7;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Escribe un correo valido para el artista" }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "Escribe una descripcion para la factura" }, { status: 400 });
  }
  if (!amountInput || amountInput <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor que cero" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const customerId = await getOrCreateCustomer(artist.id, artist.name, email);

    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: daysUntilDue,
    });

    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: Math.round(amountInput * 100),
      currency,
      description,
    });

    const sent = await stripe.invoices.sendInvoice(invoice.id!);

    return NextResponse.json({
      invoice: {
        id: sent.id,
        hostedInvoiceUrl: sent.hosted_invoice_url ?? null,
        status: sent.status,
      },
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: reason }, { status: 502 });
  }
}
