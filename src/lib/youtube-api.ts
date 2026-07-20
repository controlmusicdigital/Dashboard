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
