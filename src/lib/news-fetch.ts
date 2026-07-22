import "server-only";
import { NEWS_SOURCES, NewsSource } from "./news-sources";
import { fetchRssItems } from "./news-rss";
import { fetchScrapedHeadlines } from "./news-scrape";
import { fetchWpJsonItems } from "./news-wpjson";
import { mockNews } from "./claude/news-mock";
import { NewsItem, NewsResult } from "./news-types";

async function fetchSource(source: NewsSource): Promise<NewsItem[]> {
  const raw =
    source.type === "rss"
      ? await fetchRssItems(source.url, source.label)
      : source.type === "wp-json"
        ? await fetchWpJsonItems(source.apiBase, source.label)
        : await fetchScrapedHeadlines(source.url, source.selector, source.label);
  return raw.map((item) => ({ ...item, category: source.category }));
}

// Fixed list of Dominican news sites (src/lib/news-sources.ts), fetched directly via each site's
// RSS feed or a homepage scrape — no AI search involved, so results are only ever from the
// sites on that list.
export async function fetchAllNews(): Promise<NewsResult> {
  const generatedAt = new Date().toISOString();
  const results = await Promise.allSettled(NEWS_SOURCES.map(fetchSource));

  const items: NewsItem[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") items.push(...r.value);
    else failed.push(NEWS_SOURCES[i].label);
  });

  items.sort((a, b) => (b.publishedAtMs ?? 0) - (a.publishedAtMs ?? 0));

  if (items.length === 0) {
    return {
      items: mockNews(),
      source: "mock",
      generatedAt,
      note: "No se pudo conectar con ninguno de los sitios configurados en este momento. Mostrando ejemplo.",
    };
  }

  return {
    items,
    source: "sites",
    generatedAt,
    note: failed.length > 0 ? `No se pudo cargar: ${failed.join(", ")}.` : undefined,
  };
}
