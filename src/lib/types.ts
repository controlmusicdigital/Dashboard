export type PlatformId =
  | "googleAds"
  | "youtube"
  | "spotify"
  | "distrokid"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "x"
  | "ascap"
  | "bmi";

export type PlatformCategory = "publicidad" | "streaming" | "distribucion" | "social" | "regalias";

export interface PlatformMeta {
  id: PlatformId;
  label: string;
  category: PlatformCategory;
  brandColor: string;
}

export interface TimePoint {
  date: string; // ISO yyyy-mm-dd
  value: number;
}

export interface TopItem {
  title: string;
  metricLabel: string;
  metricValue: string;
}

export interface StatField {
  label: string;
  value: string;
  deltaPct: number; // vs. previous period, +/-
  raw?: number;
}

export interface PlatformSnapshot {
  platform: PlatformId;
  connected: boolean;
  headline: StatField;
  stats: StatField[];
  series: TimePoint[];
  seriesLabel: string;
  topItems: TopItem[];
}

export interface Artist {
  id: string;
  name: string;
  realName: string;
  genre: string;
  location: string;
  bio: string;
  initials: string;
  accent: string; // categorical slot hex for this artist, used consistently across charts
  youtubeHandle?: string; // real @handle (no @), used to target the right channel — the OAuth'd
  // Google account may manage several Brand Account channels, and the API's "mine" flag only
  // ever returns one default one, not necessarily this artist's
}

export interface ArtistData {
  artist: Artist;
  platforms: Record<PlatformId, PlatformSnapshot>;
}
