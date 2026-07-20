export type BroadcastPlatform = "telegram" | "whatsapp";

export interface BroadcastMedia {
  dataUrl: string;
  mimeType: string;
  kind: "image" | "video";
}

export interface BroadcastResult {
  platform: BroadcastPlatform;
  ok: boolean;
  simulated: boolean;
  detail: string;
}
