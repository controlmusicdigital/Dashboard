export type PlatformId =
  | "googleAds"
  | "youtube"
  | "spotify"
  | "distrokid"
  | "instagram"
  | "tiktok"
  | "facebook";

export type PlatformCategory = "publicidad" | "streaming" | "distribucion" | "social";

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
}

export interface ArtistData {
  artist: Artist;
  platforms: Record<PlatformId, PlatformSnapshot>;
}
