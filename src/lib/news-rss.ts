import "server-only";
import { XMLParser } from "fast-xml-parser";
import { NewsItem } from "./news-types";
import { NEWS_FETCH_HEADERS, cleanText, relativeTime } from "./news-text";

// parseTagValue:false keeps every field a plain string — otherwise fast-xml-parser tries to
// coerce numeric-looking text (a headline that's just a number, an all-digit guid) into a JS number.
const parser = new XMLParser({ parseTagValue: false, trimValues: true });

interface RawRssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
}

export async function fetchRssItems(feedUrl: string, sourceLabel: string, maxItems = 6): Promise<NewsItem[]> {
  const res = await fetch(feedUrl, { headers: NEWS_FETCH_HEADERS });
  if (!res.ok) throw new Error(`${sourceLabel} respondio ${res.status}`);
  const xml = await res.text();
  const data = parser.parse(xml);

  const channel = data?.rss?.channel ?? data?.feed;
  const rawItems: RawRssItem[] = channel?.item ?? channel?.entry ?? [];
  const list = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return list
    .slice(0, maxItems)
    .map((item): NewsItem | null => {
      const title = cleanText(item.title ?? "");
      const url = String(item.link ?? "").trim();
      if (!title || !url) return null;
      const date = item.pubDate ? new Date(item.pubDate) : new Date();
      return {
        title,
        summary: cleanText(item.description ?? "", 200),
        source: sourceLabel,
        url,
        publishedAt: relativeTime(date),
        publishedAtMs: isNaN(date.getTime()) ? 0 : date.getTime(),
      };
    })
    .filter((i): i is NewsItem => i !== null);
}
