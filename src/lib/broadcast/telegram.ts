import "server-only";
import { BroadcastResult } from "../broadcast-types";

export async function sendTelegram(text: string): Promise<BroadcastResult> {
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
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data?.description || `HTTP ${res.status}`);
    return { platform: "telegram", ok: true, simulated: false, detail: "Enviado a Telegram." };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { platform: "telegram", ok: false, simulated: false, detail: `Error enviando a Telegram: ${reason}` };
  }
}
