import "server-only";
import { BroadcastMedia, BroadcastPlatform, BroadcastResult } from "../broadcast-types";
import { sendTelegram } from "./telegram";
import { sendWhatsapp } from "./whatsapp";

export function broadcastStatus() {
  return {
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TO),
  };
}

export async function broadcast(
  text: string,
  platforms: BroadcastPlatform[],
  media?: BroadcastMedia
): Promise<BroadcastResult[]> {
  return Promise.all(platforms.map((p) => (p === "telegram" ? sendTelegram(text, media) : sendWhatsapp(text, media))));
}
