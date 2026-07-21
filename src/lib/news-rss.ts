import "server-only";
import { XMLParser } from "fast-xml-parser";
import { NewsItem } from "./news-types";
import { NEWS_FETCH_HEADERS, cleanText, relativeTime } from "./news-text";

// parseTagValue:false keeps every field a plain string — otherwise fast-xml-parser tries to
// coerce numeric-looking text (a headline that's just a number, an all-digit guid) into a JS
// number. ignoreAttributes:false is needed to read image URLs out of <enclosure url="..."> and
// <media:content url="..."> attributes.
const parser = new XMLParser({ parseTagValue: false, trimValues: true, ignoreAttributes: false, attributeNamePrefix: "@_" });

interface MediaTag {
  "@_url"?: string;
  "@_medium"?: string;
  "@_type"?: string;
}

// A tag with its own XML attributes (e.g. Diario Libre's <description type="text/html">...)
// parses to {"#text": ..., "@_type": ...} instead of a plain string — everywhere a tag's text
// content is read, it has to tolerate both shapes.
type TextValue = string | { "#text"?: string } | undefined;

interface RawRssItem {
  title?: TextValue;
  link?: TextValue;
  description?: TextValue;
  pubDate?: TextValue;
  enclosure?: MediaTag;
  "media:content"?: MediaTag | MediaTag[];
  "media:thumbnail"?: MediaTag | MediaTag[];
  "content:encoded"?: TextValue;
}

function textOf(value: TextValue): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value["#text"] ?? "";
  return "";
}

function firstImgSrc(html: string): string | undefined {
  const match = /<img[^>]+src="([^"]+)"/i.exec(html);
  return match?.[1];
}

function isImageUrl(url: string | undefined): url is string {
  return Boolean(url && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url));
}

function pickMediaUrl(tag: MediaTag | MediaTag[] | undefined): string | undefined {
  const list = Array.isArray(tag) ? tag : tag ? [tag] : [];
  const image = list.find((t) => t["@_medium"] === "image" || t["@_type"]?.startsWith("image/") || isImageUrl(t["@_url"]));
  return image?.["@_url"] ?? list[0]?.["@_url"];
}

function extractImage(item: RawRssItem): string | undefined {
  const content = textOf(item["content:encoded"]);
  const description = textOf(item.description);
  return (
    pickMediaUrl(item["media:content"]) ??
    pickMediaUrl(item["media:thumbnail"]) ??
    (item.enclosure?.["@_type"]?.startsWith("image/") ? item.enclosure["@_url"] : undefined) ??
    (content ? firstImgSrc(content) : undefined) ??
    (description ? firstImgSrc(description) : undefined)
  );
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
      const title = cleanText(textOf(item.title));
      const url = textOf(item.link).trim();
      if (!title || !url) return null;
      const pubDate = textOf(item.pubDate);
      const date = pubDate ? new Date(pubDate) : new Date();
      return {
        title,
        summary: cleanText(textOf(item.description), 200),
        source: sourceLabel,
        url,
        publishedAt: relativeTime(date),
        publishedAtMs: isNaN(date.getTime()) ? 0 : date.getTime(),
        imageUrl: extractImage(item),
      };
    })
    .filter((i): i is NewsItem => i !== null);
}
