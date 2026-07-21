import "server-only";

export interface TikTokProfile {
  openId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  followerCount: number;
  likesCount: number;
  videoCount: number;
}

interface TikTokApiError {
  code: string;
  message: string;
}

async function tiktokGet<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await res.json();
  const error: TikTokApiError | undefined = body.error;
  if (!res.ok || (error && error.code !== "ok")) {
    throw new Error(`TikTok respondio ${res.status}: ${error?.message || "error desconocido"}`);
  }
  return body.data as T;
}

async function tiktokPost<T>(url: string, accessToken: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const error: TikTokApiError | undefined = json.error;
  if (!res.ok || (error && error.code !== "ok")) {
    throw new Error(`TikTok respondio ${res.status}: ${error?.message || "error desconocido"}`);
  }
  return json.data as T;
}

export async function fetchProfile(accessToken: string): Promise<TikTokProfile> {
  const fields = "open_id,username,display_name,avatar_url,follower_count,likes_count,video_count";
  const data = await tiktokGet<{
    user: {
      open_id: string;
      username?: string;
      display_name: string;
      avatar_url: string;
      follower_count: number;
      likes_count: number;
      video_count: number;
    };
  }>(`https://open.tiktokapis.com/v2/user/info/?fields=${fields}`, accessToken);
  const u = data.user;
  return {
    openId: u.open_id,
    username: u.username ?? u.display_name,
    displayName: u.display_name,
    avatarUrl: u.avatar_url ?? "",
    followerCount: Number(u.follower_count ?? 0),
    likesCount: Number(u.likes_count ?? 0),
    videoCount: Number(u.video_count ?? 0),
  };
}

export interface TikTokVideo {
  id: string;
  title: string;
  coverImageUrl: string;
  shareUrl: string;
  durationSec: number;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export async function fetchVideos(accessToken: string, maxResults = 12): Promise<TikTokVideo[]> {
  const fields = "id,title,video_description,cover_image_url,share_url,duration,create_time,view_count,like_count,comment_count,share_count";
  const data = await tiktokPost<{
    videos: {
      id: string;
      title?: string;
      video_description?: string;
      cover_image_url: string;
      share_url: string;
      duration: number;
      create_time: number;
      view_count: number;
      like_count: number;
      comment_count: number;
      share_count: number;
    }[];
  }>(`https://open.tiktokapis.com/v2/video/list/?fields=${fields}`, accessToken, { max_count: maxResults });

  return (data.videos ?? []).map((v) => ({
    id: v.id,
    title: v.title || v.video_description || "",
    coverImageUrl: v.cover_image_url ?? "",
    shareUrl: v.share_url,
    durationSec: v.duration,
    publishedAt: new Date(v.create_time * 1000).toISOString().slice(0, 10),
    viewCount: Number(v.view_count ?? 0),
    likeCount: Number(v.like_count ?? 0),
    commentCount: Number(v.comment_count ?? 0),
    shareCount: Number(v.share_count ?? 0),
  }));
}
