export type BroadcastPlatform = "telegram" | "whatsapp";

export interface BroadcastResult {
  platform: BroadcastPlatform;
  ok: boolean;
  simulated: boolean;
  detail: string;
}
