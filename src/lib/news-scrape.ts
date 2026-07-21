import "server-only";
import * as cheerio from "cheerio";
import { NewsItem } from "./news-types";
import { NEWS_FETCH_HEADERS, cleanText } from "./news-text";

// Sites with no RSS feed at all (El Caribe, Acento) — parse headlines straight out of the
// homepage HTML instead. There's no reliable per-article publish time on a homepage listing, so
// items are stamped with a synthetic, slightly-decreasing timestamp based on their position on
// the page (higher on the page = assumed more recent), just enough to interleave sensibly with
// real RSS timestamps from other sources without claiming false precision.
export async function fetchScrapedHeadlines(
  pageUrl: string,
  selector: string,
  sourceLabel: string,
  maxItems = 6
): Promise<NewsItem[]> {
  const res = await fetch(pageUrl, { headers: NEWS_FETCH_HEADERS });
  if (!res.ok) throw new Error(`${sourceLabel} respondio ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  const items: NewsItem[] = [];
  const now = Date.now();

  $(selector).each((_, el) => {
    if (items.length >= maxItems) return;
    const anchor = $(el);
    const title = cleanText(anchor.text());
    let url = anchor.attr("href") ?? "";
    if (!title || !url) return;
    if (url.startsWith("/")) url = new URL(url, pageUrl).toString();
    if (seen.has(url)) return;
    seen.add(url);
    items.push({
      title,
      summary: "",
      source: sourceLabel,
      url,
      publishedAt: "en portada",
      publishedAtMs: now - items.length * 60_000,
    });
  });

  return items;
}
