export type CampaignPlatformId = "googleAds" | "instagram" | "tiktok" | "facebook" | "youtube";

export type CampaignObjective = "reconocimiento" | "trafico" | "conversiones" | "streams";

export type CampaignStatus = "borrador" | "activa" | "pausada" | "finalizada";

export interface AdContent {
  headline: string;
  description: string;
  cta: string;
  variants: Record<CampaignPlatformId, string>;
  source: "gemini" | "chatgpt" | "mock";
  note?: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  platforms: CampaignPlatformId[];
  budgetUSD: number;
  startDate: string;
  endDate: string;
  audience: string;
  content: AdContent;
  status: CampaignStatus;
  createdAt: string;
}

export const OBJECTIVE_LABEL: Record<CampaignObjective, string> = {
  reconocimiento: "Reconocimiento de marca",
  trafico: "Trafico",
  conversiones: "Conversiones / ventas",
  streams: "Streams y guardados",
};
