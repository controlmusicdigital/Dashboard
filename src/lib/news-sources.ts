export type NewsCategory = "nacional" | "rapido" | "farandula" | "ingles";

export const NEWS_CATEGORY_LABEL: Record<NewsCategory, string> = {
  nacional: "Nacional",
  rapido: "Ultima hora",
  farandula: "Farandula",
  ingles: "English",
};

interface RssSource {
  id: string;
  label: string;
  category: NewsCategory;
  type: "rss";
  url: string;
}

interface ScrapeSource {
  id: string;
  label: string;
  category: NewsCategory;
  type: "scrape";
  url: string;
  // CSS selector (cheerio) matching each headline's anchor element.
  selector: string;
}

interface WpJsonSource {
  id: string;
  label: string;
  category: NewsCategory;
  type: "wp-json";
  // Site root — the WordPress REST API lives at <apiBase>/wp-json/wp/v2/posts. Used instead of
  // RSS for WordPress sites whose feed doesn't carry a featured image.
  apiBase: string;
}

export type NewsSource = RssSource | ScrapeSource | WpJsonSource;

// Fixed, user-curated list of Dominican news sites — no AI search involved. Each site is
// fetched directly (RSS feed when the site has one, otherwise a homepage scrape) and merged.
export const NEWS_SOURCES: NewsSource[] = [
  // Mainstream & national breaking news
  { id: "listindiario", label: "Listin Diario", category: "nacional", type: "rss", url: "https://listindiario.com/rss/home.xml" },
  { id: "diariolibre", label: "Diario Libre", category: "nacional", type: "rss", url: "https://www.diariolibre.com/rss/portada.xml" },
  { id: "elnacional", label: "El Nacional", category: "nacional", type: "rss", url: "https://elnacional.com.do/rss/home.xml" },
  { id: "hoy", label: "Hoy", category: "nacional", type: "rss", url: "https://hoy.com.do/rss/home.xml" },

  // Fast digital portals & broadcast news
  { id: "noticiassin", label: "Noticias SIN", category: "rapido", type: "rss", url: "https://noticiassin.com/feed/" },
  { id: "almomento", label: "Al Momento", category: "rapido", type: "wp-json", apiBase: "https://almomento.net" },
  { id: "acento", label: "Acento", category: "rapido", type: "scrape", url: "https://acento.com.do", selector: ".entry-title a" },
  { id: "deultimominuto", label: "De Ultimo Minuto", category: "rapido", type: "wp-json", apiBase: "https://deultimominuto.net" },

  // Entertainment, showbiz & urban culture (farandula)
  { id: "masvip", label: "MasVip", category: "farandula", type: "wp-json", apiBase: "https://masvip.com.do" },
  { id: "luminariastv", label: "Luminarias TV", category: "farandula", type: "wp-json", apiBase: "https://luminariastv.com" },
  {
    id: "listindiario-entretenimiento",
    label: "Listin Diario Entretenimiento",
    category: "farandula",
    type: "rss",
    url: "https://listindiario.com/rss/entretenimiento.xml",
  },
  {
    id: "diariolibre-revista",
    label: "Diario Libre Revista",
    category: "farandula",
    type: "rss",
    url: "https://www.diariolibre.com/rss/revista.xml",
  },

  // English-language
  { id: "dominicantoday", label: "Dominican Today", category: "ingles", type: "wp-json", apiBase: "https://dominicantoday.com" },
];
