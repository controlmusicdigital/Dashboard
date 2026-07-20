import "server-only";

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

export interface YouTubeAnalyticsDay {
  date: string;
  views: number;
  minutesWatched: number;
  subscribersGained: number;
}

async function googleGet(url: string, accessToken: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google respondio ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

export async function fetchChannelInfo(accessToken: string): Promise<YouTubeChannelInfo> {
  const data = await googleGet(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    accessToken
  );
  const channel = data.items?.[0];
  if (!channel) throw new Error("No se encontro un canal de YouTube para esta cuenta");
  return {
    id: channel.id,
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url ?? "",
    subscriberCount: Number(channel.statistics.subscriberCount ?? 0),
    viewCount: Number(channel.statistics.viewCount ?? 0),
    videoCount: Number(channel.statistics.videoCount ?? 0),
  };
}

export interface YouTubeRealVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  comments: number;
  durationSec: number;
  publishedAt: string;
  status: "publico" | "no listado" | "borrador";
}

function parseIsoDuration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

function mapPrivacyStatus(status: string): YouTubeRealVideo["status"] {
  if (status === "unlisted") return "no listado";
  if (status === "private") return "borrador";
  return "publico";
}

export async function fetchChannelVideos(accessToken: string, maxResults = 12): Promise<YouTubeRealVideo[]> {
  const channelData = await googleGet(
    "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
    accessToken
  );
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  const playlistData = await googleGet(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`,
    accessToken
  );
  const videoIds: string[] = (playlistData.items ?? [])
    .map((item: { contentDetails?: { videoId?: string } }) => item.contentDetails?.videoId)
    .filter((id: string | undefined): id is string => Boolean(id));
  if (videoIds.length === 0) return [];

  const videosData = await googleGet(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=${videoIds.join(",")}`,
    accessToken
  );

  return (videosData.items ?? []).map(
    (v: {
      id: string;
      snippet: { title: string; thumbnails?: { medium?: { url: string }; default?: { url: string } }; publishedAt: string };
      statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
      status: { privacyStatus: string };
    }) => ({
      id: v.id,
      title: v.snippet.title,
      thumbnailUrl: v.snippet.thumbnails?.medium?.url ?? v.snippet.thumbnails?.default?.url ?? "",
      views: Number(v.statistics?.viewCount ?? 0),
      likes: Number(v.statistics?.likeCount ?? 0),
      comments: Number(v.statistics?.commentCount ?? 0),
      durationSec: parseIsoDuration(v.contentDetails.duration),
      publishedAt: v.snippet.publishedAt.slice(0, 10),
      status: mapPrivacyStatus(v.status.privacyStatus),
    })
  );
}

export async function fetchChannelAnalytics(accessToken: string, days = 28): Promise<YouTubeAnalyticsDay[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate: fmt(start),
    endDate: fmt(end),
    metrics: "views,estimatedMinutesWatched,subscribersGained",
    dimensions: "day",
    sort: "day",
  });
  const data = await googleGet(`https://youtubeanalytics.googleapis.com/v2/reports?${params.toString()}`, accessToken);
  const rows: [string, number, number, number][] = data.rows ?? [];
  return rows.map(([date, views, minutesWatched, subscribersGained]) => ({
    date,
    views,
    minutesWatched,
    subscribersGained,
  }));
}
