"use client";

import { useState } from "react";
import { ArtistData } from "@/lib/types";
import { PlatformIcon } from "@/lib/platforms";
import { YouTubeStudio } from "./YouTubeStudio";
import { InstagramStudio } from "./InstagramStudio";
import { TikTokStudio } from "./TikTokStudio";

// Every per-platform studio (real OAuth connection + content grid) lives here as an inner tab.
// Add new ones (Facebook...) to this list as they get built, instead of growing the artist's
// top-level tab bar with one entry per platform.
const STUDIOS = [
  { id: "youtube", label: "YouTube", Component: YouTubeStudio },
  { id: "instagram", label: "Instagram", Component: InstagramStudio },
  { id: "tiktok", label: "TikTok", Component: TikTokStudio },
] as const;

type StudioId = (typeof STUDIOS)[number]["id"];

export function SocialMediaStudio({ data }: { data: ArtistData }) {
  const [active, setActive] = useState<StudioId>("youtube");
  const current = STUDIOS.find((s) => s.id === active)!;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2 rounded-full p-1" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", width: "fit-content" }}>
        {STUDIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className="flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3.5 text-xs font-semibold transition-colors"
            style={
              active === s.id
                ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
                : { color: "var(--text-secondary)" }
            }
          >
            <PlatformIcon platform={s.id} />
            {s.label}
          </button>
        ))}
      </div>

      <current.Component data={data} />
    </div>
  );
}
