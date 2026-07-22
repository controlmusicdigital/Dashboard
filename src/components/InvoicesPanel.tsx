"use client";

import { useEffect, useState } from "react";
import { Artist } from "@/lib/types";
import { logActivity } from "@/lib/team";
import { STATIC_DEMO } from "@/lib/static-demo";

interface InvoiceSummary {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  description: string;
  hostedInvoiceUrl: string | null;
  created: string;
  dueDate: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  open: "Pendiente de pago",
  paid: "Pagada",
  void: "Anulada",
  uncollectible: "Incobrable",
};

function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: currency.toUpperCase() }).format(amountCents / 100);
}

export function InvoicesPanel({ artist }: { artist: Artist }) {
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [daysUntilDue, setDaysUntilDue] = useState("7");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function refresh() {
    if (STATIC_DEMO) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/invoices?artistId=${encodeURIComponent(artist.id)}`);
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setInvoices(data.invoices ?? []);
      setError(data.error ?? null);
    } catch {
      setConfigured(false);
      setError("No se pudieron cargar las facturas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, deliberately shows a loading state immediately
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist.id]);

  async function handleSend() {
    setNotice(null);
    setSending(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: artist.id, email, description, amount, currency, daysUntilDue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar la factura");
      setNotice({ kind: "success", text: "Factura enviada." });
      logActivity("envio una factura", artist.id, artist.name, `${description.slice(0, 40)} — ${amount} ${currency.toUpperCase()}`);
      setDescription("");
      setAmount("");
      await refresh();
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "No se pudo enviar la factura" });
    } finally {
      setSending(false);
    }
  }

  async function handleVoid(invoiceId: string) {
    await fetch("/api/invoices/void", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId: artist.id, invoiceId }),
    });
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Facturas
        </h2>
        <p className="mt-1 max-w-2xl text-xs" style={{ color: "var(--text-muted)" }}>
          Envia una factura real a {artist.name} por correo — puede pagar con tarjeta de debito o credito
          internacional desde una pagina segura de Stripe, y el dinero llega directo a tu cuenta bancaria conectada
          en Stripe (los pagos y el deposito los procesa Stripe, no este servidor).
        </p>
      </div>

      {STATIC_DEMO ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 text-center"
          style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--surface-1)", color: "var(--text-muted)" }}
        >
          <span className="text-2xl">🔒</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Facturas no esta disponible en esta demo estatica
          </span>
        </div>
      ) : !loading && !configured ? (
        <p className="text-xs" style={{ color: "var(--status-warning)" }}>
          Esta seccion todavia no esta configurada — hace falta una cuenta de Stripe (STRIPE_SECRET_KEY) en el
          servidor.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Nueva factura
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`Correo de ${artist.name}`}
                type="email"
                className="rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripcion (ej. Adelanto de gira)"
                className="rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
              />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto (ej. 150.00)"
                type="number"
                min="0"
                step="0.01"
                className="rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
              >
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="dop">DOP</option>
              </select>
              <input
                value={daysUntilDue}
                onChange={(e) => setDaysUntilDue(e.target.value)}
                placeholder="Dias para pagar"
                type="number"
                min="1"
                className="rounded-xl px-3 py-2 text-sm outline-none sm:col-span-2"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
              />
            </div>
            {notice && (
              <p className="text-xs" style={{ color: notice.kind === "success" ? "var(--status-good)" : "var(--status-critical)" }}>
                {notice.text}
              </p>
            )}
            <button
              onClick={handleSend}
              disabled={sending || !email.trim() || !description.trim() || !amount}
              className="self-start rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
            >
              {sending ? "Enviando..." : "Enviar factura"}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="rounded-2xl px-4 py-8 text-center text-sm" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-muted)" }}>
                Cargando...
              </div>
            ) : error ? (
              <p className="text-xs" style={{ color: "var(--status-critical)" }}>
                {error}
              </p>
            ) : invoices.length === 0 ? (
              <div className="rounded-2xl px-4 py-8 text-center text-sm" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-muted)" }}>
                Todavia no se ha enviado ninguna factura.
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
                  style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {inv.description} · {formatMoney(inv.amount, inv.currency)}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {inv.number ?? inv.id} · {new Date(inv.created).toLocaleDateString("es-DO")}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        color: inv.status === "paid" ? "var(--status-good)" : inv.status === "void" ? "var(--text-muted)" : "var(--status-warning)",
                        border: `1px solid ${inv.status === "paid" ? "var(--status-good)" : inv.status === "void" ? "var(--border-hairline)" : "var(--status-warning)"}`,
                      }}
                    >
                      {STATUS_LABEL[inv.status ?? ""] ?? inv.status}
                    </span>
                    {inv.hostedInvoiceUrl && (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
                      >
                        Ver factura
                      </a>
                    )}
                    {inv.status === "open" && (
                      <button
                        onClick={() => handleVoid(inv.id)}
                        className="rounded-full px-3 py-1.5 text-xs font-medium"
                        style={{ border: "1px solid var(--status-critical)", color: "var(--status-critical)" }}
                      >
                        Anular
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
