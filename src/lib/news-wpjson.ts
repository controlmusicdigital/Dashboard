import "server-only";
import { NewsItem } from "./news-types";
import { NEWS_FETCH_HEADERS, cleanText, relativeTime } from "./news-text";

// Several WordPress-powered sites (Almomento, De Ultimo Minuto, MasVip, Luminarias TV,
// Dominican Today) don't include the featured image in their RSS feed at all — WordPress core
// RSS only ships title/excerpt/content, no thumbnail. Their REST API does have it, embedded via
// `_embed`, so those sources are fetched from wp-json instead of RSS.
interface WpMedia {
  source_url?: string;
  media_details?: { sizes?: Record<string, { source_url?: string }> };
}

interface WpPost {
  link?: string;
  date?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  featured_media?: number;
  _embedded?: { "wp:featuredmedia"?: WpMedia[] };
}

function extractEmbeddedImage(post: WpPost): string | undefined {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  return media?.media_details?.sizes?.medium?.source_url ?? media?.source_url;
}

// Some sites' REST API silently drops `_embedded` (seen on De Ultimo Minuto, likely a caching
// layer in front of it) even though `featured_media` still points at a real attachment — falls
// back to a direct per-post lookup of that attachment only when the embed didn't come through.
async function fetchMediaUrl(apiBase: string, mediaId: number): Promise<string | undefined> {
  try {
    const res = await fetch(`${apiBase}/wp-json/wp/v2/media/${mediaId}`, { headers: NEWS_FETCH_HEADERS, cache: "no-store" });
    if (!res.ok) return undefined;
    const media: WpMedia = await res.json();
    return media.media_details?.sizes?.medium?.source_url ?? media.source_url;
  } catch {
    return undefined;
  }
}

export async function fetchWpJsonItems(apiBase: string, sourceLabel: string, maxItems = 6): Promise<NewsItem[]> {
  const base = apiBase.replace(/\/$/, "");
  const res = await fetch(`${base}/wp-json/wp/v2/posts?per_page=${maxItems}&_embed`, { headers: NEWS_FETCH_HEADERS, cache: "no-store" });
  if (!res.ok) throw new Error(`${sourceLabel} respondio ${res.status}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error(`${sourceLabel} no devolvio una lista de articulos`);
  const posts = (data as WpPost[]).slice(0, maxItems);

  return (
    await Promise.all(
      posts.map(async (post): Promise<NewsItem | null> => {
        const title = cleanText(post.title?.rendered ?? "");
        const url = post.link ?? "";
        if (!title || !url) return null;
        const date = post.date ? new Date(post.date) : new Date();
        const imageUrl = extractEmbeddedImage(post) ?? (post.featured_media ? await fetchMediaUrl(base, post.featured_media) : undefined);
        return {
          title,
          summary: cleanText(post.excerpt?.rendered ?? "", 200),
          source: sourceLabel,
          url,
          publishedAt: relativeTime(date),
          publishedAtMs: isNaN(date.getTime()) ? 0 : date.getTime(),
          imageUrl,
        };
      })
    )
  ).filter((i): i is NewsItem => i !== null);
}
