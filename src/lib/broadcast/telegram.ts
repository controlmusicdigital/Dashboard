import "server-only";
import { BroadcastMedia, BroadcastResult, BroadcastVerifyResult } from "../broadcast-types";
import { dataUrlToBlob } from "./media";

export async function verifyTelegramConnection(): Promise<BroadcastVerifyResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { ok: false, detail: "Falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID." };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data?.description || `HTTP ${res.status}`);
    return { ok: true, detail: `Conectado como @${data.result.username}. Chat ID configurado: ${chatId}.` };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: `El token no funciono: ${reason}` };
  }
}

export async function sendTelegram(text: string, media?: BroadcastMedia): Promise<BroadcastResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      platform: "telegram",
      ok: true,
      simulated: true,
      detail: "Simulado — falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en .env.local.",
    };
  }

  try {
    let res: Response;
    if (media) {
      const blob = dataUrlToBlob(media.dataUrl, media.mimeType);
      const form = new FormData();
      form.append("chat_id", chatId);
      if (text) form.append("caption", text);
      form.append(media.kind === "image" ? "photo" : "video", blob, `broadcast.${media.mimeType.split("/")[1] || "bin"}`);
      res = await fetch(`https://api.telegram.org/bot${token}/${media.kind === "image" ? "sendPhoto" : "sendVideo"}`, {
        method: "POST",
        body: form,
      });
    } else {
      res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data?.description || `HTTP ${res.status}`);
    return { platform: "telegram", ok: true, simulated: false, detail: "Enviado a Telegram." };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { platform: "telegram", ok: false, simulated: false, detail: `Error enviando a Telegram: ${reason}` };
  }
}
