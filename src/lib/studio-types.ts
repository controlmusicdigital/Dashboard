export type AIProvider = "gemini" | "chatgpt";

export type SocialPlatformId = "instagram" | "tiktok" | "facebook" | "youtube" | "x";

export interface GeneratedContent {
  caption: string;
  hashtags: string[];
  variants: Record<SocialPlatformId, string>;
  source: AIProvider | "mock";
  note?: string;
}

export type PublishState = "idle" | "queued" | "publishing" | "success" | "error";
