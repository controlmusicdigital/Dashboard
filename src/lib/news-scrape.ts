import "server-only";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { NewsItem } from "./news-types";
import { NEWS_FETCH_HEADERS, cleanText, fetchOgImage } from "./news-text";

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
  const res = await fetch(pageUrl, { headers: NEWS_FETCH_HEADERS, cache: "no-store" });
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
      imageUrl: findNearbyImage($, el),
    });
  });

  // The homepage card had no nearby <img> for these — fall back to the article's og:image.
  await Promise.all(
    items.map(async (item) => {
      if (!item.imageUrl) item.imageUrl = await fetchOgImage(item.url);
    })
  );

  return items;
}

// Walks up from the headline link to its containing card/article and grabs the first <img> in
// it. Some sites (El Caribe) lazy-load images, leaving a data: URI placeholder in src and the
// real URL in data-lazy-src/data-src instead.
function findNearbyImage($: cheerio.CheerioAPI, el: AnyNode): string | undefined {
  let container = $(el).closest("article");
  if (container.length === 0) container = $(el).parents().eq(3);
  const img = container.find("img").first();
  if (img.length === 0) return undefined;

  const src = img.attr("data-lazy-src") || img.attr("data-src") || img.attr("src");
  if (!src || src.startsWith("data:")) return undefined;
  return src;
}
