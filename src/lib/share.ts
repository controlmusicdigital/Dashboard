import { PlatformId } from "./types";

export type SharePlatform = Extract<PlatformId, "x" | "facebook" | "instagram" | "tiktok">;

export const SHARE_PLATFORMS: SharePlatform[] = ["x", "facebook", "instagram", "tiktok"];

interface ShareTarget {
  kind: "link";
  url: string;
}

interface CopyTarget {
  kind: "copy";
  text: string;
}

export function buildShare(platform: SharePlatform, title: string, url: string): ShareTarget | CopyTarget {
  switch (platform) {
    case "x":
      return { kind: "link", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` };
    case "facebook":
      return { kind: "link", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` };
    case "instagram":
    case "tiktok":
      // Neither platform exposes a web share-intent URL — copy the text so it can be pasted into their app.
      return { kind: "copy", text: `${title}\n${url}` };
  }
}
