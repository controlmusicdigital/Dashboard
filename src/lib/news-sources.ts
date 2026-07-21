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

export type NewsSource = RssSource | ScrapeSource;

// Fixed, user-curated list of Dominican news sites — no AI search involved. Each site is
// fetched directly (RSS feed when the site has one, otherwise a homepage scrape) and merged.
export const NEWS_SOURCES: NewsSource[] = [
  // Mainstream & national breaking news
  { id: "listindiario", label: "Listin Diario", category: "nacional", type: "rss", url: "https://listindiario.com/rss/home.xml" },
  { id: "diariolibre", label: "Diario Libre", category: "nacional", type: "rss", url: "https://www.diariolibre.com/rss/portada.xml" },
  {
    id: "elcaribe",
    label: "El Caribe",
    category: "nacional",
    type: "scrape",
    url: "https://www.elcaribe.com.do",
    selector: ".entry-title a",
  },
  { id: "elnacional", label: "El Nacional", category: "nacional", type: "rss", url: "https://elnacional.com.do/rss/home.xml" },
  { id: "hoy", label: "Hoy", category: "nacional", type: "rss", url: "https://hoy.com.do/rss/home.xml" },

  // Fast digital portals & broadcast news
  { id: "noticiassin", label: "Noticias SIN", category: "rapido", type: "rss", url: "https://noticiassin.com/feed/" },
  { id: "almomento", label: "Al Momento", category: "rapido", type: "rss", url: "https://almomento.net/feed/" },
  { id: "acento", label: "Acento", category: "rapido", type: "scrape", url: "https://acento.com.do", selector: ".entry-title a" },
  { id: "deultimominuto", label: "De Ultimo Minuto", category: "rapido", type: "rss", url: "https://deultimominuto.net/feed/" },

  // Entertainment, showbiz & urban culture (farandula)
  { id: "masvip", label: "MasVip", category: "farandula", type: "rss", url: "https://masvip.com.do/feed/" },
  { id: "luminariastv", label: "Luminarias TV", category: "farandula", type: "rss", url: "https://luminariastv.com/feed/" },
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
  { id: "dominicantoday", label: "Dominican Today", category: "ingles", type: "rss", url: "https://dominicantoday.com/feed/" },
];
