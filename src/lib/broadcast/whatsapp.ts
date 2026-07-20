import "server-only";
import { BroadcastMedia, BroadcastResult, BroadcastVerifyResult } from "../broadcast-types";
import { dataUrlToBlob } from "./media";

export async function verifyWhatsappConnection(): Promise<BroadcastVerifyResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.WHATSAPP_TO;
  if (!token || !phoneNumberId || !to) {
    return { ok: false, detail: "Falta WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_TO." };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}?fields=verified_name,display_phone_number`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return {
      ok: true,
      detail: `Conectado: ${data.verified_name || "numero verificado"} (${data.display_phone_number || phoneNumberId}). Enviando a: ${to}.`,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: `Las credenciales no funcionaron: ${reason}` };
  }
}

async function uploadMedia(phoneNumberId: string, token: string, media: BroadcastMedia): Promise<string> {
  const blob = dataUrlToBlob(media.dataUrl, media.mimeType);
  const form = new FormData();
  form.append("file", blob, `broadcast.${media.mimeType.split("/")[1] || "bin"}`);
  form.append("type", media.mimeType);
  form.append("messaging_product", "whatsapp");

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(data?.error?.message || `HTTP ${res.status} subiendo el archivo`);
  return data.id as string;
}

export async function sendWhatsapp(text: string, media?: BroadcastMedia): Promise<BroadcastResult> {
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
    const body = media
      ? (() => {
          return uploadMedia(phoneNumberId, token, media).then((mediaId) => ({
            messaging_product: "whatsapp",
            to,
            type: media.kind,
            [media.kind]: { id: mediaId, caption: text || undefined },
          }));
        })()
      : Promise.resolve({ messaging_product: "whatsapp", to, type: "text", text: { body: text } });

    const payload = await body;
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return { platform: "whatsapp", ok: true, simulated: false, detail: "Enviado a WhatsApp." };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { platform: "whatsapp", ok: false, simulated: false, detail: `Error enviando a WhatsApp: ${reason}` };
  }
}
