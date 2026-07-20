import "server-only";
import { BroadcastResult } from "../broadcast-types";

export async function sendWhatsapp(text: string): Promise<BroadcastResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.WHATSAPP_TO;

  if (!token || !phoneNumberId || !to) {
    return {
      platform: "whatsapp",
      ok: true,
      simulated: true,
      detail: "Simulado — falta WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_TO en .env.local.",
    };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return { platform: "whatsapp", ok: true, simulated: false, detail: "Enviado a WhatsApp." };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { platform: "whatsapp", ok: false, simulated: false, detail: `Error enviando a WhatsApp: ${reason}` };
  }
}
