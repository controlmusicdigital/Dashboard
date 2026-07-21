import "server-only";

export interface InstagramProfile {
  id: string;
  username: string;
  name: string;
  profilePictureUrl: string;
  followersCount: number;
  mediaCount: number;
  accountType: string;
}

async function instagramGet(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Instagram respondio ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

export async function fetchProfile(accessToken: string): Promise<InstagramProfile> {
  const fields = "id,username,name,profile_picture_url,followers_count,media_count,account_type";
  const data = await instagramGet(`https://graph.instagram.com/me?fields=${fields}&access_token=${accessToken}`);
  return {
    id: data.id,
    username: data.username,
    name: data.name ?? data.username,
    profilePictureUrl: data.profile_picture_url ?? "",
    followersCount: Number(data.followers_count ?? 0),
    mediaCount: Number(data.media_count ?? 0),
    accountType: data.account_type ?? "",
  };
}

export interface InstagramMediaItem {
  id: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
}

export async function fetchMedia(accessToken: string, userId: string, maxResults = 12): Promise<InstagramMediaItem[]> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  const data = await instagramGet(
    `https://graph.instagram.com/${userId}/media?fields=${fields}&limit=${maxResults}&access_token=${accessToken}`
  );
  return (data.data ?? []).map(
    (m: {
      id: string;
      caption?: string;
      media_type: InstagramMediaItem["mediaType"];
      media_url?: string;
      thumbnail_url?: string;
      permalink: string;
      timestamp: string;
      like_count?: number;
      comments_count?: number;
    }) => ({
      id: m.id,
      caption: m.caption ?? "",
      mediaType: m.media_type,
      mediaUrl: m.media_url ?? "",
      // Video posts don't return media_url as a still image — thumbnail_url covers that case.
      thumbnailUrl: m.thumbnail_url ?? (m.media_type !== "VIDEO" ? m.media_url ?? "" : ""),
      permalink: m.permalink,
      timestamp: m.timestamp.slice(0, 10),
      likeCount: Number(m.like_count ?? 0),
      commentsCount: Number(m.comments_count ?? 0),
    })
  );
}
