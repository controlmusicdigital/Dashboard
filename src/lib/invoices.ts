import "server-only";
import { getRedis } from "./redis";
import { getStripe } from "./stripe";

function customerKey(artistId: string): string {
  return `stripe-customer:${artistId}`;
}

// Stripe customers are keyed by our artist ID (stored in Redis) so repeat invoices to the same
// artist reuse the same customer instead of creating a new one each time.
export async function getOrCreateCustomer(artistId: string, artistName: string, email: string): Promise<string> {
  const redis = getRedis();
  const existing = await redis.get<string>(customerKey(artistId));
  const stripe = getStripe();

  if (existing) {
    await stripe.customers.update(existing, { email, name: artistName });
    return existing;
  }

  const customer = await stripe.customers.create({ name: artistName, email, metadata: { artistId } });
  await redis.set(customerKey(artistId), customer.id);
  return customer.id;
}

export interface InvoiceSummary {
  id: string;
  number: string | null;
  status: string | null;
  amount: number; // in the invoice's currency's smallest unit
  currency: string;
  description: string;
  hostedInvoiceUrl: string | null;
  created: string;
  dueDate: string | null;
}

export async function listArtistInvoices(artistId: string): Promise<InvoiceSummary[]> {
  const customerId = await getRedis().get<string>(customerKey(artistId));
  if (!customerId) return [];

  const stripe = getStripe();
  const invoices = await stripe.invoices.list({ customer: customerId, limit: 20 });
  return invoices.data.map((inv) => ({
    id: inv.id!,
    number: inv.number,
    status: inv.status,
    amount: inv.total,
    currency: inv.currency,
    description: inv.lines.data[0]?.description ?? "Factura",
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    created: new Date(inv.created * 1000).toISOString(),
    dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
  }));
}
