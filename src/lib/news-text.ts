// Some feeds don't decode numeric/named HTML entities in their raw XML text (seen on Diario
// Libre's titles, e.g. "investigaci&#243;n"), so this is applied on top of whatever the XML/HTML
// parser already handled, not instead of it.
function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function cleanText(raw: string, maxLen?: number): string {
  const withoutTags = raw.replace(/<[^>]+>/g, " ");
  const decoded = decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
  return maxLen ? decoded.slice(0, maxLen) : decoded;
}

export function relativeTime(date: Date): string {
  if (isNaN(date.getTime())) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return date.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
}

// A real browser UA + Accept header — several DR news sites (Luminarias TV, and presumably
// others) return 406/blocked responses to bare server-side fetches without these.
export const NEWS_FETCH_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-DO,es;q=0.9",
};

// Last-resort image lookup for the handful of items where the feed/scrape has no usable image
// (e.g. Noticias SIN's RSS carries no thumbnail at all, and its wp-json API 403s) — fetches the
// article page itself and reads its og:image/twitter:image meta tag. Bounded to 8s so one slow
// article page can't stall the whole /api/news response.
export async function fetchOgImage(articleUrl: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(articleUrl, { headers: NEWS_FETCH_HEADERS, cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return undefined;
    const html = await res.text();
    const match =
      /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i.exec(html);
    return match?.[1];
  } catch {
    return undefined;
  }
}
