import { PlatformId, PlatformMeta } from "./types";

export const PLATFORM_META: Record<PlatformId, PlatformMeta> = {
  googleAds: { id: "googleAds", label: "Google Ads", category: "publicidad", brandColor: "#4285F4" },
  youtube: { id: "youtube", label: "YouTube", category: "streaming", brandColor: "#FF0000" },
  spotify: { id: "spotify", label: "Spotify", category: "streaming", brandColor: "#1DB954" },
  distrokid: { id: "distrokid", label: "DistroKid", category: "distribucion", brandColor: "#F45D48" },
  instagram: { id: "instagram", label: "Instagram", category: "social", brandColor: "#E1306C" },
  tiktok: { id: "tiktok", label: "TikTok", category: "social", brandColor: "#25F4EE" },
  facebook: { id: "facebook", label: "Facebook", category: "social", brandColor: "#1877F2" },
  x: { id: "x", label: "X", category: "social", brandColor: "#71767B" },
  ascap: { id: "ascap", label: "ASCAP", category: "regalias", brandColor: "#003DA5" },
  bmi: { id: "bmi", label: "BMI", category: "regalias", brandColor: "#DA291C" },
};

export const PLATFORM_ORDER: PlatformId[] = [
  "spotify",
  "youtube",
  "instagram",
  "tiktok",
  "facebook",
  "x",
  "googleAds",
  "distrokid",
  "ascap",
  "bmi",
];

function IconWrap({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${color}1f`, color }}
      aria-hidden
    >
      {children}
    </span>
  );
}

export function PlatformIcon({ platform, className }: { platform: PlatformId; className?: string }) {
  const color = PLATFORM_META[platform].brandColor;
  const svgProps = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className,
  };

  switch (platform) {
    case "googleAds":
      return (
        <IconWrap color={color}>
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="1.4" />
          </svg>
        </IconWrap>
      );
    case "youtube":
      return (
        <IconWrap color={color}>
          <svg {...svgProps}>
            <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M10.2 9.3v5.4l4.8-2.7z" />
          </svg>
        </IconWrap>
      );
    case "spotify":
      return (
        <IconWrap color={color}>
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7 10.2c3.2-.9 7-.6 9.6.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M7.2 13.2c2.7-.7 5.9-.5 8.1.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M7.4 16c2.2-.5 4.8-.4 6.6.6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </IconWrap>
      );
    case "distrokid":
      return (
        <IconWrap color={color}>
          <svg {...svgProps}>
            <path d="M12 3.5l7 4v9l-7 4-7-4v-9z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M12 12l7-4.5M12 12v8.2M12 12L5 7.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </IconWrap>
      );
    case "instagram":
      return (
        <IconWrap color={color}>
          <svg {...svgProps}>
            <rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="17.1" cy="6.9" r="1.1" />
          </svg>
        </IconWrap>
      );
    case "tiktok":
      return (
        <IconWrap color={color}>
          <svg {...svgProps}>
            <path
              d="M14 3.5c.5 2 2 3.4 4 3.7v2.6c-1.5 0-2.9-.4-4-1.2v5.7a5.2 5.2 0 1 1-4.6-5.2v2.7a2.5 2.5 0 1 0 2 2.4V3.5z"
              fill="currentColor"
            />
          </svg>
        </IconWrap>
      );
    case "facebook":
      return (
        <IconWrap color={color}>
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M13.6 20V13h2.1l.3-2.6h-2.4V8.8c0-.75.2-1.26 1.28-1.26h1.37V5.2c-.24-.03-1.05-.1-2-.1-1.98 0-3.33 1.2-3.33 3.42v1.88H8.8V13h2.17v7z" />
          </svg>
        </IconWrap>
      );
    case "x":
      return (
        <IconWrap color={color}>
          <svg {...svgProps}>
            <path d="M4 4l16 16M20 4L4 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </IconWrap>
      );
    case "ascap":
    case "bmi":
      return (
        <IconWrap color={color}>
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8.5 15V9.5a3.5 3.5 0 1 1 3.5 3.5H8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconWrap>
      );
  }
}
